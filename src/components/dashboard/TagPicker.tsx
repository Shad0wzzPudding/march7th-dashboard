import { useState } from 'react';
import { Tag } from '@/lib/types';
import { useTags } from '@/hooks/useTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Tag as TagIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PALETTE = [
  '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#64748b',
];

interface TagPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export const TagPicker = ({ selected, onChange }: TagPickerProps) => {
  const { tags, createTag, deleteTag } = useTags();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const tag = await createTag.mutateAsync({ name: newName.trim(), color: newColor });
    if (tag) onChange([...selected, tag.id]);
    setNewName('');
  };

  const selectedTags = tags.filter((t) => selected.includes(t.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {selectedTags.map((t) => (
          <TagChip key={t.id} tag={t} onRemove={() => toggle(t.id)} />
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7">
              <TagIcon size={12} className="mr-1" />
              Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-3" align="start">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags yet — create one below.</p>
              )}
              {tags.map((t) => (
                <div key={t.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-muted',
                      selected.includes(t.id) && 'bg-muted'
                    )}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    <span className="flex-1 text-left">{t.name}</span>
                    {selected.includes(t.id) && <span className="text-xs text-primary">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete tag "${t.name}"?`)) deleteTag.mutate(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-2">
              <div className="flex gap-1">
                <Input
                  placeholder="New tag name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button type="button" size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  <Plus size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export const TagChip = ({
  tag,
  onRemove,
  onClick,
  active,
}: {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
}) => {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all',
        onClick && 'cursor-pointer hover:scale-105',
        active === false && 'opacity-50'
      )}
      style={{
        background: `${tag.color}22`,
        borderColor: `${tag.color}66`,
        color: tag.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tag.color }} />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
};