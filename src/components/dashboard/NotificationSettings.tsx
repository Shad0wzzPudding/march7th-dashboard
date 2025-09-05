import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';

export const NotificationSettings = () => {
  const { isSupported, permission, requestPermission } = useNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Available
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about your tasks and events even when you're not on the website.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Disabled' : 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground">
                {permission === 'granted' 
                  ? 'You\'ll receive notifications about today\'s tasks and events'
                  : permission === 'denied'
                  ? 'Notifications are blocked. Enable them in your browser settings.'
                  : 'Click to enable notifications'
                }
              </p>
            </div>
            {permission !== 'granted' && permission !== 'denied' && (
              <Button onClick={requestPermission} size="sm">
                Enable Notifications
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};