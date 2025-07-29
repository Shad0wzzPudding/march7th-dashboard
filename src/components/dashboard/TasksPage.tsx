import { useState } from 'react';
import { Task } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface TasksPageProps {
  tasks: Task[];
  onCreateTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTask: (data: Partial<Task> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksPage = ({ 
  tasks, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask 
}: TasksPageProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    is_completed: false
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      is_completed: false
    });
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      deadline: new Date(formData.deadline).toISOString(),
    };

    if (editingTask) {
      onUpdateTask({ id: editingTask.id, ...submissionData });
    } else {
      onCreateTask(submissionData);
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      deadline: format(parseISO(task.deadline), "yyyy-MM-dd'T'HH:mm"),
      is_completed: task.is_completed
    });
    setIsCreateOpen(true);
  };

  const handleToggleComplete = (task: Task) => {
    onUpdateTask({
      id: task.id,
      is_completed: !task.is_completed
    });
  };

  const now = new Date();
  const pendingTasks = tasks.filter(task => !task.is_completed);
  const completedTasks = tasks.filter(task => task.is_completed);
  
  const overdueTasks = pendingTasks.filter(task => isBefore(parseISO(task.deadline), now));
  const upcomingTasks = pendingTasks.filter(task => isAfter(parseISO(task.deadline), now));

  const getTaskStatus = (task: Task) => {
    if (task.is_completed) return 'completed';
    if (isBefore(parseISO(task.deadline), now)) return 'overdue';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'overdue': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20';
      case 'overdue': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20';
      default: return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          My Tasks
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
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
              <Input
                type="datetime-local"
                placeholder="Deadline"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
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
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
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
                            <CheckCircle2 size={20} className="text-green-600" /> : 
                            <Circle size={20} className="text-gray-400" />
                          }
                        </Button>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status)}`}>
                            <Clock size={12} />
                            {format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                          <Edit size={12} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onDeleteTask(task.id)}
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
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
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
                          <CheckCircle2 size={20} className="text-green-600" /> : 
                          <Circle size={20} className="text-gray-400" />
                        }
                      </Button>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status)}`}>
                          <Clock size={12} />
                          {format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                        <Edit size={12} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onDeleteTask(task.id)}
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
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
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
                          <CheckCircle2 size={20} className="text-green-600" />
                        </Button>
                        <div className="flex-1">
                          <h4 className="font-semibold line-through text-muted-foreground">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(status)}`}>
                            <Clock size={12} />
                            {format(parseISO(task.deadline), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          Completed
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                          <Edit size={12} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onDeleteTask(task.id)}
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