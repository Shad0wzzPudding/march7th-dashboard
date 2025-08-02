import { useState } from 'react';
import { Task, Event } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

interface DailyTaskPageProps {
  tasks: Task[];
  events: Event[];
  onCreateTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTask: (data: { id: string } & Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export const DailyTaskPage = ({ 
  tasks, 
  events, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask 
}: DailyTaskPageProps) => {
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter today's tasks and events
  const todayTasks = tasks.filter(task => isToday(parseISO(task.deadline)));
  const todayEvents = events.filter(event => isToday(parseISO(event.start_time)));

  const incompleteTasks = todayTasks.filter(task => !task.is_completed);
  const completedTasks = todayTasks.filter(task => task.is_completed);

  const toggleTaskCompletion = (taskId: string, isCompleted: boolean) => {
    onUpdateTask({ id: taskId, is_completed: !isCompleted });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Daily Task Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {todayTasks.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedTasks.length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {todayEvents.length}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Events Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Events */}
      <Card className="bg-upcoming-events/30 border-upcoming-events/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-upcoming-events">
            <AlertCircle size={20} />
            <span className="font-bold">Today's Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div key={event.id} className="p-4 bg-card/90 rounded-lg border border-upcoming-events/40">
                  <h4 className="font-semibold text-lg">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      Starts: {format(parseISO(event.start_time), 'HH:mm')}
                    </div>
                    {event.deadline && (
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} />
                        Deadline: {format(parseISO(event.deadline), 'HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No events scheduled for today
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays size={20} />
            <span className="font-bold">Pending Tasks ({incompleteTasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incompleteTasks.length > 0 ? (
            <div className="space-y-3">
              {incompleteTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                    className="p-1"
                  >
                    <CheckCircle size={20} className="text-gray-400 hover:text-green-500" />
                  </Button>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      Due: {format(parseISO(task.deadline), 'HH:mm')}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              All tasks completed for today! 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <span className="font-bold">Completed Tasks ({completedTasks.length})</span>
            </div>
            {completedTasks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide' : 'Show'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {showCompleted && (
          <CardContent>
            {completedTasks.length > 0 ? (
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg opacity-75">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                      className="p-1"
                    >
                      <CheckCircle size={20} className="text-green-500" />
                    </Button>
                    
                    <div className="flex-1">
                      <h4 className="font-medium line-through">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-through">{task.description}</p>
                      )}
                      <Badge variant="outline" className="mt-1 text-xs text-green-600 border-green-300">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No completed tasks yet today
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};