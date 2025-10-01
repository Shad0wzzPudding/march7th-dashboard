// Service Worker for background notifications and push notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {
    title: 'New Notification',
    body: 'You have updates',
    icon: '/icon-512.png'
  };
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-512.png',
    badge: data.badge || '/icon-512.png',
    tag: data.tag || 'notification',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-tasks') {
    event.waitUntil(checkTodaysTasks());
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

async function checkTodaysTasks() {
  try {
    // Get stored task data
    const tasks = await getStoredData('tasks');
    const events = await getStoredData('events');
    const dailyTasks = await getStoredData('dailyTasks');
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Check for tasks due today
    const todayTasks = tasks?.filter(task => 
      !task.is_completed && 
      new Date(task.deadline).toISOString().split('T')[0] === today
    ) || [];
    
    // Check for events today
    const todayEvents = events?.filter(event => 
      new Date(event.start_time).toISOString().split('T')[0] === today
    ) || [];
    
    // Check for daily tasks
    const todayDailyTasks = dailyTasks?.filter(task => 
      !task.is_completed && 
      task.task_date === today
    ) || [];
    
    // Send notifications
    if (todayTasks.length > 0) {
      await self.registration.showNotification('Tasks Due Today', {
        body: `You have ${todayTasks.length} task(s) due today`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'tasks-due',
        data: { type: 'tasks', count: todayTasks.length }
      });
    }
    
    if (todayEvents.length > 0) {
      await self.registration.showNotification('Events Today', {
        body: `You have ${todayEvents.length} event(s) scheduled today`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'events-today',
        data: { type: 'events', count: todayEvents.length }
      });
    }
    
    if (todayDailyTasks.length > 0) {
      await self.registration.showNotification('Daily Tasks', {
        body: `You have ${todayDailyTasks.length} daily task(s) pending`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'daily-tasks',
        data: { type: 'daily-tasks', count: todayDailyTasks.length }
      });
    }
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
}

async function getStoredData(key) {
  try {
    const cache = await caches.open('dashboard-data');
    const response = await cache.match(`/${key}`);
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Error getting stored ${key}:`, error);
  }
  return null;
}