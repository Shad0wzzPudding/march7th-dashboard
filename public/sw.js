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
    renotify: false,
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
    // Prevent multiple runs in the same day
    const todayLocal = new Date();
    const todayKey = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    const dailyRunKey = `notification_run_${todayKey}`;
    const alreadyRun = await getFlag(dailyRunKey);
    if (alreadyRun) {
      console.log('[SW] Notification check already run today, skipping');
      return;
    }
    // Set run flag immediately to avoid race conditions causing duplicates
    await setFlag(dailyRunKey);

    // Get stored task data
    const tasks = (await getStoredData('tasks')) || [];
    const events = (await getStoredData('events')) || [];
    const dailyTasks = (await getStoredData('dailyTasks')) || [];

    const now = new Date();
    const isSameLocalDate = (dateStr) => {
      const d = new Date(dateStr);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };

    // Filter for today using LOCAL date (avoid UTC shift issues)
    const todayTasks = tasks.filter(
      (task) => !task.is_completed && task.deadline && isSameLocalDate(task.deadline)
    );

    const todayEvents = events.filter(
      (event) => event.start_time && isSameLocalDate(event.start_time)
    );

    const todayDailyTasks = dailyTasks.filter(
      (task) => !task.is_completed && task.task_date === todayKey
    );

    // De-dupe: only once per type per day
    const notifiedTasksKey = `notified_${todayKey}_tasks`;
    const notifiedEventsKey = `notified_${todayKey}_events`;
    const notifiedDailyKey = `notified_${todayKey}_daily`;

    if (todayTasks.length > 0 && !(await getFlag(notifiedTasksKey))) {
      await self.registration.showNotification('Tasks Due Today', {
        body: `You have ${todayTasks.length} task(s) due today`,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: 'tasks-today',
        renotify: false,
        data: { type: 'tasks', count: todayTasks.length }
      });
      await setFlag(notifiedTasksKey);
    }

    if (todayEvents.length > 0 && !(await getFlag(notifiedEventsKey))) {
      await self.registration.showNotification('Events Today', {
        body: `You have ${todayEvents.length} event(s) scheduled today`,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: 'events-today',
        renotify: false,
        data: { type: 'events', count: todayEvents.length }
      });
      await setFlag(notifiedEventsKey);
    }

    if (todayDailyTasks.length > 0 && !(await getFlag(notifiedDailyKey))) {
      await self.registration.showNotification('Daily Tasks', {
        body: `You have ${todayDailyTasks.length} daily task(s) pending`,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: 'daily-tasks',
        renotify: false,
        data: { type: 'daily-tasks', count: todayDailyTasks.length }
      });
      await setFlag(notifiedDailyKey);
    }

    await setFlag(dailyRunKey);
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

async function getFlag(key) {
  try {
    const cache = await caches.open('dashboard-data');
    const res = await cache.match(`/flags/${key}`);
    if (res) {
      const json = await res.json();
      return Boolean(json?.value);
    }
  } catch (e) {
    console.error('Error getting flag', key, e);
  }
  return false;
}

async function setFlag(key) {
  try {
    const cache = await caches.open('dashboard-data');
    const resp = new Response(JSON.stringify({ value: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/flags/${key}`, resp);
  } catch (e) {
    console.error('Error setting flag', key, e);
  }
}