import { useState } from 'react';
import { Interest } from '@/lib/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormattedTextarea } from '@/components/ui/formatted-textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Pin, PinOff, Clock, GripVertical, Copy, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { MarchConfirmDialog } from './MarchConfirmDialog';
import { SelectionCorners, SelectModeOverlay } from './SelectionCorners';
import { playSuccessSound, playCancelSound, playDeleteSound, playDuplicateSound, playPinSound, playUnpinSound, playUpdateSound, playEditSound } from '@/lib/sounds';

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
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    is_pinned: false,
    sort_order: 0
  });

  const { selectedIds, selectedCount, isSelecting, toggle, selectAll, clearSelection, enterSelectMode, isSelected } = useMultiSelect<Interest>();

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
      playUpdateSound();
    } else {
      onCreateInterest(submissionData);
      playSuccessSound();
    }
    
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (interest: Interest) => {
    playEditSound();
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
    if (interest.is_pinned) {
      playUnpinSound();
    } else {
      playPinSound();
    }
    onUpdateInterest({
      id: interest.id,
      is_pinned: !interest.is_pinned
    });
  };

  const handleCopy = (interest: Interest) => {
    onCreateInterest({
      title: interest.title,
      description: interest.description,
      deadline: interest.deadline,
      is_pinned: false,
      sort_order: 0
    });
    playDuplicateSound();
    toast({
      title: "Interest duplicated",
      description: "A copy of the interest has been created",
    });
  };

  // Batch actions
  const handleBatchCopy = () => {
    const selected = interests.filter(i => selectedIds.has(i.id));
    selected.forEach(interest => {
      onCreateInterest({
        title: interest.title,
        description: interest.description,
        deadline: interest.deadline,
        is_pinned: false,
        sort_order: 0
      });
    });
    playDuplicateSound();
    toast({ title: `${selected.length} interest(s) duplicated` });
    clearSelection();
  };

  const handleBatchDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBatchDelete = () => {
    selectedIds.forEach(id => onDeleteInterest(id));
    playDeleteSound();
    toast({ title: `${selectedCount} interest(s) deleted` });
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleBatchPin = () => {
    const selected = interests.filter(i => selectedIds.has(i.id) && !i.is_pinned);
    selected.forEach(interest => {
      onUpdateInterest({ id: interest.id, is_pinned: true });
    });
    playPinSound();
    toast({ title: `${selected.length} interest(s) pinned` });
    clearSelection();
  };

  const handleBatchUnpin = () => {
    const selected = interests.filter(i => selectedIds.has(i.id) && i.is_pinned);
    selected.forEach(interest => {
      onUpdateInterest({ id: interest.id, is_pinned: false });
    });
    playUnpinSound();
    toast({ title: `${selected.length} interest(s) unpinned` });
    clearSelection();
  };

  const handleCardClick = (interest: Interest) => {
    if (isSelecting) {
      toggle(interest.id);
    }
  };

  const pinnedInterests = interests.filter(i => i.is_pinned);
  const unpinnedInterests = interests.filter(i => !i.is_pinned);

  // Check if any selected interests are pinned/unpinned (for showing pin/unpin actions)
  const hasSelectedPinned = interests.some(i => selectedIds.has(i.id) && i.is_pinned);
  const hasSelectedUnpinned = interests.some(i => selectedIds.has(i.id) && !i.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in">
      <MarchConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmBatchDelete}
        title={`Delete ${selectedCount} interest(s)?`}
        description="This will permanently delete the selected interests."
        confirmText="Yes, delete them!"
        cancelText="Wait, no!"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-main-focus">
          My Interests
        </h2>
        <div className="flex items-center gap-2">
          {!isSelecting && interests.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={enterSelectMode}
            >
              <CheckSquare size={14} className="mr-2" />
              Select
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm} 
                className="bg-main-focus hover:bg-main-focus/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Interest
              </Button>
            </DialogTrigger>
            <ResizableDialogContent>
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
                <FormattedTextarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
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
                  <Button type="button" variant="outline" onClick={() => { playCancelSound(); setIsCreateOpen(false); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </ResizableDialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pinned Interests */}
      {pinnedInterests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-main-focus mb-3 flex items-center gap-2">
            <Pin size={16} />
            Pinned
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pinnedInterests.map((interest) => (
              <Card 
                key={interest.id} 
                className={`bg-main-focus/20 border-main-focus/40 transition-all relative overflow-visible ${
                  isSelecting ? 'cursor-pointer' : ''
                } ${isSelected(interest.id) ? 'ring-2 ring-main-focus shadow-lg' : ''}`}
                onClick={() => handleCardClick(interest)}
              >
                <SelectionCorners visible={isSelecting} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {isSelecting && (
                        <Checkbox
                          checked={isSelected(interest.id)}
                          onCheckedChange={() => toggle(interest.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                      )}
                      <CardTitle className="text-lg text-main-focus">{interest.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-main-focus/20 text-main-focus">
                        <Pin size={12} />
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {interest.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap"><FormattedText>{interest.description}</FormattedText></p>
                   )}
                  {interest.deadline && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  {!isSelecting && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handlePin(interest)}>
                        <PinOff size={12} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(interest)}>
                        <Copy size={12} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(interest)}>
                        <Edit size={12} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { playDeleteSound(); onDeleteInterest(interest.id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
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
            <Card 
              key={interest.id} 
              className={`hover:shadow-md transition-all relative overflow-visible ${
                isSelecting ? 'cursor-pointer' : ''
              } ${isSelected(interest.id) ? 'ring-2 ring-main-focus shadow-lg' : ''}`}
              onClick={() => handleCardClick(interest)}
            >
              <SelectionCorners visible={isSelecting} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {isSelecting && (
                      <Checkbox
                        checked={isSelected(interest.id)}
                        onCheckedChange={() => toggle(interest.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    )}
                    <CardTitle className="text-lg">{interest.title}</CardTitle>
                  </div>
                  {!isSelecting && <GripVertical size={16} className="text-gray-400 cursor-grab" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                  {interest.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap"><FormattedText>{interest.description}</FormattedText></p>
                 )}
                {interest.deadline && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock size={12} />
                    {format(parseISO(interest.deadline), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
                {!isSelecting && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handlePin(interest)}>
                      <Pin size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(interest)}>
                      <Copy size={12} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(interest)}>
                      <Edit size={12} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { playDeleteSound(); onDeleteInterest(interest.id); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                )}
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

      <MultiSelectActionBar
        selectedCount={selectedCount}
        onCopy={handleBatchCopy}
        onDelete={handleBatchDelete}
        onPin={hasSelectedUnpinned ? handleBatchPin : undefined}
        onUnpin={hasSelectedPinned ? handleBatchUnpin : undefined}
        onCancel={clearSelection}
        onSelectAll={() => selectAll(interests)}
        totalCount={interests.length}
      />
    </div>
  );
};
