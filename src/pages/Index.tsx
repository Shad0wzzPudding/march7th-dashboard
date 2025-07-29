import { useState } from 'react';
import { NavigationPage } from '@/lib/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { WelcomeMessage } from '@/components/dashboard/WelcomeMessage';
import { Navigation } from '@/components/dashboard/Navigation';
import { HomePage } from '@/components/dashboard/HomePage';
import { InterestsPage } from '@/components/dashboard/InterestsPage';
import { TasksPage } from '@/components/dashboard/TasksPage';
import { EventsPage } from '@/components/dashboard/EventsPage';

const Index = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const { 
    interests, 
    tasks, 
    events, 
    activityLog, 
    isLoading, 
    error, 
    mutations 
  } = useDashboardData();

  if (isLoading) {
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
          />
        );
      case 'events':
        return (
          <EventsPage 
            events={events}
            onCreateEvent={mutations.createEvent.mutate}
            onUpdateEvent={mutations.updateEvent.mutate}
            onDeleteEvent={mutations.deleteEvent.mutate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation activePage={activePage} onPageChange={setActivePage} />
      
      <div className="container mx-auto px-4 py-8 pr-24">
        <WelcomeMessage />
        
        <main className="max-w-6xl mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default Index;
