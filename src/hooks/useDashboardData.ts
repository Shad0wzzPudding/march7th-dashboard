import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interest, Task, Event, ActivityLog, DailyTask } from '@/lib/types';
import { toast } from 'sonner';

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
      return data || [];
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
      return data || [];
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
      return data || [];
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
    mutationFn: async (data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('interests')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest created successfully!');
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
    mutationFn: async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert([{ ...data, user_id: user.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Task created successfully!');
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
    mutationFn: async (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .insert([{ ...data, user_id: user.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Event created successfully!');
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
    }
  };
};
