import { useState } from 'react';
import { DailyTask } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, CheckCircle, Clock, X, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DailyTaskPageProps {
  dailyTasks: DailyTask[];
  onCreateDailyTask: (task: Omit<DailyTask, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'task_date'>) => void;
  onUpdateDailyTask: (data: { id: string } & Partial<DailyTask>) => void;
  onDeleteDailyTask: (id: string) => void;
}

export const DailyTaskPage = ({ 
  dailyTasks, 
  onCreateDailyTask, 
  onUpdateDailyTask, 
  onDeleteDailyTask 
}: DailyTaskPageProps) => {
  const { toast } = useToast();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  const incompleteTasks = dailyTasks.filter(task => !task.is_completed);
  const completedTasks = dailyTasks.filter(task => task.is_completed);

  const toggleTaskCompletion = (taskId: string, isCompleted: boolean) => {
    onUpdateDailyTask({ id: taskId, is_completed: !isCompleted });
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    onCreateDailyTask({
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      deadline: newTask.deadline || undefined,
      is_completed: false
    });

    setNewTask({ title: '', description: '', deadline: '' });
    setShowAddForm(false);
  };

  const handleCopy = (task: DailyTask) => {
    onCreateDailyTask({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      is_completed: false
    });
    toast({
      title: "Daily task duplicated",
      description: "A copy of the task has been created",
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dailyTasks.length}
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
      </div>

      {/* Add New Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus size={20} />
              <span className="font-bold">Add New Task</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  placeholder="Enter task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  placeholder="Enter task description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time (optional)</label>
                <Input
                  type="time"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
                  Add Task
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
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
                    {task.deadline && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} />
                        Due: {task.deadline}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(task)}
                  >
                    <Copy size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteDailyTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No pending tasks! Add some tasks to get started.
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

      {dailyTasks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No daily tasks yet! Add your first task to get started.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};