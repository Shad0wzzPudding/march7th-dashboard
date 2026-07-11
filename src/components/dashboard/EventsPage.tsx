import { useState, useEffect, useMemo } from 'react';
import { Event } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CalendarDays, Copy, Trash, Undo2, CheckSquare } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isToday, addHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { MarchConfirmDialog } from './MarchConfirmDialog';
import { playSuccessSound, playCancelSound, playDeleteSound, playDuplicateSound, playUpdateSound, playEditSound, playAddSound } from '@/lib/sounds';
import { TagPicker, TagChip } from './TagPicker';
import { AttachmentsField, AttachmentsChips } from './AttachmentsField';
import { SortAndFilterBar, SortOption, sortItems, filterByTags } from './SortAndFilterBar';
import { useSortPreference } from '@/hooks/useSortPreference';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';

interface EventsPageProps {
  events: Event[];
  onCreateEvent: (data: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }) => void;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearedEvents, setClearedEvents] = useState<Event[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    deadline: '',
    tag_ids: [] as string[],
    attachments: [] as import('@/lib/types').Attachment[],
  });
  const [sort, setSort] = useSortPreference('events');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const { tags } = useTags();
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Event>();

  const now = new Date();
  const visibleEvents = useMemo(
    () => sortItems(filterByTags(events, filterTagIds), sort, tagsById),
    [events, filterTagIds, sort, tagsById]
  );
  const pastEvents = visibleEvents.filter(event => event.start_time && isBefore(parseISO(event.start_time), now) && !isToday(parseISO(event.start_time)));

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
    clearedEvents.forEach(event => {
      onCreateEvent({
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        deadline: event.deadline,
        attachments: event.attachments || [],
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
      deadline: '',
      tag_ids: [],
      attachments: [],
    });
    setEditingEvent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
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
    playEditSound();
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time ? format(parseISO(event.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      deadline: event.deadline ? format(parseISO(event.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      tag_ids: event.tag_ids || [],
      attachments: event.attachments || [],
    });
    setIsCreateOpen(true);
  };

  const handleCopy = (event: Event) => {
    onCreateEvent({
      title: event.title,
      description: event.description,
      start_time: event.start_time,
      deadline: event.deadline,
      tag_ids: event.tag_ids || [],
      attachments: event.attachments || [],
      __duplicate: true,
    });
    playDuplicateSound();
  };

  // Batch actions
  const handleBatchCopy = () => {
    const selected = events.filter(e => selectedIds.has(e.id));
    selected.forEach((event, idx) => {
      onCreateEvent({
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        deadline: event.deadline,
        tag_ids: event.tag_ids || [],
        attachments: event.attachments || [],
        __duplicate: true,
        __silent: idx !== selected.length - 1,
      });
    });
    playDuplicateSound();
    clearSelection();
  };

  const handleBatchDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    selectedIds.forEach(id => onDeleteEvent(id));
    playDeleteSound();
    toast({ title: `${selectedCount} event(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (event: Event) => {
    if (isSelecting) {
      toggle(event.id);
    }
  };

  const todayEvents = visibleEvents.filter(event => event.start_time && isToday(parseISO(event.start_time)));
  const upcomingEvents = visibleEvents.filter(event => !event.start_time || (isAfter(parseISO(event.start_time), now) && !isToday(parseISO(event.start_time))));

  const handleUserReorder = (orderedIds: string[]) => {
    orderedIds.forEach((id, index) => {
      onUpdateEvent({ id, sort_order: index } as any);
    });
  };

  const getEventStatus = (event: Event) => {
    if (!event.start_time) return 'upcoming';
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

  const renderEventCard = (event: Event, variant: 'today' | 'upcoming' | 'past') => {
    const status = getEventStatus(event);
    return (
      <Card 
        key={event.id} 
        className={`${getBorderColor(status)} transition-all flex flex-col h-full min-h-[200px] ${
          isSelecting ? 'cursor-pointer' : ''
        } ${isSelected(event.id) ? 'ring-2 ring-events-theme shadow-lg' : ''}`}
        onClick={() => handleCardClick(event)}
      >
        {variant === 'today' ? (
          <CardContent className="p-4 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {isSelecting && (
                  <Checkbox
                    checked={isSelected(event.id)}
                    onCheckedChange={() => toggle(event.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto overscroll-contain pr-1" onClick={(e) => e.stopPropagation()}><FormattedText>{event.description}</FormattedText></p>
                   )}
                  <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status)}`}>
                    <Clock size={12} />
                    {event.start_time ? `${format(parseISO(event.start_time), 'HH:mm')} - Today` : 'No start time'}
                    {event.deadline && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        • Deadline: {format(parseISO(event.deadline), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  {event.tag_ids && event.tag_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                    </div>
                  )}
                  {event.attachments && event.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentsChips attachments={event.attachments} />
                    </div>
                  )}
                </div>
              </div>
              {!isSelecting && (
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
              )}
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {isSelecting && (
                  <Checkbox
                    checked={isSelected(event.id)}
                    onCheckedChange={() => toggle(event.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                )}
                <CardTitle className={`text-${variant === 'past' ? 'base text-muted-foreground' : 'lg'}`}>{event.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto overscroll-contain pr-1" onClick={(e) => e.stopPropagation()}><FormattedText>{event.description}</FormattedText></p>
               )}
              <div className={`flex items-center gap-1 text-sm ${getStatusColor(status)}`}>
                <Clock size={12} />
                {event.start_time ? format(parseISO(event.start_time), 'MMM dd, yyyy HH:mm') : 'No start time'}
                {event.deadline && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    • Deadline: {format(parseISO(event.deadline), 'MMM dd, HH:mm')}
                  </span>
                )}
              </div>
              {event.tag_ids && event.tag_ids.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                </div>
              )}
              <AttachmentsChips attachments={event.attachments} />
              {!isSelecting && (
                <div className="flex items-center gap-2 pt-2 mt-auto">
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
              )}
            </CardContent>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* March Confirmation Dialogs */}
      <MarchConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handleClearConfirm}
        title="Clear all past events?"
        description="This will permanently delete all your past events. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
        cancelText="Wait, no!"
      />
      <MarchConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} event(s)?`}
        description="This will permanently delete the selected events."
        confirmText="Yes, delete them!"
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
          {!isSelecting && events.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={enterSelectMode}
            >
              <CheckSquare size={14} className="mr-2" />
              Select
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open && isCreateOpen) playCancelSound(); setIsCreateOpen(open); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { playAddSound(); resetForm(); }}
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
              <FormattedTextarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
              />
              <Input
                type="datetime-local"
                placeholder="Start time (optional)"
                value={formData.start_time}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, start_time: v };
                    if (v) {
                      next.deadline = format(addHours(new Date(v), 5), "yyyy-MM-dd'T'HH:mm");
                    }
                    return next;
                  });
                }}
              />
              <Input
                type="datetime-local"
                placeholder="Deadline (optional)"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium mb-1 block">Tags</label>
                <TagPicker
                  selected={formData.tag_ids}
                  onChange={(ids) => setFormData(prev => ({ ...prev, tag_ids: ids }))}
                />
              </div>
              <AttachmentsField
                value={formData.attachments}
                onChange={(atts) => setFormData(prev => ({ ...prev, attachments: atts }))}
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

      {events.length > 0 && (
        <SortAndFilterBar
          sort={sort}
          onSortChange={setSort}
          filterTagIds={filterTagIds}
          onFilterChange={setFilterTagIds}
        />
      )}

      {(() => {
        const renderSection = (
          items: Event[],
          variant: 'today' | 'upcoming' | 'past',
          gridClass: string
        ) =>
          sort === 'user' ? (
            <DragReorderList
              items={items}
              getId={(e) => e.id}
              onReorder={handleUserReorder}
              renderItem={(event) => renderEventCard(event, variant)}
            />
          ) : (
            <div className={gridClass}>
              {items.map((event) => renderEventCard(event, variant))}
            </div>
          );
        return (
          <>
            <div>
              <h3 className="text-lg font-semibold text-amber-400 dark:text-amber-300 mb-3 flex items-center gap-2">
                <CalendarDays size={16} />
                Today's Events ({todayEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {todayEvents.length > 0 ? (
                renderSection(todayEvents, 'today', 'space-y-3')
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">No events scheduled for today</p>
                  </CardContent>
                </Card>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
                Upcoming Events ({upcomingEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
              </h3>
              {renderSection(upcomingEvents, 'upcoming', 'grid gap-4 md:grid-cols-2')}
            </div>
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-400 dark:text-slate-300 mb-3">
                  Past Events ({pastEvents.length}){sort === 'user' ? ' — drag to arrange' : ''}
                </h3>
                {sort === 'user' ? (
                  renderSection(pastEvents, 'past', '')
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {pastEvents.slice(0, 6).map((event) => renderEventCard(event, 'past'))}
                    </div>
                    {pastEvents.length > 6 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        And {pastEvents.length - 6} more past events...
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        );
      })()}

      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No events yet! Add your first event to get started.</p>
            <Button onClick={() => { playAddSound(); setIsCreateOpen(true); }}>
              <Plus size={16} className="mr-2" />
              Add Your First Event
            </Button>
          </CardContent>
        </Card>
      )}

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onCancel={clearSelection}
        onSelectAll={() => selectAll(events)}
        totalCount={events.length}
      />
    </div>
  );
};
