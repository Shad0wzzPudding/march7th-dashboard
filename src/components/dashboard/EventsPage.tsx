import { useState, useEffect } from 'react';
import { Event } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CalendarDays, Copy, Trash, Undo2 } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { MarchConfirmDialog } from './MarchConfirmDialog';
import { playSuccessSound, playCancelSound, playDeleteSound, playDuplicateSound, playUpdateSound } from '@/lib/sounds';

interface EventsPageProps {
  events: Event[];
  onCreateEvent: (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEvent: (data: Partial<Event> & { id: string }) => void;
  onDeleteEvent: (id: string) => void;
  onClearPast: () => void;
}

export const EventsPage = ({ 
  events, 
  onCreateEvent, 
  onUpdateEvent, 
  onDeleteEvent,
  onClearPast
}: EventsPageProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedEvents, setClearedEvents] = useState<Event[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    deadline: ''
  });

  const now = new Date();
  const pastEvents = events.filter(event => isBefore(parseISO(event.start_time), now) && !isToday(parseISO(event.start_time)));

  // Hide undo button after 10 seconds
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setClearedEvents([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const handleClearConfirm = () => {
    setClearedEvents(pastEvents);
    onClearPast();
    setShowClearConfirm(false);
    setShowUndo(true);
    toast({
      title: "Events cleared! ✨",
      description: "You can undo this action within 10 seconds~",
    });
  };

  const handleUndo = () => {
    // Re-create the cleared events
    clearedEvents.forEach(event => {
      onCreateEvent({
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        deadline: event.deadline
      });
    });
    setShowUndo(false);
    setClearedEvents([]);
    toast({
      title: "Events restored! 📸",
      description: "March 7th saved the day~",
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      deadline: ''
    });
    setEditingEvent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    if (editingEvent) {
      onUpdateEvent({ id: editingEvent.id, ...submissionData });
      playUpdateSound();
    } else {
      onCreateEvent(submissionData);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: format(parseISO(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      deadline: event.deadline ? format(parseISO(event.deadline), "yyyy-MM-dd'T'HH:mm") : ''
    });
    setIsCreateOpen(true);
  };

  const handleCopy = (event: Event) => {
    onCreateEvent({
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      deadline: event.deadline
    });
    playDuplicateSound();
    toast({
      title: "Event duplicated",
      description: "A copy of the event has been created",
    });
  };

  const todayEvents = events.filter(event => isToday(parseISO(event.start_time)));
  const upcomingEvents = events.filter(event => isAfter(parseISO(event.start_time), now) && !isToday(parseISO(event.start_time)));

  const getEventStatus = (event: Event) => {
    const eventDate = parseISO(event.start_time);
    if (isToday(eventDate)) return 'today';
    if (isAfter(eventDate, now)) return 'upcoming';
    return 'past';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'today': return 'text-amber-400 dark:text-amber-300';
      case 'upcoming': return 'text-sky-400 dark:text-sky-300';
      default: return 'text-slate-400 dark:text-slate-300';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'today': return 'border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10';
      case 'upcoming': return 'border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/10';
      default: return 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* March Confirmation Dialog */}
      <MarchConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handleClearConfirm}
        title="Clear all past events?"
        description="This will permanently delete all your past events. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
        cancelText="Wait, no!"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-events-theme">
          My Events
        </h2>
        <div className="flex items-center gap-2">
          {showUndo && (
            <Button 
              variant="outline"
              onClick={handleUndo}
              className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:from-pink-200 hover:to-purple-200 animate-pulse"
            >
              <Undo2 size={16} className="mr-2" />
              Undo Clear
            </Button>
          )}
          {pastEvents.length > 0 && !showUndo && (
            <Button 
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Clear Past
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                className="bg-events-theme hover:bg-events-theme/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
          <ResizableDialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Event title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              <Input
                type="datetime-local"
                placeholder="Start time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
              <Input
                type="datetime-local"
                placeholder="Deadline (optional)"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingEvent ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { playCancelSound(); setIsCreateOpen(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </ResizableDialogContent>
        </Dialog>
        </div>
      </div>

      {/* Event Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-400 dark:text-amber-300">{todayEvents.length}</div>
            <div className="text-sm text-muted-foreground">Today</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-400 dark:text-sky-300">{upcomingEvents.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-400 dark:text-slate-300">{pastEvents.length}</div>
            <div className="text-sm text-muted-foreground">Past</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Events */}
      <div>
        <h3 className="text-lg font-semibold text-amber-400 dark:text-amber-300 mb-3 flex items-center gap-2">
          <CalendarDays size={16} />
          Today's Events ({todayEvents.length})
        </h3>
        {todayEvents.length > 0 ? (
          <div className="space-y-3">
            {todayEvents.map((event) => {
              const status = getEventStatus(event);
              return (
                <Card key={event.id} className={getBorderColor(status)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{event.title}</h4>
                         {event.description && (
                           <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.description}</p>
                         )}
                        <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status)}`}>
                          <Clock size={12} />
                          {format(parseISO(event.start_time), 'HH:mm')} - Today
                          {event.deadline && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              • Deadline: {format(parseISO(event.deadline), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                          Today
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleCopy(event)}>
                          <Copy size={12} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                          <Edit size={12} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { playDeleteSound(); onDeleteEvent(event.id); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No events scheduled for today</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
          Upcoming Events ({upcomingEvents.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingEvents.map((event) => {
            const status = getEventStatus(event);
            return (
              <Card key={event.id} className={getBorderColor(status)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   {event.description && (
                     <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                   )}
                  <div className={`flex items-center gap-1 text-sm ${getStatusColor(status)}`}>
                    <Clock size={12} />
                    {format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm')}
                    {event.deadline && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        • Deadline: {format(parseISO(event.deadline), 'MMM dd, HH:mm')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopy(event)}>
                      <Copy size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                      <Edit size={12} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { playDeleteSound(); onDeleteEvent(event.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-400 dark:text-slate-300 mb-3">
            Past Events ({pastEvents.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.slice(0, 6).map((event) => {
              const status = getEventStatus(event);
              return (
                <Card key={event.id} className={getBorderColor(status)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-muted-foreground">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     {event.description && (
                       <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                     )}
                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(status)}`}>
                      <Clock size={12} />
                      {format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm')}
                      {event.deadline && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          • Deadline: {format(parseISO(event.deadline), 'MMM dd, HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(event)}>
                        <Copy size={12} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                        <Edit size={12} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { playDeleteSound(); onDeleteEvent(event.id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {pastEvents.length > 6 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              And {pastEvents.length - 6} more past events...
            </p>
          )}
        </div>
      )}

      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No events yet! Add your first event to get started.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};