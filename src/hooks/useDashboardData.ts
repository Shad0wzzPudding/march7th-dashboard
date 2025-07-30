import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interest, Task, Event, ActivityLog } from '@/lib/types';
import { toast } from 'sonner';

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'; // For demo purposes since auth is not implemented

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
      console.log('Fetching interests...');
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Interests query error:', error);
        throw error;
      }
      console.log('Interests data:', data);
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
      console.log('Fetching tasks...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('deadline', { ascending: true });
      
      if (error) {
        console.error('Tasks query error:', error);
        throw error;
      }
      console.log('Tasks data:', data);
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
      console.log('Fetching events...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Events query error:', error);
        throw error;
      }
      console.log('Events data:', data);
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
      console.log('Fetching activity log...');
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Activity log query error:', error);
        throw error;
      }
      console.log('Activity log data:', data);
      return (data || []) as ActivityLog[];
    }
  });

  // Mutations
  const createInterest = useMutation({
    mutationFn: async (data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('interests')
        .insert([{ ...data, user_id: DEMO_USER_ID }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest created successfully!');
    }
  });

  const updateInterest = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Interest> & { id: string }) => {
      const { error } = await supabase
        .from('interests')
        .update(data)
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest updated successfully!');
    }
  });

  const deleteInterest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interests'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Interest deleted successfully!');
    }
  });

  const createTask = useMutation({
    mutationFn: async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...data, user_id: DEMO_USER_ID }]);
      
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
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Task deleted successfully!');
    }
  });

  const createEvent = useMutation({
    mutationFn: async (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('events')
        .insert([{ ...data, user_id: DEMO_USER_ID }]);
      
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
      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
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
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', DEMO_USER_ID);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      toast.success('Event deleted successfully!');
    }
  });

  return {
    interests,
    tasks,
    events,
    activityLog,
    isLoading: interestsLoading || tasksLoading || eventsLoading || activityLoading,
    error: interestsError || tasksError || eventsError || activityError,
    mutations: {
      createInterest,
      updateInterest,
      deleteInterest,
      createTask,
      updateTask,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
    }
  };
};