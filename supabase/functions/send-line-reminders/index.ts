import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function thTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const shifted = new Date(d.getTime() + TH_OFFSET_MS);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/==(.*?)==/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

function formatDetail(text: string | null): string | null {
  if (!text) return null;
  const clean = stripMarkdown(text).trim();
  if (!clean) return null;
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length <= 5) return lines.join('\n');
  return [...lines.slice(0, 5), '...'].join('\n');
}

async function pushMessage(token: string, to: string, text: string) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
  });
  if (!res.ok) throw new Error(`LINE push failed ${res.status}: ${await res.text()}`);
}

// Does a recurring anchor fall on the given TH day, and if so at what UTC instant?
function recurrenceOccurrenceToday(
  anchorIso: string | null,
  unit: string | null,
  intervalRaw: number | null,
  nowUtc: Date,
): Date | null {
  if (!anchorIso || !unit) return null;
  const interval = Math.max(1, intervalRaw ?? 1);
  const anchor = new Date(anchorIso);
  if (isNaN(anchor.getTime())) return null;
  const anchorTh = new Date(anchor.getTime() + TH_OFFSET_MS);
  const nowTh = new Date(nowUtc.getTime() + TH_OFFSET_MS);
  const anchorDay = Date.UTC(anchorTh.getUTCFullYear(), anchorTh.getUTCMonth(), anchorTh.getUTCDate());
  const todayDay = Date.UTC(nowTh.getUTCFullYear(), nowTh.getUTCMonth(), nowTh.getUTCDate());
  if (todayDay < anchorDay) return null;
  const dayDiff = Math.round((todayDay - anchorDay) / 86400000);

  let hit = false;
  switch (unit) {
    case 'day':
    case 'days':
      hit = dayDiff % interval === 0;
      break;
    case 'week':
    case 'weeks':
      hit = dayDiff % (7 * interval) === 0;
      break;
    case 'month':
    case 'months': {
      const months =
        (nowTh.getUTCFullYear() - anchorTh.getUTCFullYear()) * 12 + (nowTh.getUTCMonth() - anchorTh.getUTCMonth());
      hit = months >= 0 && months % interval === 0 && nowTh.getUTCDate() === anchorTh.getUTCDate();
      break;
    }
    case 'year':
    case 'years': {
      const years = nowTh.getUTCFullYear() - anchorTh.getUTCFullYear();
      hit =
        years >= 0 &&
        years % interval === 0 &&
        nowTh.getUTCMonth() === anchorTh.getUTCMonth() &&
        nowTh.getUTCDate() === anchorTh.getUTCDate();
      break;
    }
  }
  if (!hit) return null;
  // Same clock time as the anchor, but on today's TH date.
  return new Date(anchor.getTime() + (todayDay - anchorDay));
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
      .select('user_id, line_user_id, reminders_enabled')
      .not('line_user_id', 'is', null)
      .eq('reminders_enabled', true);
    if (targetUserId) query = query.eq('user_id', targetUserId);

    const { data: links, error: linksError } = await query;
    if (linksError) throw linksError;
    if (!links || links.length === 0) return json({ message: 'No linked LINE accounts', sent: 0 });

    const now = new Date();
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);
    const inWindow = (d: Date | null) => !!d && d >= windowStart && d < windowEnd;

    let sent = 0;
    const failures: string[] = [];

    for (const link of links) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, start_date, deadline, recurrence_unit, recurrence_interval, tag_ids')
          .eq('user_id', link.user_id)
          .eq('is_completed', false);

        const { data: events } = await supabase
          .from('events')
          .select('id, title, description, start_time, deadline, tag_ids')
          .eq('user_id', link.user_id);

        const { data: tags } = await supabase.from('tags').select('id, name').eq('user_id', link.user_id);
        const tagMap = new Map((tags ?? []).map((t) => [t.id, t.name]));
        const formatTags = (ids: string[] | null) => {
          const names = (ids ?? []).map((id) => tagMap.get(id)).filter(Boolean) as string[];
          return names.length ? names.join(', ') : '-';
        };

        type Due = {
          type: 'task' | 'event';
          id: string;
          title: string;
          description: string | null;
          occurrence: Date;
          deadline: string | null;
          tag_ids: string[] | null;
        };
        const due: Due[] = [];

        for (const t of tasks ?? []) {
          let occ: Date | null = null;
          if (t.recurrence_unit) {
            occ = recurrenceOccurrenceToday(t.start_date, t.recurrence_unit, t.recurrence_interval, now);
          } else if (t.start_date) {
            occ = new Date(t.start_date);
          }
          if (inWindow(occ)) {
            due.push({
              type: 'task',
              id: t.id,
              title: t.title,
              description: t.description,
              occurrence: occ as Date,
              deadline: t.deadline,
              tag_ids: t.tag_ids,
            });
          }
        }

        for (const e of events ?? []) {
          const occ = e.start_time ? new Date(e.start_time) : null;
          if (inWindow(occ)) {
            due.push({
              type: 'event',
              id: e.id,
              title: e.title,
              description: e.description,
              occurrence: occ as Date,
              deadline: e.deadline,
              tag_ids: e.tag_ids,
            });
          }
        }

        for (const item of due) {
          const occurrenceIso = item.occurrence.toISOString();
          const { error: markErr } = await supabase.from('line_reminders_sent').insert({
            user_id: link.user_id,
            item_type: item.type,
            item_id: item.id,
            occurrence_at: occurrenceIso,
          });
          if (markErr) continue; // already sent (unique violation) or insert failed

          const minsLeft = Math.max(1, Math.round((item.occurrence.getTime() - now.getTime()) / 60000));
          const lines = [
            `⏰ Starting in ${minsLeft} min!`,
            '',
            `${item.type === 'event' ? '📅 Event' : '📋 Task'}`,
            `Name : ${item.title}`,
            'Detail :',
            formatDetail(item.description) ?? '-',
            `Start time - deadline: ${thTime(occurrenceIso) ?? '-'} - ${thTime(item.deadline) ?? '-'}`,
            `Tag : ${formatTags(item.tag_ids)}`,
          ];

          await pushMessage(accessToken, link.line_user_id as string, lines.join('\n').trim());
          sent++;
        }
      } catch (err) {
        console.error(`Reminder failed for user ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }

    return json({ message: 'LINE reminders processed', sent, failures });
  } catch (error) {
    console.error('send-line-reminders error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
