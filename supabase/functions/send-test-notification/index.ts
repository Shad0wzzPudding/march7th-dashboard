import { createClient } from 'jsr:@supabase/supabase-js@2';
import { setVapidDetails, sendNotification } from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Sending test notification for user:', user.id);

    // Get user's push subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user.id);

    if (subError) {
      console.error('Error fetching subscription:', subError);
      throw new Error('Failed to fetch push subscription');
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No push subscription found. Please enable notifications first.' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const subscription = subscriptions[0].subscription as PushSubscription['subscription'];

    // Configure VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:test@example.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    // Send test notification
    const payload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'Great! Your notifications are working perfectly.',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'test-notification',
      requireInteraction: false,
    });

    await sendNotification(subscription, payload);

    console.log('Test notification sent successfully to user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test notification sent successfully!'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error sending test notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send test notification'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
