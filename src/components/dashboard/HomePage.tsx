import { Interest, Task, Event, ActivityLog } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Pin, Activity } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

interface HomePageProps {
  interests: Interest[];
  tasks: Task[];
  events: Event[];
  activityLog: ActivityLog[];
}

export const HomePage = ({ interests, tasks, events, activityLog }: HomePageProps) => {
  const pinnedInterests = interests.filter(interest => interest.is_pinned);
  const upcomingTasks = tasks
    .filter(task => !task.is_completed && isAfter(parseISO(task.deadline), new Date()))
    .slice(0, 3);
  const upcomingEvents = events
    .filter(event => isAfter(parseISO(event.start_time), new Date()))
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pinned Interests */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <Pin size={20} />
            <span className="font-bold">Main Focus</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedInterests.length > 0 ? (
            <div className="space-y-3">
              {pinnedInterests.map(interest => (
                <div key={interest.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-pink-200 dark:border-pink-800">
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

      {/* Upcoming Events */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Clock size={20} />
            <span className="font-bold">Upcoming Events!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* From Tasks */}
            <div>
              <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">From Tasks</h4>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-blue-200 dark:border-blue-800">
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
              <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">From Events</h4>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Starts: {format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm')}
                      </p>
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
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Activity size={20} />
            <span className="font-bold">Recent Changes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length > 0 ? (
            <div className="space-y-2">
              {activityLog.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-green-200 dark:border-green-800">
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