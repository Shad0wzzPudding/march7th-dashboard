import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Calendar as CalendarIcon, CheckCircle2, Circle, ChevronDown, ChevronRight, Pin, Activity, AlertCircle, ChevronUp, CalendarDays, ArrowRight, GripVertical, EyeOff, Eye } from "lucide-react";
import { format, isToday, startOfDay, endOfDay, isSameDay, isAfter, isBefore, parseISO, parseISO as parseDate } from "date-fns";
import { Interest, Task, Event, ActivityLog } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationSettings } from "./NotificationSettings";
import { SwipeableInterestCard } from "./SwipeableInterestCard";
import { DraggableSummaryItem } from "./DraggableSummaryItem";
interface HomePageProps {
  interests: Interest[];
  tasks: Task[];
  events: Event[];
  activityLog: ActivityLog[];
  onUpdateInterest?: (data: Partial<Interest> & { id: string }) => void;
}

export const HomePage = ({ interests, tasks, events, activityLog, onUpdateInterest }: HomePageProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [recentChangesCollapsed, setRecentChangesCollapsed] = useState(() => {
    try {
      return localStorage.getItem('recentChangesCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const { scheduleNotificationCheck } = useNotifications();
  
  // Hidden dates for calendar (manually unhighlighted by user)
  const [hiddenDates, setHiddenDates] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('hiddenCalendarDates');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  // Initialize collapsed interests from localStorage
  const [collapsedInterests, setCollapsedInterests] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('collapsedInterests');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  const pinnedInterests = interests.filter(interest => interest.is_pinned);

  // Schedule notification checks when data changes
  useEffect(() => {
    if (tasks.length > 0 || events.length > 0) {
      scheduleNotificationCheck(tasks, events, []);
    }
  }, [tasks, events, scheduleNotificationCheck]);
  
  const toggleInterestCollapse = (interestId: string) => {
    setCollapsedInterests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        newSet.add(interestId);
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('collapsedInterests', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Failed to save collapsed state:', error);
      }
      
      return newSet;
    });
  };
  
  // Toggle date visibility in calendar
  const toggleDateVisibility = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHiddenDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('hiddenCalendarDates', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Failed to save hidden dates:', error);
      }
      
      return newSet;
    });
  };
  
  // Check if a date is hidden
  const isDateHidden = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return hiddenDates.has(dateKey);
  };
  
  // Get all dates with tasks or events for calendar highlighting (reactive to hiddenDates)
  const markedDates = useMemo(() => {
    const dates: Date[] = [];
    
    // Add task deadlines and start dates (only for incomplete tasks)
    tasks.forEach(task => {
      if (!task.is_completed) {
        if (task.deadline) {
          dates.push(startOfDay(parseDate(task.deadline)));
        }
        if (task.start_date) {
          dates.push(startOfDay(parseDate(task.start_date)));
        }
      }
    });
    
    // Add event start times and deadlines (including past events)
    events.forEach(event => {
      if (event.start_time) {
        dates.push(startOfDay(parseDate(event.start_time)));
      }
      if (event.deadline) {
        dates.push(startOfDay(parseDate(event.deadline)));
      }
    });
    
    // Remove duplicates
    const uniqueDates = dates.filter((date, index, self) =>
      index === self.findIndex(d => d.getTime() === date.getTime())
    );
    
    // Filter out hidden dates
    return uniqueDates.filter(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return !hiddenDates.has(dateKey);
    });
  }, [tasks, events, hiddenDates]);
  
  // Get events and tasks for a specific date
  const getDateDetails = (date: Date) => {
    const dateItems: Array<{
      id: string;
      title: string;
      type: 'task' | 'event';
      dateType: 'start' | 'deadline';
      time?: string;
      description?: string;
    }> = [];
    
    // Check tasks (only incomplete tasks)
    tasks.forEach(task => {
      if (!task.is_completed) {
        if (task.deadline && isSameDay(parseDate(task.deadline), date)) {
          dateItems.push({
            id: task.id,
            title: task.title,
            type: 'task',
            dateType: 'deadline',
            time: format(parseDate(task.deadline), 'HH:mm'),
            description: task.description
          });
        }
        if (task.start_date && isSameDay(parseDate(task.start_date), date)) {
          dateItems.push({
            id: task.id,
            title: task.title,
            type: 'task',
            dateType: 'start',
            time: format(parseDate(task.start_date), 'HH:mm'),
            description: task.description
          });
        }
      }
    });
    
    // Check events
    events.forEach(event => {
      if (event.start_time && isSameDay(parseDate(event.start_time), date)) {
        dateItems.push({
          id: event.id,
          title: event.title,
          type: 'event',
          dateType: 'start',
          time: format(parseDate(event.start_time), 'HH:mm'),
          description: event.description
        });
      }
      if (event.deadline && isSameDay(parseDate(event.deadline), date)) {
        dateItems.push({
          id: event.id,
          title: event.title,
          type: 'event',
          dateType: 'deadline',
          time: format(parseDate(event.deadline), 'HH:mm'),
          description: event.description
        });
      }
    });
    
    return dateItems;
  };
  
  // Today's events and tasks
  const todayTasks = tasks
    .filter(task => !task.is_completed && isToday(parseISO(task.deadline)))
    .slice(0, 3);
  const todayStartingTasks = tasks
    .filter(task => !task.is_completed && isToday(parseISO(task.start_date)))
    .slice(0, 3);
  const todayEvents = events
    .filter(event => isToday(parseISO(event.start_time)))
    .slice(0, 3);
  
  // Overdue tasks and events
  const now = new Date();
  const overdueTasks = tasks.filter(task => 
    !task.is_completed && isBefore(parseISO(task.deadline), now) && !isToday(parseISO(task.deadline))
  );
  
  // Upcoming events and tasks (excluding today)
  const upcomingTasks = tasks
    .filter(task => !task.is_completed && isAfter(parseISO(task.deadline), new Date()) && !isToday(parseISO(task.deadline)))
    .slice(0, 3);
  const upcomingEvents = events
    .filter(event => isAfter(parseISO(event.start_time), new Date()) && !isToday(parseISO(event.start_time)))
    .slice(0, 3);

  // Summary items order state
  const [summaryOrder, setSummaryOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('summaryOrder');
      const order = saved ? JSON.parse(saved) : ['todayTasks', 'completed', 'todayEvents', 'overdueTasks'];
      // Filter out overdueEvents if it exists from old saved data
      return order.filter((key: string) => key !== 'overdueEvents');
    } catch {
      return ['todayTasks', 'completed', 'todayEvents', 'overdueTasks'];
    }
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const summaryItems = {
    todayTasks: { value: todayTasks.length + todayStartingTasks.length, label: "Today's Tasks", colorClass: "text-blue-600 dark:text-blue-400" },
    completed: { value: tasks.filter(task => task.is_completed && isToday(parseISO(task.deadline))).length, label: "Completed", colorClass: "text-green-600 dark:text-green-400" },
    todayEvents: { value: todayEvents.length, label: "Today's Events", colorClass: "text-orange-600 dark:text-orange-400" },
    overdueTasks: { value: overdueTasks.length, label: "Overdue Tasks", colorClass: "text-red-600 dark:text-red-400" },
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newOrder = [...summaryOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      setSummaryOrder(newOrder);
      try {
        localStorage.setItem('summaryOrder', JSON.stringify(newOrder));
      } catch (e) {
        console.error('Failed to save summary order:', e);
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };


  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <NotificationSettings />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Focus Section */}
      </div>
      
      {/* Daily Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <AlertCircle size={20} />
            <span className="font-bold">Today's Summary</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full ml-auto">
              <GripVertical size={12} />
              <span>Drag to reorder</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-3">
            {summaryOrder.map((key, index) => {
              const item = summaryItems[key as keyof typeof summaryItems];
              if (!item) return null;
              return (
                <DraggableSummaryItem
                  key={key}
                  id={key}
                  value={item.value}
                  label={item.label}
                  colorClass={item.colorClass}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  isDragging={dragIndex !== null}
                  dragOverIndex={dragOverIndex}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today Events */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <AlertCircle size={20} />
            <span className="font-bold">Today Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Today's Tasks */}
            <div>
              <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">Today's Tasks</h4>
              {(todayTasks.length > 0 || todayStartingTasks.length > 0) ? (
                <div className="space-y-2">
                  {/* Tasks with deadlines today */}
                  {todayTasks.map(task => (
                    <div key={`deadline-${task.id}`} className="p-3 bg-card/90 rounded border border-red-200/40 dark:border-red-800/40">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge variant="destructive" className="text-xs">Deadline</Badge>
                      </div>
                       {task.description && (
                         <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{task.description}</p>
                       )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Due: {format(parseISO(task.deadline), 'HH:mm')}
                      </p>
                    </div>
                  ))}
                  {/* Tasks starting today */}
                  {todayStartingTasks.map(task => (
                    <div key={`start-${task.id}`} className="p-3 bg-card/90 rounded border border-green-200/40 dark:border-green-800/40">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-300">Starting</Badge>
                      </div>
                       {task.description && (
                         <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{task.description}</p>
                       )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Starts: {format(parseISO(task.start_date), 'HH:mm')}
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
              <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">Today's Events</h4>
              {todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.map(event => (
                    <div key={event.id} className="p-3 bg-card/90 rounded border border-blue-200/40 dark:border-blue-800/40">
                      <p className="font-medium text-sm">{event.title}</p>
                       {event.description && (
                         <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{event.description}</p>
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

      {/* Calendar with Event Markers */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <CalendarDays size={20} />
            <span className="font-bold">Calendar Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Calendar */}
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                className="rounded-md border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-purple-950/20"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  marked: markedDates
                }}
                modifiersClassNames={{
                  marked: "bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-700/50 dark:to-pink-700/50 text-purple-900 dark:text-purple-100 font-semibold relative after:absolute after:inset-0 after:rounded-full after:bg-purple-300/30 dark:after:bg-purple-500/30 cursor-pointer hover:scale-105 transition-transform"
                }}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Click on highlighted dates to see details
                </p>
              </div>
            </div>

            {/* Right side - Day Information Panel */}
            <div className="bg-gradient-to-br from-white/90 to-purple-50/50 dark:from-gray-900/70 dark:to-purple-950/40 rounded-xl border-2 border-purple-300/40 dark:border-purple-600/30 shadow-lg backdrop-blur-sm p-5 min-h-[400px]">
              {selectedDate ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Compact Header with Toggle Button */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-200/60 dark:border-purple-700/50">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <CalendarIcon size={16} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-purple-800 dark:text-purple-200">
                          {format(selectedDate, 'EEE, MMM d')}
                        </h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          {format(selectedDate, 'yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDateVisibility(selectedDate)}
                      className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                      title={isDateHidden(selectedDate) ? "Show highlight" : "Hide highlight"}
                    >
                      {isDateHidden(selectedDate) ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </Button>
                  </div>
                  
                  {(() => {
                    const dateItems = getDateDetails(selectedDate);
                    
                    if (dateItems.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                          <div className="p-3 bg-purple-100/50 dark:bg-purple-900/30 rounded-full">
                            <CalendarIcon size={24} className="text-purple-400 dark:text-purple-500" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-1">
                              Free Day
                            </h4>
                            <p className="text-xs text-purple-500 dark:text-purple-400">
                              No scheduled items
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {dateItems.map((item) => (
                          <div 
                            key={`${item.type}-${item.id}-${item.dateType}`} 
                            className="group relative bg-white/80 dark:bg-gray-800/60 rounded-lg border border-purple-200/60 dark:border-purple-700/40 p-3 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-purple-300 dark:hover:border-purple-600"
                          >
                            {/* Slim accent border */}
                            <div className={`absolute left-0 top-0 w-0.5 h-full rounded-l-lg ${
                              item.dateType === 'deadline' 
                                ? 'bg-red-500' 
                                : item.type === 'event'
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`} />
                            
                            <div className="ml-2">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight flex-1 mr-2">
                                  {item.title}
                                </h4>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Badge 
                                    variant={item.type === 'task' ? 'default' : 'secondary'}
                                    className="text-xs px-1.5 py-0.5 h-5"
                                  >
                                    {item.type}
                                  </Badge>
                                  <Badge 
                                    variant={item.dateType === 'deadline' ? 'destructive' : 'outline'}
                                    className="text-xs px-1.5 py-0.5 h-5"
                                  >
                                    {item.dateType === 'deadline' ? 'Due' : 'Start'}
                                  </Badge>
                                </div>
                              </div>
                              
                               {item.description && (
                                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-1 whitespace-pre-wrap">
                                   {item.description}
                                 </p>
                               )}
                              
                              {item.time && (
                                <div className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded px-1.5 py-0.5 w-fit">
                                  <Clock size={10} />
                                  {item.time}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                  <div className="p-4 bg-purple-100/60 dark:bg-purple-900/30 rounded-full">
                    <CalendarIcon size={32} className="text-purple-400 dark:text-purple-500" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-lg text-purple-700 dark:text-purple-300">
                      Select a Date
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400 max-w-xs">
                      Click on highlighted dates to see details
                    </p>
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg border border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        💡 Highlighted dates have scheduled activities
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pinned Interests */}
      <Card className="bg-main-focus/20 border-main-focus/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-main-focus">
              <Pin size={20} />
              <span className="font-bold">Main Focus</span>
            </CardTitle>
            {pinnedInterests.length > 0 && onUpdateInterest && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full animate-fade-in">
                <ArrowRight size={12} className="animate-pulse" />
                <span>Swipe right to unpin</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pinnedInterests.length > 0 ? (
            <div className="space-y-3">
              {pinnedInterests.map(interest => (
                onUpdateInterest ? (
                  <SwipeableInterestCard
                    key={interest.id}
                    interest={interest}
                    isCollapsed={collapsedInterests.has(interest.id)}
                    onToggleCollapse={toggleInterestCollapse}
                    onUnpin={(i) => onUpdateInterest({ id: i.id, is_pinned: false })}
                  />
                ) : (
                  <Collapsible key={interest.id} open={!collapsedInterests.has(interest.id)}>
                    <div className="p-3 bg-card/80 rounded-lg border border-main-focus/30">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{interest.title}</h4>
                        {interest.description && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleInterestCollapse(interest.id)}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              {collapsedInterests.has(interest.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronUp size={16} />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      
                      <CollapsibleContent>
                        {interest.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">{interest.description}</p>
                        )}
                      </CollapsibleContent>
                      
                      {interest.deadline && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} />
                          {format(parseISO(interest.deadline), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </Collapsible>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No pinned interests yet! Pin some from the Interests page to see them here.</p>
          )}
        </CardContent>
      </Card>

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
                    <div key={task.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
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
                    <div key={event.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
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
      <Collapsible 
        open={!recentChangesCollapsed}
        onOpenChange={(open) => {
          setRecentChangesCollapsed(!open);
          try {
            localStorage.setItem('recentChangesCollapsed', String(!open));
          } catch (e) {
            console.error('Failed to save collapsed state:', e);
          }
        }}
      >
        <Card className="bg-recent-changes/20 border-recent-changes/40">
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group">
                <CardTitle className="flex items-center gap-2 text-recent-changes">
                  <Activity size={20} />
                  <span className="font-bold">Recent Changes</span>
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 group-hover:bg-recent-changes/20">
                  {recentChangesCollapsed ? (
                    <ChevronDown size={18} className="text-recent-changes" />
                  ) : (
                    <ChevronUp size={18} className="text-recent-changes" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {activityLog.length > 0 ? (
                <div className="space-y-2">
                  {activityLog.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};