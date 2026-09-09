import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function thDateString(d: Date): string {
  return new Date(d.getTime() + TH_OFFSET_MS).toISOString().split('T')[0];
}

function thTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const shifted = new Date(d.getTime() + TH_OFFSET_MS);
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
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

type LineMessage =
  | { type: 'text'; text: string }
  | { type: 'image'; originalContentUrl: string; previewImageUrl: string };

async function pushMessages(token: string, to: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE push failed ${res.status}: ${body}`);
  }
}

async function pushMessage(token: string, to: string, text: string) {
  await pushMessages(token, to, [{ type: 'text', text: text.slice(0, 4900) }]);
}

// Signed https URLs for image attachments LINE can fetch (JPEG/PNG only).
async function imageMessages(
  supabase: ReturnType<typeof createClient>,
  attachments: unknown,
): Promise<LineMessage[]> {
  const list = Array.isArray(attachments) ? attachments : [];
  const images = list.filter(
    (a: Record<string, unknown>) =>
      typeof a?.type === 'string' && /^image\/(jpeg|jpg|png)$/i.test(a.type as string) && typeof a?.path === 'string',
  );
  const out: LineMessage[] = [];
  for (const img of images) {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(img.path as string, 60 * 60 * 24);
    if (data?.signedUrl) {
      out.push({ type: 'image', originalContentUrl: data.signedUrl, previewImageUrl: data.signedUrl });
    }
  }
  return out;
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

    // Auth: either the cron secret, or a signed-in user asking for a test message
    const cronSecret = req.headers.get('x-cron-secret');
    const validSecrets = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
    const isCron = !!cronSecret && validSecrets.includes(cronSecret);

    let targetUserId: string | null = null;
    if (!isCron) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) return json({ error: 'Unauthorized' }, 401);
      targetUserId = userData.user.id;
    }

    let query = supabase
      .from('line_links')
      .select('user_id, line_user_id, display_name')
      .not('line_user_id', 'is', null)
      .eq('is_enabled', true);
    if (targetUserId) query = query.eq('user_id', targetUserId);

    const { data: links, error: linksError } = await query;
    if (linksError) throw linksError;
    if (!links || links.length === 0) return json({ message: 'No linked LINE accounts', sent: 0 });

    const today = thDateString(new Date());
    let sent = 0;
    const failures: string[] = [];

    for (const link of links) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('title, description, deadline, start_date, recurrence_unit, recurrence_interval, tag_ids, attachments')
          .eq('user_id', link.user_id)
          .eq('is_completed', false);

        const { data: events } = await supabase
          .from('events')
          .select('title, description, start_time, deadline, tag_ids, attachments')
          .eq('user_id', link.user_id);

        const { data: tags } = await supabase
          .from('tags')
          .select('id, name')
          .eq('user_id', link.user_id);

        // Only include items that actually start today OR are due today.
        // Ongoing items (started before today and due after today) are excluded.
        const matchesToday = (from: string | null, to: string | null) => {
          const s = from ? thDateString(new Date(from)) : null;
          const e = to ? thDateString(new Date(to)) : null;
          return s === today || e === today;
        };

        // For recurring tasks, check whether a specific anchor date (start or deadline)
        // recurs on today's date.
        const recurrenceHitsToday = (
          anchorIso: string | null,
          unit: string | null,
          intervalRaw: number | null,
        ) => {
          if (!anchorIso || !unit) return false;
          const interval = Math.max(1, intervalRaw ?? 1);
          const anchor = new Date(new Date(anchorIso).getTime() + TH_OFFSET_MS);
          const now = new Date(new Date().getTime() + TH_OFFSET_MS);
          const anchorDay = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
          const todayDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          if (todayDay < anchorDay) return false;
          const dayDiff = Math.round((todayDay - anchorDay) / 86400000);
          switch (unit) {
            case 'day':
            case 'days':
              return dayDiff % interval === 0;
            case 'week':
            case 'weeks':
              return dayDiff % (7 * interval) === 0;
            case 'month':
            case 'months': {
              const months =
                (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());
              return months >= 0 && months % interval === 0 && now.getUTCDate() === anchor.getUTCDate();
            }
            case 'year':
            case 'years': {
              const years = now.getUTCFullYear() - anchor.getUTCFullYear();
              return (
                years >= 0 &&
                years % interval === 0 &&
                now.getUTCMonth() === anchor.getUTCMonth() &&
                now.getUTCDate() === anchor.getUTCDate()
              );
            }
            default:
              return false;
          }
        };

        const tagMap = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
        const formatTags = (tagIds: string[] | null) => {
          if (!tagIds || tagIds.length === 0) return '';
          const names = tagIds.map((id) => tagMap.get(id)).filter(Boolean) as string[];
          return names.length > 0 ? ` 🏷 ${names.join(', ')}` : '';
        };

        const todayTasks = (tasks ?? []).filter((t) => {
          if (t.recurrence_unit) {
            return (
              recurrenceHitsToday(t.start_date, t.recurrence_unit, t.recurrence_interval) ||
              recurrenceHitsToday(t.deadline, t.recurrence_unit, t.recurrence_interval)
            );
          }
          return matchesToday(t.start_date, t.deadline);
        });

        const todayEvents = (events ?? []).filter((e) => matchesToday(e.start_time, e.deadline));

        const toasts = [
          'Have a wonderful day!',
          "You've got this!",
          'Take it one step at a time.',
          'Make today count!',
          'Stay positive and keep going!',
          'March 7th believes in you!',
          "Let's get things done today!",
        ];
        const toast = toasts[Math.floor(Math.random() * toasts.length)];

        const lines: string[] = [`🌅 Good morning! ${today} (Thai time)`, ''];

        if (todayTasks.length === 0 && todayEvents.length === 0) {
          lines.push('✨ Your day is clear — no tasks and no events. Enjoy it~ 📸');
        } else {
          if (todayEvents.length > 0) {
            lines.push(`📅 Events (${todayEvents.length})`);
            for (const e of todayEvents) {
              const start = thTime(e.start_time);
              const due = thTime(e.deadline);
              const tagStr = formatTags(e.tag_ids);
              const detail = formatDetail(e.description);
              lines.push(`Name : ${e.title}`);
              lines.push(`Detail :`);
              lines.push(detail ?? '-');
              lines.push(`Start time - deadline: ${start ?? '-'} - ${due ?? '-'}`);
              lines.push(`Tag : ${tagStr || '-'}`);
              lines.push('');
            }
          }
          if (todayTasks.length > 0) {
            lines.push(`📋 Tasks (${todayTasks.length})`);
            for (const t of todayTasks) {
              const start = thTime(t.start_date);
              const due = thTime(t.deadline);
              const tagStr = formatTags(t.tag_ids);
              const detail = formatDetail(t.description);
              lines.push(`Name : ${t.title}`);
              lines.push(`Detail :`);
              lines.push(detail ?? '-');
              lines.push(`Start time - deadline: ${start ?? '-'} - ${due ?? '-'}`);
              lines.push(`Tag : ${tagStr || '-'}`);
              lines.push('');
            }
          }
        }

        lines.push(`"${toast}"`);

        const images: LineMessage[] = [];
        for (const item of [...todayEvents, ...todayTasks]) {
          if (images.length >= 4) break;
          images.push(...(await imageMessages(supabase, (item as Record<string, unknown>).attachments)));
        }

        await pushMessages(accessToken, link.line_user_id as string, [
          { type: 'text', text: lines.join('\n').trim().slice(0, 4900) },
          ...images.slice(0, 4),
        ]);
        sent++;
      } catch (err) {
        console.error(`Failed for user ${link.user_id}:`, err);
        failures.push(String(err));
      }
    }

    return json({ message: 'Daily LINE digest processed', sent, failures });
  } catch (error) {
    console.error('send-line-daily error:', error);
    return json({ error: (error as Error).message }, 500);
  }
});
