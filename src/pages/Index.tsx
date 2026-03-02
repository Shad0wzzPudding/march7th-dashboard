import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NavigationPage } from '@/lib/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useNotifications } from '@/hooks/useNotifications';
import { WelcomeMessage } from '@/components/dashboard/WelcomeMessage';
import { Navigation } from '@/components/dashboard/Navigation';
import { HomePage } from '@/components/dashboard/HomePage';
import { InterestsPage } from '@/components/dashboard/InterestsPage';
import { TasksPage } from '@/components/dashboard/TasksPage';
import { EventsPage } from '@/components/dashboard/EventsPage';

import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  const { 
    interests, 
    tasks, 
    dailyTasks,
    events, 
    activityLog, 
    isLoading: dataLoading, 
    error, 
    mutations 
  } = useDashboardData();

  const { scheduleNotificationCheck, permission } = useNotifications();

  // Schedule notification checks whenever data changes and permission is granted
  useEffect(() => {
    if (permission === 'granted' && tasks && events && dailyTasks) {
      const today = new Date().toISOString().split('T')[0];

      // Schedule background check only once per day
      const scheduleKey = `notif_scheduled_${today}`;
      if (!localStorage.getItem(scheduleKey)) {
        console.log('Scheduling notification check with data:', {
          tasks: tasks.length,
          events: events.length,
          dailyTasks: dailyTasks.length,
        });
        scheduleNotificationCheck(tasks, events, dailyTasks);
        localStorage.setItem(scheduleKey, '1');
      }
    }
  }, [tasks, events, dailyTasks, permission, scheduleNotificationCheck]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return null; // Will redirect to auth page via useEffect
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Something went wrong loading your dashboard</p>
          <p className="text-sm text-muted-foreground">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return (
          <HomePage 
            interests={interests}
            tasks={tasks}
            events={events}
            activityLog={activityLog}
            onUpdateInterest={mutations.updateInterest.mutate}
            onDeleteActivityLog={mutations.deleteActivityLog.mutate}
            onRevertActivityLog={mutations.revertActivityLog.mutate}
          />
        );
      case 'interests':
        return (
          <InterestsPage 
            interests={interests}
            onCreateInterest={mutations.createInterest.mutate}
            onUpdateInterest={mutations.updateInterest.mutate}
            onDeleteInterest={mutations.deleteInterest.mutate}
          />
        );
      case 'tasks':
        return (
          <TasksPage 
            tasks={tasks}
            onCreateTask={mutations.createTask.mutate}
            onUpdateTask={mutations.updateTask.mutate}
            onDeleteTask={mutations.deleteTask.mutate}
            onClearCompleted={mutations.clearCompletedTasks.mutate}
          />
        );
      case 'events':
        return (
          <EventsPage 
            events={events}
            onCreateEvent={mutations.createEvent.mutate}
            onUpdateEvent={mutations.updateEvent.mutate}
            onDeleteEvent={mutations.deleteEvent.mutate}
            onClearPast={mutations.clearPastEvents.mutate}
          />
        );
      default:
        return null;
    }
  };




  return (
    <div className="min-h-screen">
      {/* Top Navigation with User Info */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Navigation activePage={activePage} onPageChange={setActivePage} />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 pr-24">
        <WelcomeMessage />
        
        <main className="max-w-6xl mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {showScrollTop && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default Index;
