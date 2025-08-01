import { Interest, Task, Event, ActivityLog } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Pin, Activity } from 'lucide-react';
import { format, isAfter, parseISO, isToday } from 'date-fns';

interface HomePageProps {
  interests: Interest[];
  tasks: Task[];
  events: Event[];
  activityLog: ActivityLog[];
}

export const HomePage = ({ interests, tasks, events, activityLog }: HomePageProps) => {
  const pinnedInterests = interests.filter(interest => interest.is_pinned);
  
  // Today's events and tasks
  const todayTasks = tasks
    .filter(task => !task.is_completed && isToday(parseISO(task.deadline)))
    .slice(0, 3);
  const todayEvents = events
    .filter(event => isToday(parseISO(event.start_time)))
    .slice(0, 3);
  
  // Upcoming events and tasks (excluding today)
  const upcomingTasks = tasks
    .filter(task => !task.is_completed && isAfter(parseISO(task.deadline), new Date()) && !isToday(parseISO(task.deadline)))
    .slice(0, 3);
  const upcomingEvents = events
    .filter(event => isAfter(parseISO(event.start_time), new Date()) && !isToday(parseISO(event.start_time)))
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pinned Interests */}
      <Card className="bg-main-focus/20 border-main-focus/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-main-focus">
            <Pin size={20} />
            <span className="font-bold">Main Focus</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedInterests.length > 0 ? (
            <div className="space-y-3">
              {pinnedInterests.map(interest => (
                <div key={interest.id} className="p-3 bg-card/80 rounded-lg border border-main-focus/30">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{interest.title}</h4>
                  {interest.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{interest.description}</p>
                  )}
                  {interest.deadline && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      {format(parseISO(interest.deadline), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No pinned interests yet! Pin some from the Interests page to see them here.</p>
          )}
        </CardContent>
      </Card>

      {/* Today Events */}
      {(todayTasks.length > 0 || todayEvents.length > 0) && (
        <Card className="bg-upcoming-events/30 border-upcoming-events/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-upcoming-events">
              <Clock size={20} />
              <span className="font-bold">Today Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Today's Tasks */}
              <div>
                <h4 className="font-semibold text-sm text-upcoming-events mb-2">Today's Tasks</h4>
                {todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <div key={task.id} className="p-3 bg-card/90 rounded border border-upcoming-events/40">
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Due: {format(parseISO(task.deadline), 'HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No tasks today</p>
                )}
              </div>

              {/* Today's Events */}
              <div>
                <h4 className="font-semibold text-sm text-upcoming-events mb-2">Today's Events</h4>
                {todayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {todayEvents.map(event => (
                      <div key={event.id} className="p-3 bg-card/90 rounded border border-upcoming-events/40">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                          <p>Starts: {format(parseISO(event.start_time), 'HH:mm')}</p>
                          {event.deadline && (
                            <p>Deadline: {format(parseISO(event.deadline), 'HH:mm')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No events today</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card className="bg-upcoming-events/20 border-upcoming-events/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-upcoming-events">
            <Clock size={20} />
            <span className="font-bold">Upcoming Events!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* From Tasks */}
            <div>
              <h4 className="font-semibold text-sm text-upcoming-events mb-2">From Tasks</h4>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="p-2 bg-card/80 rounded border border-upcoming-events/30">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">No upcoming tasks</p>
              )}
            </div>

            {/* From Events */}
            <div>
              <h4 className="font-semibold text-sm text-upcoming-events mb-2">From Events</h4>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-2 bg-card/80 rounded border border-upcoming-events/30">
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        <p>Starts: {format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm')}</p>
                        {event.deadline && (
                          <p>Deadline: {format(parseISO(event.deadline), 'MMM dd, yyyy HH:mm')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">No upcoming events</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card className="bg-recent-changes/20 border-recent-changes/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-recent-changes">
            <Activity size={20} />
            <span className="font-bold">Recent Changes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length > 0 ? (
            <div className="space-y-2">
              {activityLog.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-card/80 rounded border border-recent-changes/30">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.action_type === 'created' ? 'default' : log.action_type === 'updated' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {log.action_type}
                    </Badge>
                    <span className="text-sm font-medium">{log.item_title}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({log.item_type})</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(parseISO(log.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity yet!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};