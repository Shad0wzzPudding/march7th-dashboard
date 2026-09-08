import { createClient } from 'jsr:@supabase/supabase-js@2';

const LINE_API = 'https://api.line.me/v2/bot';

function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function verifySignature(secret: string, body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = base64(mac);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

async function reply(token: string, replyToken: string, text: string) {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) console.error('LINE reply failed', res.status, await res.text());
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!channelSecret || !accessToken) {
    console.error('LINE secrets not configured');
    return new Response('Not configured', { status: 500 });
  }

  const raw = await req.text();
  const ok = await verifySignature(channelSecret, raw, req.headers.get('x-line-signature'));
  if (!ok) {
    console.log('Invalid LINE signature');
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let payload: { events?: any[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  for (const event of payload.events ?? []) {
    try {
      const lineUserId: string | undefined = event?.source?.userId;
      const replyToken: string | undefined = event.replyToken;

      if (event.type === 'follow' && replyToken) {
        await fetch(`${LINE_API}/message/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            replyToken,
            messages: [{
              type: 'text',
              text: 'Hi! 📸 To connect me with your account, open the app\'s Settings page and tap the "Open LINE to link" button — or type your link code here.\nCommands: status / stop / start',
            }],
          }),
        });
        continue;
      }

      if (event.type === 'message' && event.message?.type === 'text' && lineUserId && replyToken) {
        const text = String(event.message.text ?? '').trim();
        const code = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (/^(STATUS)$/i.test(text)) {
          const { data } = await supabase
            .from('line_links')
            .select('is_enabled, reminders_enabled')
            .eq('line_user_id', lineUserId)
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `You're linked!\nDaily digest: ${data.is_enabled ? 'ON' : 'OFF'} (08:00 Thai time)\nStart reminders: ${data.reminders_enabled ? 'ON' : 'OFF'} (10-15 min before)`
              : "You're not linked yet. Send me the link code from the app's Settings page.",
          );
          continue;
        }

        if (/^(REMIND(ER)?S?)\s*(ON|OFF|START|STOP)$/i.test(text)) {
          const enable = /(ON|START)$/i.test(text);
          const { data } = await supabase
            .from('line_links')
            .update({ reminders_enabled: enable })
            .eq('line_user_id', lineUserId)
            .select('id')
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `Start reminders turned ${enable ? 'ON' : 'OFF'}~ (sent 10-15 min before something starts)`
              : "You're not linked yet. Send me the link code from the app's Settings page.",
          );
          continue;
        }

        if (/^(STOP|OFF)$/i.test(text) || /^(START|ON)$/i.test(text)) {
          const enable = /^(START|ON)$/i.test(text);
          const { data } = await supabase
            .from('line_links')
            .update({ is_enabled: enable })
            .eq('line_user_id', lineUserId)
            .select('id')
            .maybeSingle();
          await reply(
            accessToken,
            replyToken,
            data
              ? `Daily digest turned ${enable ? 'ON' : 'OFF'}~`
              : "You're not linked yet. Send me the link code from the app's Settings page.",
          );
          continue;
        }

        if (code.length >= 6 && code.length <= 12) {
          const { data: link } = await supabase
            .from('line_links')
            .select('id, user_id')
            .eq('link_code', code)
            .maybeSingle();

          if (link) {
            // Free the code from any other LINE account first
            await supabase
              .from('line_links')
              .update({ line_user_id: null })
              .eq('line_user_id', lineUserId)
              .neq('id', link.id);

            let displayName: string | null = null;
            try {
              const profRes = await fetch(`${LINE_API}/profile/${lineUserId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (profRes.ok) displayName = (await profRes.json())?.displayName ?? null;
            } catch (_) { /* ignore */ }

            await supabase
              .from('line_links')
              .update({
                line_user_id: lineUserId,
                display_name: displayName,
                linked_at: new Date().toISOString(),
                is_enabled: true,
              })
              .eq('id', link.id);

            await reply(
              accessToken,
              replyToken,
              `Linked successfully${displayName ? `, ${displayName}` : ''}! 📸\nI'll message you every morning at 08:00 (Thai time) with your tasks and events.\n\nSend "stop" to pause, "start" to resume, "status" to check.`,
            );
            continue;
          }
        }

        await reply(
          accessToken,
          replyToken,
          'Hi! Send me the link code shown in the app\'s Settings page to connect your account.\nCommands: status / stop / start',
        );
      }
    } catch (err) {
      console.error('Error handling LINE event:', err);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
