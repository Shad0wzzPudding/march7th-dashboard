import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function thDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const s = new Date(d.getTime() + TH_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)} ${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/==(.*?)==/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

function formatDetail(text: string | null): string {
  if (!text) return '-';
  const lines = stripMarkdown(text).split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '-';
  if (lines.length <= 5) return lines.join('\n');
  return [...lines.slice(0, 5), '...'].join('\n');
}

const NUDGES = [
  'Past due, but not past hope! Let\'s knock it out~ 📸',
  'This one slipped by — want to finish it now?',
  'Deadline\'s gone, the task is still waiting for you!',
  'Late is better than never. You got this!',
];

async function pushText(token: string, to: string, text: string) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
  });
  if (!res.ok) throw new Error(`LINE push failed ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) return json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, 500);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    const isCron = !!cronSecret && validSecrets.includes(cronSecret);

    let targetUserId: string | null = null;
    if (!isCron) {
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
      targetUserId = userData.user.id;
    }

    let query = supabase
      .from('line_links')
      .select('user_id, line_user_id, overdue_enabled')
      .not('line_user_id', 'is', null)
      .eq('overdue_enabled', true);
    if (targetUserId) query = query.eq('user_id', targetUserId);

    const { data: links, error: linksError } = await query;
    if (linksError) throw linksError;
    if (!links || links.length === 0) return json({ message: 'No linked LINE accounts', sent: 0 });

    const now = new Date();
    // Only nudge for deadlines missed within the last 7 days, so old items stay quiet.
    const floor = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let sent = 0;
    const failures: string[] = [];

    for (const link of links) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, deadline, tag_ids')
          .eq('user_id', link.user_id)
          .eq('is_completed', false)
          .is('recurrence_unit', null)
          .not('deadline', 'is', null)
          .lt('deadline', now.toISOString())
          .gte('deadline', floor.toISOString());

        const { data: events } = await supabase
          .from('events')
          .select('id, title, description, deadline, tag_ids')
          .eq('user_id', link.user_id)
          .not('deadline', 'is', null)
          .lt('deadline', now.toISOString())
          .gte('deadline', floor.toISOString());

        const { data: tags } = await supabase.from('tags').select('id, name').eq('user_id', link.user_id);
        const tagMap = new Map((tags ?? []).map((t) => [t.id, t.name]));
        const formatTags = (ids: string[] | null) => {
          const names = (ids ?? []).map((id) => tagMap.get(id)).filter(Boolean) as string[];
          return names.length ? names.join(', ') : '-';
        };

        type Missed = {
          type: 'task' | 'event';
          id: string;
          title: string;
          description: string | null;
          deadline: string;
          tag_ids: string[] | null;
        };

        const missed: Missed[] = [
          ...(tasks ?? []).map((t) => ({ ...t, type: 'task' as const })),
          ...(events ?? []).map((e) => ({ ...e, type: 'event' as const })),
        ] as Missed[];

        for (const item of missed) {
          // One nudge per item per deadline (unique index on the sent table).
          const { error: markErr } = await supabase.from('line_reminders_sent').insert({
            user_id: link.user_id,
            item_type: `${item.type}_overdue`,
            item_id: item.id,
            occurrence_at: item.deadline,
          });
          if (markErr) continue;

          const lines = [
            '⚠️ Missed deadline!',
            '',
            item.type === 'event' ? '📅 Event' : '📋 Task',
            `Name : ${item.title}`,
            'Detail :',
            formatDetail(item.description),
            `Deadline was : ${thDateTime(item.deadline)}`,
            `Tag : ${formatTags(item.tag_ids)}`,
            '',
            `"${NUDGES[Math.floor(Math.random() * NUDGES.length)]}"`,
          ];

          await pushText(accessToken, link.line_user_id as string, lines.join('\n'));
          sent++;
        }
      } catch (err) {
        console.error(`Overdue nudge failed for user ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }

    return json({ message: 'LINE overdue nudges processed', sent, failures });
  } catch (error) {
    console.error('send-line-overdue error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
