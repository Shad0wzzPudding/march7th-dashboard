import { NotificationSettings } from './NotificationSettings';
import { TagManager } from './TagManager';
import { Camera } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-md">
          <Camera size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">March 7th's behind-the-scenes controls~</p>
        </div>
      </div>
      <NotificationSettings detailed />
      <TagManager />
    </div>
  );
};