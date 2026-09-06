const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'LINE not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.line.me/v2/bot/info', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `LINE API error ${res.status}` }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const info = await res.json();
  return new Response(
    JSON.stringify({ basicId: info.basicId ?? null, displayName: info.displayName ?? null }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
