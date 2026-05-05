import { useTags } from '@/hooks/useTags';
import { TagChip } from './TagPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, X } from 'lucide-react';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'title_asc'
  | 'title_desc'
  | 'tag'
  | 'pinned_first'
  | 'completed_last';

interface Props {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  filterTagIds: string[];
  onFilterChange: (ids: string[]) => void;
  showPinned?: boolean;
  showCompleted?: boolean;
}

export const SortAndFilterBar = ({
  sort,
  onSortChange,
  filterTagIds,
  onFilterChange,
  showPinned,
  showCompleted,
}: Props) => {
  const { tags } = useTags();

  const toggleTag = (id: string) => {
    if (filterTagIds.includes(id)) onFilterChange(filterTagIds.filter((x) => x !== id));
    else onFilterChange([...filterTagIds, id]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card/50">
      <ArrowUpDown size={14} className="text-muted-foreground" />
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">Newest first</SelectItem>
          <SelectItem value="created_asc">Oldest first</SelectItem>
          <SelectItem value="deadline_asc">Deadline (soonest)</SelectItem>
          <SelectItem value="deadline_desc">Deadline (latest)</SelectItem>
          <SelectItem value="title_asc">Title A–Z</SelectItem>
          <SelectItem value="title_desc">Title Z–A</SelectItem>
          <SelectItem value="tag">By tag</SelectItem>
          {showPinned && <SelectItem value="pinned_first">Pinned first</SelectItem>}
          {showCompleted && <SelectItem value="completed_last">Completed last</SelectItem>}
        </SelectContent>
      </Select>

      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap flex-1">
          <span className="text-xs text-muted-foreground ml-2">Filter:</span>
          {tags.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              onClick={() => toggleTag(t.id)}
              active={filterTagIds.length === 0 ? undefined : filterTagIds.includes(t.id)}
            />
          ))}
          {filterTagIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onFilterChange([])}
            >
              <X size={10} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const sortItems = <T extends { created_at: string; title: string; deadline?: string; is_pinned?: boolean; is_completed?: boolean; tag_ids?: string[] }>(
  items: T[],
  sort: SortOption,
  tagsById?: Record<string, { name: string }>
): T[] => {
  const arr = [...items];
  switch (sort) {
    case 'created_desc':
      return arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'created_asc':
      return arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case 'deadline_asc':
      return arr.sort((a, b) => (a.deadline || '\uffff').localeCompare(b.deadline || '\uffff'));
    case 'deadline_desc':
      return arr.sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
    case 'title_asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'title_desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    case 'tag':
      return arr.sort((a, b) => {
        const an = a.tag_ids?.[0] && tagsById?.[a.tag_ids[0]]?.name || '\uffff';
        const bn = b.tag_ids?.[0] && tagsById?.[b.tag_ids[0]]?.name || '\uffff';
        return an.localeCompare(bn);
      });
    case 'pinned_first':
      return arr.sort((a, b) => Number(!!b.is_pinned) - Number(!!a.is_pinned));
    case 'completed_last':
      return arr.sort((a, b) => Number(!!a.is_completed) - Number(!!b.is_completed));
    default:
      return arr;
  }
};

export const filterByTags = <T extends { tag_ids?: string[] }>(
  items: T[],
  tagIds: string[]
): T[] => {
  if (tagIds.length === 0) return items;
  return items.filter((i) => i.tag_ids?.some((id) => tagIds.includes(id)));
};