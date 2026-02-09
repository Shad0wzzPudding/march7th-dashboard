import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle, Calendar, CalendarClock, Copy, Trash, Undo2, X } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { MarchConfirmDialog } from './MarchConfirmDialog';
import { playSuccessSound, playCompletionSound, playCancelSound, playDeleteSound, playDuplicateSound } from '@/lib/sounds';

interface TasksPageProps {
  tasks: Task[];
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
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
  const [clearedTasks, setClearedTasks] = useState<Task[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    deadline: '',
    is_completed: false
  });

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
    // Re-create the cleared tasks
    clearedTasks.forEach(task => {
      onCreateTask({
        title: task.title,
        description: task.description,
        start_date: task.start_date,
        deadline: task.deadline,
        is_completed: true
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
      is_completed: false
    });
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    if (editingTask) {
      onUpdateTask({ id: editingTask.id, ...submissionData });
    } else {
      onCreateTask(submissionData as any);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      start_date: task.start_date ? format(parseISO(task.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      deadline: task.deadline ? format(parseISO(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      is_completed: task.is_completed
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
    }
  };

  const handleCopy = (task: Task) => {
    onCreateTask({
      title: task.title,
      description: task.description,
      start_date: task.start_date,
      deadline: task.deadline,
      is_completed: false
    });
    playDuplicateSound();
    toast({
      title: "Task duplicated",
      description: "A copy of the task has been created",
    });
  };

  const now = new Date();
  const pendingTasks = tasks.filter(task => !task.is_completed);
  const completedTasks = tasks.filter(task => task.is_completed);
  
  const overdueTasks = pendingTasks.filter(task => task.deadline && isBefore(parseISO(task.deadline), now));
  const upcomingTasks = pendingTasks.filter(task => !task.deadline || isAfter(parseISO(task.deadline), now));

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* March Confirmation Dialog */}
      <MarchConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        onConfirm={handleClearConfirm}
        title="Clear all completed tasks?"
        description="This will permanently delete all your completed tasks. But don't worry, you'll have 10 seconds to undo!"
        confirmText="Yep, clear them!"
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
              <Textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date <span className="text-muted-foreground">(optional)</span></label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="datetime-local"
                    placeholder="When task becomes active"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_completed"
                  checked={formData.is_completed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_completed: !!checked }))}
                />
                <label htmlFor="is_completed" className="text-sm">Mark as completed</label>
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

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-rose-400 dark:text-rose-300 mb-3">
            Overdue Tasks ({overdueTasks.length})
          </h3>
          <div className="space-y-3">
            {overdueTasks.map((task) => {
              const status = getTaskStatus(task);
              return (
                <Card key={task.id} className={getBorderColor(status)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
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
                        <div className="flex-1">
                          <h4 className={`font-semibold ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                           {task.description && (
                             <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      <div>
        <h3 className="text-lg font-semibold text-sky-400 dark:text-sky-300 mb-3">
          Upcoming Tasks ({upcomingTasks.length})
        </h3>
        <div className="space-y-3">
          {upcomingTasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <Card key={task.id} className={getBorderColor(status)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
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
                      <div className="flex-1">
                        <h4 className={`font-semibold ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                         {task.description && (
                           <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-emerald-400 dark:text-emerald-300 mb-3">
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => {
              const status = getTaskStatus(task);
              return (
                <Card key={task.id} className={getBorderColor(status)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleComplete(task)}
                          className="mt-1 p-0 h-6 w-6"
                        >
                           <CheckCircle2 size={20} className="text-emerald-400" />
                        </Button>
                        <div className="flex-1">
                          <h4 className="font-semibold line-through text-muted-foreground">
                            {task.title}
                          </h4>
                           {task.description && (
                             <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                          Completed
                        </Badge>
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
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
    </div>
  );
};