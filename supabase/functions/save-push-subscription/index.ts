import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SubscriptionBody {
  subscription?: PushSubscription;
}

// Validate push subscription structure and content
function validateSubscription(subscription: any): subscription is PushSubscription {
  // Check basic structure
  if (!subscription || typeof subscription !== 'object') {
    return false;
  }

  // Validate endpoint
  if (!subscription.endpoint || typeof subscription.endpoint !== 'string') {
    return false;
  }

  // Check endpoint length (max 4KB for safety)
  if (subscription.endpoint.length > 4096) {
    return false;
  }

  // Validate endpoint is from known push services
  const validPushDomains = [
    'fcm.googleapis.com',
    'updates.push.services.mozilla.com',
    'android.googleapis.com',
    'push.apple.com',
    'wns.windows.com',
    'updates-autopush.stage.mozaws.net',
    'updates-autopush.dev.mozaws.net',
  ];

  try {
    const url = new URL(subscription.endpoint);
    const isValidDomain = validPushDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );
    
    if (!isValidDomain) {
      console.warn('Push endpoint from unrecognized domain:', url.hostname);
      // Allow it but log warning - new push services may emerge
    }
  } catch {
    return false; // Invalid URL format
  }

  // Validate keys object
  if (!subscription.keys || typeof subscription.keys !== 'object') {
    return false;
  }

  // Validate p256dh key
  if (!subscription.keys.p256dh || typeof subscription.keys.p256dh !== 'string') {
    return false;
  }
  if (subscription.keys.p256dh.length < 20 || subscription.keys.p256dh.length > 200) {
    return false;
  }

  // Validate auth key
  if (!subscription.keys.auth || typeof subscription.keys.auth !== 'string') {
    return false;
  }
  if (subscription.keys.auth.length < 10 || subscription.keys.auth.length > 100) {
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SubscriptionBody;
    const subscription = body.subscription;

    // Validate subscription structure and content
    if (!validateSubscription(subscription)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid subscription payload',
          details: 'Subscription must include valid endpoint URL and encryption keys'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt upsert first, then fallback to insert
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert([
        {
          user_id: user.id,
          subscription,
        },
      ], { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Upsert failed, trying insert:', upsertError);
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert([
          {
            user_id: user.id,
            subscription,
          },
        ]);
      if (insertError) {
        console.error('Insert also failed:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save subscription', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Unexpected error saving subscription:', e);
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
