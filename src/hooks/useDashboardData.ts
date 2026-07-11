import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interest, Task, Event, ActivityLog, DailyTask } from '@/lib/types';
import { toast } from 'sonner';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

const advanceDate = (iso: string, unit: string, interval: number): string => {
  const d = new Date(iso);
  const n = Math.max(1, interval || 1);
  let next = d;
  switch (unit) {
    case 'day': next = addDays(d, n); break;
    case 'week': next = addWeeks(d, n); break;
    case 'month': next = addMonths(d, n); break;
    case 'year': next = addYears(d, n); break;
  }
  return next.toISOString();
};

const renewRecurringTask = (task: Task): Partial<Task> | null => {
  if (!task.recurrence_unit || !task.deadline) return null;
  const interval = task.recurrence_interval || 1;
  let deadline = task.deadline;
  let start = task.start_date || undefined;
  let advanced = false;
  const now = Date.now();
  // Advance until the deadline is in the future
  let guard = 0;
  while (new Date(deadline).getTime() <= now && guard < 1000) {
    deadline = advanceDate(deadline, task.recurrence_unit, interval);
    if (start) start = advanceDate(start, task.recurrence_unit, interval);
    advanced = true;
    guard++;
  }
  if (!advanced) return null;
  return { deadline, start_date: start, is_completed: false };
};

export const useDashboardData = () => {
  const queryClient = useQueryClient();

  // Interests
  const {
    data: interests = [],
    isLoading: interestsLoading,
    error: interestsError
  } = useQuery({
    queryKey: ['interests'],
    queryFn: async (): Promise<Interest[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Interest[];
    }
  });

  // Tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      const tasks = (data || []) as unknown as Task[];
      // Auto-renew recurring tasks whose deadline has passed
      const renewals: { id: string; patch: Partial<Task> }[] = [];
      const renewed = tasks.map((t) => {
        const patch = renewRecurringTask(t);
        if (patch) {
          renewals.push({ id: t.id, patch });
          return { ...t, ...patch } as Task;
        }
        return t;
      });
      if (renewals.length > 0) {
        await Promise.all(
          renewals.map(({ id, patch }) =>
            supabase.from('tasks').update(patch).eq('id', id).eq('user_id', user.id)
          )
        );
      }
      return renewed;
    }
  });

  // Daily Tasks
  const {
    data: dailyTasks = [],
    isLoading: dailyTasksLoading,
    error: dailyTasksError
  } = useQuery({
    queryKey: ['daily_tasks'],
    queryFn: async (): Promise<DailyTask[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, ensure daily tasks exist for today (copies from previous day and resets completion)
      const { error: ensureError } = await supabase.rpc('ensure_daily_tasks_for_today', {
        p_user_id: user.id
      });
      
      if (ensureError) {
        console.error('Error ensuring daily tasks for today:', ensureError);
      }

      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', today) // Only fetch today's daily tasks
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Events
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as Event[];
    }
  });

  // Activity Log
  const {
    data: activityLog = [],
    isLoading: activityLoading,
    error: activityError
  } = useQuery({
    queryKey: ['activity_log'],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []) as ActivityLog[];
    }
  });

  // Mutations
  const createInterest = useMutation({
    mutationFn: async (
      data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { data: result, error } = await supabase
        .from('interests')
        .insert([{ ...insertData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return { result, __duplicate, __silent };
    },
    onSuccess: ({ __duplicate, __silent }) => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (__silent) return;
      toast.success(__duplicate ? 'Interest duplicated!' : 'Interest created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create interest:', error);
      toast.error('Failed to create interest. Please try again.');
    }
  });

  const updateInterest = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Interest> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('interests')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update interest:', error);
      toast.error('Failed to update interest. Please try again.');
    }
  });

  const deleteInterest = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete interest:', error);
      toast.error('Failed to delete interest. Please try again.');
    }
  });

  const createTask = useMutation({
    mutationFn: async (
      data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...insertData, user_id: user.id }]);
      
      if (error) throw error;
      return { __duplicate, __silent };
    },
    onSuccess: (meta) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (meta?.__silent) return;
      toast.success(meta?.__duplicate ? 'Task duplicated!' : 'Task created successfully!');
    }
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Task updated successfully!');
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Task deleted successfully!');
    }
  });

  const clearCompletedTasks = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('is_completed', true);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Completed tasks cleared!');
    }
  });

  // Daily Task mutations
  const createDailyTask = useMutation({
    mutationFn: async (data: Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      const { error } = await supabase
        .from('daily_tasks')
        .insert([{ ...data, user_id: user.id, task_date: today }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Daily task created successfully!');
    }
  });

  const updateDailyTask = useMutation({
    mutationFn: async ({ id, ...data }: Partial<DailyTask> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Daily task updated successfully!');
    }
  });

  const deleteDailyTask = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Daily task deleted successfully!');
    }
  });

  const createEvent = useMutation({
    mutationFn: async (
      data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const { __duplicate, __silent, ...insertData } = data;
      const { error } = await supabase
        .from('events')
        .insert([{ ...insertData, user_id: user.id }]);
      
      if (error) throw error;
      return { __duplicate, __silent };
    },
    onSuccess: (meta) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      if (meta?.__silent) return;
      toast.success(meta?.__duplicate ? 'Event duplicated!' : 'Event created successfully!');
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Event> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Event updated successfully!');
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Event deleted successfully!');
    }
  });

  const clearPastEvents = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('user_id', user.id)
        .lt('start_time', now);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Past events cleared!');
    }
  });

  const deleteActivityLog = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
    }
  });

  const revertActivityLog = useMutation({
    mutationFn: async (log: { id: string; action_type: string; item_type: string; item_id?: string; previous_data?: Record<string, any> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const tableName = log.item_type as 'interests' | 'tasks' | 'events';

      if (log.action_type === 'created' && log.item_id) {
        // Undo create → delete the item
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', log.item_id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else if (log.action_type === 'updated' && log.previous_data && log.item_id) {
        // Undo update → restore previous data
        const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, ...restoreData } = log.previous_data;
        const { error } = await supabase
          .from(tableName)
          .update(restoreData)
          .eq('id', log.item_id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else if (log.action_type === 'deleted' && log.previous_data) {
        // Undo delete → re-insert the item
        const { error } = await supabase
          .from(tableName)
          .insert([log.previous_data as any]);
        if (error) throw error;
      } else {
        throw new Error('Cannot revert this action - missing data');
      }

      // Delete the activity log entry after successful revert
      await supabase
        .from('activity_log')
        .delete()
        .eq('id', log.id)
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['daily_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Change reverted successfully!');
    },
    onError: (error) => {
      console.error('Failed to revert change:', error);
      toast.error('Failed to revert change. The item may have been modified since.');
    }
  });

  return {
    interests,
    tasks,
    dailyTasks,
    events,
    activityLog,
    isLoading: interestsLoading || tasksLoading || dailyTasksLoading || eventsLoading || activityLoading,
    error: interestsError || tasksError || dailyTasksError || eventsError || activityError,
    mutations: {
      createInterest,
      updateInterest,
      deleteInterest,
      createTask,
      updateTask,
      deleteTask,
      clearCompletedTasks,
      createDailyTask,
      updateDailyTask,
      deleteDailyTask,
      createEvent,
      updateEvent,
      deleteEvent,
      clearPastEvents,
      deleteActivityLog,
      revertActivityLog,
    }
  };
};
