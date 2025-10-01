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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily notification check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking for tasks on:', today);
    
    // Get all users with push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription');
    
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }
    
    console.log(`Found ${subscriptions?.length || 0} subscriptions`);
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const notificationsSent = [];
    
    // Check each user's tasks
    for (const sub of subscriptions) {
      const userId = sub.user_id;
      console.log(`Checking tasks for user: ${userId}`);
      
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false);
      
      // Fetch events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);
      
      // Fetch daily tasks
      const { data: dailyTasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .eq('task_date', today);
      
      // Filter for today
      const todayTasks = tasks?.filter(task => 
        new Date(task.deadline).toISOString().split('T')[0] === today
      ) || [];
      
      const todayEvents = events?.filter(event => 
        new Date(event.start_time).toISOString().split('T')[0] === today
      ) || [];
      
      const todayDailyTasks = dailyTasks || [];
      
      console.log(`User ${userId}: ${todayTasks.length} tasks, ${todayEvents.length} events, ${todayDailyTasks.length} daily tasks`);
      
      // Send notifications if there are items today
      const messages = [];
      
      if (todayTasks.length > 0) {
        messages.push(`📋 You have ${todayTasks.length} task(s) due today`);
      }
      
      if (todayEvents.length > 0) {
        messages.push(`📅 You have ${todayEvents.length} event(s) scheduled today`);
      }
      
      if (todayDailyTasks.length > 0) {
        messages.push(`✅ You have ${todayDailyTasks.length} daily task(s) pending`);
      }
      
      if (messages.length > 0) {
        try {
          const pushSubscription = sub.subscription as PushSubscription;
          
          // Send push notification using Web Push API
          const notificationPayload = {
            title: '🌅 Good Morning! Your Tasks for Today',
            body: messages.join('\n'),
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            tag: 'daily-reminder',
            data: {
              url: '/',
              dateTime: new Date().toISOString()
            }
          };
          
          // Use web-push library equivalent
          const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
          const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
          
          if (!vapidPublicKey || !vapidPrivateKey) {
            console.error('VAPID keys not configured');
            continue;
          }
          
          // Import web-push for sending notifications
          const webpush = await import('npm:web-push@3.6.7');
          
          webpush.setVapidDetails(
            'mailto:notifications@yourdomain.com',
            vapidPublicKey,
            vapidPrivateKey
          );
          
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );
          
          console.log(`Notification sent to user ${userId}`);
          notificationsSent.push(userId);
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Daily notifications processed',
        notificationsSent: notificationsSent.length,
        totalSubscriptions: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-daily-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});