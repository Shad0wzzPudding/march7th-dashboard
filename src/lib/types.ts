export interface Interest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  deadline?: string;
  is_pinned: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  deadline: string;
  is_completed: boolean;
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
  start_time: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: 'created' | 'updated' | 'deleted';
  item_type: 'interests' | 'tasks' | 'events';
  item_title: string;
  created_at: string;
}

export type NavigationPage = 'home' | 'interests' | 'tasks' | 'events';