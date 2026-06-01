import { useState } from 'react';
import { useTags } from '@/hooks/useTags';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Tag } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X, Tag as TagIcon, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagChip } from './TagPicker';
import { MarchConfirmDialog } from './MarchConfirmDialog';

const PALETTE = [
  '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#64748b',
];

const ColorPalette = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
  <div className="flex flex-wrap gap-1">
    {PALETTE.map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={cn(
          'w-5 h-5 rounded-full border-2 transition-all',
          value === c ? 'border-foreground scale-110' : 'border-transparent'
        )}
        style={{ background: c }}
        aria-label={`Pick color ${c}`}
      />
    ))}
    <label
      className={cn(
        'relative w-5 h-5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden',
        !PALETTE.includes(value) ? 'border-foreground scale-110' : 'border-transparent'
      )}
      style={{
        background: !PALETTE.includes(value)
          ? value
          : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
      }}
      aria-label="Pick custom color"
      title="Custom color"
    >
      <Pipette size={10} className="text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  </div>
);

const TagRow = ({ tag, count, onDelete }: { tag: Tag; count: number; onDelete: (t: Tag) => void }) => {
  const { updateTag } = useTags();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  const save = async () => {
    if (!name.trim()) return;
    await updateTag.mutateAsync({ id: tag.id, name: name.trim(), color });
    setEditing(false);
  };

  const cancel = () => {
    setName(tag.name);
    setColor(tag.color);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2 rounded-lg hover:bg-muted/50 group">
        <div className="flex items-center min-w-0 max-w-full mr-auto">
          <TagChip tag={tag} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0"
            title={`${count} item${count === 1 ? '' : 's'} use this tag`}
          >
            {count} {count === 1 ? 'item' : 'items'}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100" onClick={() => setEditing(true)}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-60 group-hover:opacity-100" onClick={() => onDelete(tag)}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 rounded-lg bg-muted/40 space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') cancel();
          }}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={save} disabled={!name.trim()}>
          <Check size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}>
          <X size={14} />
        </Button>
      </div>
      <ColorPalette value={color} onChange={setColor} />
    </div>
  );
};

export const TagManager = () => {
  const { tags, isLoading, createTag, deleteTag } = useTags();
  const { interests, tasks, events } = useDashboardData();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);

  const tagCounts: Record<string, number> = {};
  for (const list of [interests, tasks, events]) {
    for (const item of list as Array<{ tag_ids?: string[] }>) {
      for (const id of item.tag_ids || []) {
        tagCounts[id] = (tagCounts[id] || 0) + 1;
      }
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTag.mutateAsync({ name: newName.trim(), color: newColor });
    setNewName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon size={18} className="text-pink-500" />
          Tag Management
        </CardTitle>
        <CardDescription>
          Create, rename, recolor and delete the tags shared across Interests, Tasks and Events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new tag */}
        <div className="space-y-2 p-3 rounded-lg border border-dashed">
          <p className="text-xs font-medium text-muted-foreground">New tag</p>
          <div className="flex gap-2">
            <Input
              placeholder="Tag name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
              }}
              className="h-9 text-sm"
            />
            <Button onClick={handleCreate} disabled={!newName.trim() || createTag.isPending} size="sm">
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </div>
          <ColorPalette value={newColor} onChange={setNewColor} />
        </div>

        {/* Existing tags */}
        <div className="space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tags…</p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No tags yet — add your first one above.</p>
          ) : (
            tags.map((t) => <TagRow key={t.id} tag={t} count={tagCounts[t.id] || 0} onDelete={setPendingDelete} />)
          )}
        </div>
      </CardContent>

      <MarchConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete this tag?"
        description={pendingDelete ? `"${pendingDelete.name}" will be removed from every item that uses it.` : ''}
        confirmText="Delete"
        onConfirm={() => {
          if (pendingDelete) deleteTag.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </Card>
  );
};