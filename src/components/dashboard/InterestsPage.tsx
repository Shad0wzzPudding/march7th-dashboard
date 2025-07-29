import { useState } from 'react';
import { Interest } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Pin, PinOff, Clock, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface InterestsPageProps {
  interests: Interest[];
  onCreateInterest: (data: Omit<Interest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateInterest: (data: Partial<Interest> & { id: string }) => void;
  onDeleteInterest: (id: string) => void;
}

export const InterestsPage = ({ 
  interests, 
  onCreateInterest, 
  onUpdateInterest, 
  onDeleteInterest 
}: InterestsPageProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    is_pinned: false,
    sort_order: 0
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      is_pinned: false,
      sort_order: 0
    });
    setEditingInterest(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    };

    if (editingInterest) {
      onUpdateInterest({ id: editingInterest.id, ...submissionData });
    } else {
      onCreateInterest(submissionData);
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (interest: Interest) => {
    setEditingInterest(interest);
    setFormData({
      title: interest.title,
      description: interest.description || '',
      deadline: interest.deadline ? format(parseISO(interest.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      is_pinned: interest.is_pinned,
      sort_order: interest.sort_order
    });
    setIsCreateOpen(true);
  };

  const handlePin = (interest: Interest) => {
    onUpdateInterest({
      id: interest.id,
      is_pinned: !interest.is_pinned
    });
  };

  const pinnedInterests = interests.filter(i => i.is_pinned);
  const unpinnedInterests = interests.filter(i => !i.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          My Interests
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Plus size={16} className="mr-2" />
              Add Interest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInterest ? 'Edit Interest' : 'Create New Interest'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Interest title"
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
                placeholder="Deadline (optional)"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_pinned" className="text-sm">Pin to main focus</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingInterest ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pinned Interests */}
      {pinnedInterests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-3 flex items-center gap-2">
            <Pin size={16} />
            Pinned
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pinnedInterests.map((interest) => (
              <Card key={interest.id} className="border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-pink-700 dark:text-pink-300">{interest.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300">
                        <Pin size={12} />
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interest.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{interest.description}</p>
                  )}
                  {interest.deadline && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handlePin(interest)}>
                      <PinOff size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(interest)}>
                      <Edit size={12} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDeleteInterest(interest.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unpinned Interests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-3">
          All Interests ({unpinnedInterests.length})
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unpinnedInterests.map((interest) => (
            <Card key={interest.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{interest.title}</CardTitle>
                  <GripVertical size={16} className="text-gray-400 cursor-grab" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {interest.description && (
                  <p className="text-sm text-muted-foreground">{interest.description}</p>
                )}
                {interest.deadline && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock size={12} />
                    {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handlePin(interest)}>
                    <Pin size={12} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(interest)}>
                    <Edit size={12} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDeleteInterest(interest.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {interests.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No interests yet! Add your first interest to get started.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Your First Interest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};