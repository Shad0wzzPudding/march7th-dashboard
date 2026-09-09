// One-off setup: creates the LINE rich menu (chat buttons) and sets it as default.
// POST { image_base64 } with header x-cron-secret.
const LINE_API = 'https://api.line.me/v2/bot';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) return json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' }, 500);

  const secret = req.headers.get('x-cron-secret');
  const valid = [Deno.env.get('CRON_SECRET'), Deno.env.get('LINE_CRON_SECRET')].filter(Boolean);
  if (!secret || !valid.includes(secret)) return json({ error: 'Unauthorized' }, 401);

  let body: { image_base64?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.image_base64 || typeof body.image_base64 !== 'string') {
    return json({ error: 'image_base64 is required' }, 400);
  }

  const width = 2500;
  const height = 843;
  const cell = Math.floor(width / 4);
  const labels = [
    { label: 'Today', data: 'today' },
    { label: 'Status', data: 'status' },
    { label: 'Remind on', data: 'remind on' },
    { label: 'Remind off', data: 'remind off' },
  ];

  const richMenu = {
    size: { width, height },
    selected: true,
    name: 'March 7th menu',
    chatBarText: 'Menu 📸',
    areas: labels.map((b, i) => ({
      bounds: { x: i * cell, y: 0, width: cell, height },
      action: { type: 'postback', label: b.label, data: b.data, displayText: b.label },
    })),
  };

  // Remove previous menus so buttons never stack up
  try {
    const listRes = await fetch(`${LINE_API}/richmenu/list`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listRes.ok) {
      const list = await listRes.json();
      for (const m of list.richmenus ?? []) {
        await fetch(`${LINE_API}/richmenu/${m.richMenuId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }
  } catch (err) {
    console.error('Failed clearing old rich menus', err);
  }

  const createRes = await fetch(`${LINE_API}/richmenu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(richMenu),
  });
  if (!createRes.ok) return json({ error: 'create failed', detail: await createRes.text() }, 500);
  const { richMenuId } = await createRes.json();

  const bin = Uint8Array.from(atob(body.image_base64), (c) => c.charCodeAt(0));
  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${accessToken}` },
    body: bin,
  });
  if (!uploadRes.ok) return json({ error: 'upload failed', detail: await uploadRes.text() }, 500);

  const defaultRes = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!defaultRes.ok) return json({ error: 'set default failed', detail: await defaultRes.text() }, 500);

  return json({ message: 'Rich menu ready', richMenuId });
});
