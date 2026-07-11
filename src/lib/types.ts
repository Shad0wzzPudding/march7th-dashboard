export type Attachment = {
  path: string;
  name: string;
  type: string;
  size: number;
  [key: string]: string | number;
};

export interface Interest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  is_pinned: boolean;
  sort_order: number;
  tag_ids?: string[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  deadline?: string;
  is_completed: boolean;
  tag_ids?: string[];
  recurrence_unit?: string | null;
  recurrence_interval?: number;
  sort_order?: number;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string; // TIME field for daily tasks
  is_completed: boolean;
  task_date: string; // DATE field to track which day the task belongs to
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time?: string | null;
  deadline?: string;
  tag_ids?: string[];
  sort_order?: number;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: 'created' | 'updated' | 'deleted';
  item_type: 'interests' | 'tasks' | 'events';
  item_title: string;
  item_id?: string;
  previous_data?: Record<string, any>;
  created_at: string;
}

export type NavigationPage = 'home' | 'interests' | 'tasks' | 'events' | 'settings';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}