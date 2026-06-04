import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle, Calendar, CalendarClock, Copy, Trash, Undo2, X, CheckSquare, Repeat } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { MarchConfirmDialog } from './MarchConfirmDialog';
import { playSuccessSound, playCompletionSound, playCancelSound, playDeleteSound, playDuplicateSound, playUpdateSound, playEditSound } from '@/lib/sounds';
import { TagPicker, TagChip } from './TagPicker';
import { SortAndFilterBar, SortOption, sortItems, filterByTags } from './SortAndFilterBar';
import { useTags } from '@/hooks/useTags';
import { DragReorderList } from './DragReorderList';

interface TasksPageProps {
  tasks: Task[];
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { __duplicate?: boolean; __silent?: boolean }) => void;
  onUpdateTask: (data: Partial<Task> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
  onRestoreTasks?: (tasks: Task[]) => void;
}

export const TasksPage = ({ 
  tasks, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask,
  onClearCompleted
}: TasksPageProps) => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearedTasks, setClearedTasks] = useState<Task[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    deadline: '',
    is_completed: false,
    tag_ids: [] as string[],
    recurrence_unit: '' as '' | 'day' | 'week' | 'month' | 'year',
    recurrence_interval: 1,
  });
  const [sort, setSort] = useState<SortOption>('deadline_asc');
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const { tags } = useTags();
  const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Task>();

  // Hide undo button after 10 seconds
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        setShowUndo(false);
        setClearedTasks([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showUndo]);

  const handleClearConfirm = () => {
    const completed = tasks.filter(task => task.is_completed);
    setClearedTasks(completed);
    onClearCompleted();
    setShowClearConfirm(false);
    setShowUndo(true);
    toast({
      title: "Tasks cleared! ✨",
      description: "You can undo this action within 10 seconds~",
    });
  };

  const handleUndo = () => {
    clearedTasks.forEach(task => {
      onCreateTask({
        title: task.title,
        description: task.description,
        start_date: task.start_date,
        deadline: task.deadline,
        is_completed: true,
        tag_ids: task.tag_ids || [],
        recurrence_unit: task.recurrence_unit || null,
        recurrence_interval: task.recurrence_interval || 1,
      });
    });
    setShowUndo(false);
    setClearedTasks([]);
    toast({
      title: "Tasks restored! 📸",
      description: "March 7th saved the day~",
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      deadline: '',
      is_completed: false,
      tag_ids: [],
      recurrence_unit: '',
      recurrence_interval: 1,
    });
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      recurrence_unit: formData.recurrence_unit || null,
      recurrence_interval: formData.recurrence_unit ? Math.max(1, Number(formData.recurrence_interval) || 1) : 1,
    };

    if (editingTask) {
      onUpdateTask({ id: editingTask.id, ...submissionData });
      playUpdateSound();
    } else {
      onCreateTask(submissionData as any);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (task: Task) => {
    playEditSound();
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      start_date: task.start_date ? format(parseISO(task.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      deadline: task.deadline ? format(parseISO(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      is_completed: task.is_completed,
      tag_ids: task.tag_ids || [],
      recurrence_unit: (task.recurrence_unit as any) || '',
      recurrence_interval: task.recurrence_interval || 1,
    });
    setIsCreateOpen(true);
  };

  const handleToggleComplete = (task: Task) => {
    const isCompleting = !task.is_completed;
    onUpdateTask({
      id: task.id,
      is_completed: isCompleting
    });
    if (isCompleting) {
      playCompletionSound();
    } else {
      playUpdateSound();
    }
  };

  const handleCopy = (task: Task) => {
    onCreateTask({
      title: task.title,
      description: task.description,
      start_date: task.start_date,
      deadline: task.deadline,
      is_completed: false,
      tag_ids: task.tag_ids || [],
      recurrence_unit: task.recurrence_unit || null,
      recurrence_interval: task.recurrence_interval || 1,
      __duplicate: true,
    });
    playDuplicateSound();
  };

  // Batch actions
  const handleBatchCopy = () => {
    const selected = tasks.filter(t => selectedIds.has(t.id));
    selected.forEach((task, idx) => {
      onCreateTask({
        title: task.title,
        description: task.description,
        start_date: task.start_date,
        deadline: task.deadline,
        is_completed: false,
        tag_ids: task.tag_ids || [],
        recurrence_unit: task.recurrence_unit || null,
        recurrence_interval: task.recurrence_interval || 1,
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
    selectedIds.forEach(id => onDeleteTask(id));
    playDeleteSound();
    toast({ title: `${selectedCount} task(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleCardClick = (task: Task) => {
    if (isSelecting) {
      toggle(task.id);
    }
  };

  const now = new Date();
  const visibleTasks = useMemo(
    () => sortItems(filterByTags(tasks, filterTagIds), sort, tagsById),
    [tasks, filterTagIds, sort, tagsById]
  );
  const pendingTasks = visibleTasks.filter(task => !task.is_completed);
  const completedTasks = visibleTasks.filter(task => task.is_completed);
  
  const overdueTasks = pendingTasks.filter(task => task.deadline && isBefore(parseISO(task.deadline), now));
  const upcomingTasks = pendingTasks.filter(task => !task.deadline || isAfter(parseISO(task.deadline), now));

  const handleUserReorder = (orderedIds: string[]) => {
    orderedIds.forEach((id, index) => {
      onUpdateTask({ id, sort_order: index } as any);
    });
  };

  const getTaskStatus = (task: Task) => {
    if (task.is_completed) return 'completed';
    if (task.deadline && isBefore(parseISO(task.deadline), now)) return 'overdue';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 dark:text-emerald-300';
      case 'overdue': return 'text-rose-400 dark:text-rose-300';
      default: return 'text-sky-400 dark:text-sky-300';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10';
      case 'overdue': return 'border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/10';
      default: return 'border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/10';
    }
  };

  const renderTaskCard = (task: Task, showBadge?: string) => {
    const status = getTaskStatus(task);
    return (
      <Card 
        key={task.id} 
        className={`${getBorderColor(status)} transition-all ${
          isSelecting ? 'cursor-pointer' : ''
        } ${isSelected(task.id) ? 'ring-2 ring-upcoming-events shadow-lg' : ''}`}
        onClick={() => handleCardClick(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {isSelecting ? (
                <Checkbox
                  checked={isSelected(task.id)}
                  onCheckedChange={() => toggle(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleComplete(task)}
                  className="mt-1 p-0 h-6 w-6"
                >
                   {task.is_completed ? 
                     <CheckCircle2 size={20} className="text-emerald-400" /> : 
                     <Circle size={20} className="text-gray-400" />
                   }
                </Button>
              )}
              <div className="flex-1">
                <h4 className={`font-semibold ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h4>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap"><FormattedText>{task.description}</FormattedText></p>
                  )}
                 <div className="space-y-1 mt-2">
                   {task.start_date ? (
                     <div className="flex items-center gap-1 text-sm text-muted-foreground">
                       <Calendar size={12} />
                       <span>Start: {format(parseISO(task.start_date), 'MMM dd, yyyy HH:mm')}</span>
                     </div>
                   ) : null}
                   <div className={`flex items-center gap-1 text-sm ${getStatusColor(status)}`}>
                     <CalendarClock size={12} />
                     <span>Due: {task.deadline ? format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm') : 'No deadline'}</span>
                   </div>
                 </div>
                 {task.tag_ids && task.tag_ids.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-2">
                     {task.tag_ids.map(id => tagsById[id] && <TagChip key={id} tag={tagsById[id]} />)}
                   </div>
                 )}
                 {task.recurrence_unit && (
                   <div className="mt-2">
                     <Badge variant="outline" className="text-xs border-violet-300 text-violet-500 dark:text-violet-300">
                       <Repeat size={10} className="mr-1" />
                       Every {(task.recurrence_interval || 1) > 1 ? `${task.recurrence_interval} ` : ''}{task.recurrence_unit}{(task.recurrence_interval || 1) > 1 ? 's' : ''}
                     </Badge>
                   </div>
                 )}
              </div>
            </div>
            {!isSelecting && (
              <div className="flex items-center gap-2">
                {showBadge === 'overdue' && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                {showBadge === 'completed' && <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">Completed</Badge>}
                <Button size="sm" variant="outline" onClick={() => handleCopy(task)}>
                  <Copy size={12} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                  <Edit size={12} />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { playDeleteSound(); onDeleteTask(task.id); }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
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
        title="Clear all completed tasks?"
        description="This will permanently delete all your completed tasks. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
        cancelText="Wait, no!"
      />
      <MarchConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} task(s)?`}
        description="This will permanently delete the selected tasks."
        confirmText="Yes, delete them!"
        cancelText="Wait, no!"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-upcoming-events">
          My Tasks
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
          {completedTasks.length > 0 && !showUndo && (
            <Button 
              variant="outline"
              onClick={() => setShowClearConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Clear Completed
            </Button>
          )}
          {!isSelecting && tasks.length > 0 && (
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
                onClick={resetForm}
                className="bg-upcoming-events hover:bg-upcoming-events/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
          <ResizableDialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <FormattedTextarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date <span className="text-muted-foreground">(optional)</span></label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="datetime-local"
                    placeholder="When task becomes active"
                    value={formData.start_date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(prev => {
                        const next = { ...prev, start_date: v };
                        if (v) {
                          next.deadline = format(addHours(new Date(v), 5), "yyyy-MM-dd'T'HH:mm");
                        }
                        return next;
                      });
                    }}
                    className="flex-1 h-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => formData.start_date && setFormData(prev => ({ ...prev, start_date: '' }))}
                    className={`shrink-0 h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                      formData.start_date 
                        ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 cursor-pointer' 
                        : 'bg-white dark:bg-background border-input cursor-default'
                    }`}
                  >
                    {formData.start_date && <X size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline <span className="text-muted-foreground">(optional)</span></label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="datetime-local"
                    placeholder="When task is due"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="flex-1 h-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => formData.deadline && setFormData(prev => ({ ...prev, deadline: '' }))}
                    className={`shrink-0 h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                      formData.deadline 
                        ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600 cursor-pointer' 
                        : 'bg-white dark:bg-background border-input cursor-default'
                    }`}
                  >
                    {formData.deadline && <X size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Repeat size={14} /> Task Type
                </label>
                <Select
                  value={formData.recurrence_unit === '' ? 'one_time' : 'recurring'}
                  onValueChange={(val) =>
                    setFormData(prev => ({
                      ...prev,
                      recurrence_unit: val === 'one_time' ? '' : (prev.recurrence_unit || 'week'),
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time task</SelectItem>
                    <SelectItem value="recurring">Every X (recurring)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.recurrence_unit !== '' && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Every</span>
                    <Input
                      type="number"
                      min={1}
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: Math.max(1, Number(e.target.value) || 1) }))}
                      className="w-20 h-9 text-sm"
                    />
                    <Select
                      value={formData.recurrence_unit}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, recurrence_unit: val as any }))}
                    >
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day(s)</SelectItem>
                        <SelectItem value="week">Week(s)</SelectItem>
                        <SelectItem value="month">Month(s)</SelectItem>
                        <SelectItem value="year">Year(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.recurrence_unit !== '' && !formData.deadline && (
                  <p className="text-xs text-amber-500">Recurring tasks need a deadline to renew.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_completed"
                  checked={formData.is_completed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_completed: !!checked }))}
                />
                <label htmlFor="is_completed" className="text-sm">Mark as completed</label>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags</label>
                <TagPicker
                  selected={formData.tag_ids}
                  onChange={(ids) => setFormData(prev => ({ ...prev, tag_ids: ids }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Update' : 'Create'}
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

      {/* Task Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-sky-400 dark:text-sky-300">{upcomingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-rose-400 dark:text-rose-300">{overdueTasks.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-400 dark:text-emerald-300">{completedTasks.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {tasks.length > 0 && (
        <SortAndFilterBar
          sort={sort}
          onSortChange={setSort}
          filterTagIds={filterTagIds}
          onFilterChange={setFilterTagIds}
          showCompleted
        />
      )}

      {sort === 'user' ? (
        <div>
          <h3 className="text-lg font-semibold text-pink-500 dark:text-pink-300 mb-3">
            My Order ({visibleTasks.length}) — drag to arrange
          </h3>
          <DragReorderList
            items={visibleTasks}
            getId={(t) => t.id}
            onReorder={handleUserReorder}
            renderItem={(task) => renderTaskCard(task)}
          />
        </div>
      ) : (
      <>
      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-rose-400 dark:text-rose-300 mb-3">
            Overdue Tasks ({overdueTasks.length})
          </h3>
          <div className="space-y-3">
            {overdueTasks.map((task) => renderTaskCard(task, 'overdue'))}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      <div>
        <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
          Upcoming Tasks ({upcomingTasks.length})
        </h3>
        <div className="space-y-3">
          {upcomingTasks.map((task) => renderTaskCard(task))}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-emerald-400 dark:text-emerald-300 mb-3">
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => renderTaskCard(task, 'completed'))}
          </div>
        </div>
      )}
      </>
      )}

      {tasks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No tasks yet! Add your first task to get started.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onCancel={clearSelection}
        onSelectAll={() => selectAll(tasks)}
        totalCount={tasks.length}
      />
    </div>
  );
};
