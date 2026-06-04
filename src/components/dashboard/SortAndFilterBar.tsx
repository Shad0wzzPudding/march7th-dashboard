import { useTags } from '@/hooks/useTags';
import { TagChip } from './TagPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/sounds';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'title_asc'
  | 'title_desc'
  | 'tag'
  | 'pinned_first'
  | 'completed_last'
  | 'user';

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

  const marchMessages = [
    "March 7th is on the case! Sorting by what's due soonest~ ❄️",
    "Leave it to me! March 7th has rearranged everything by deadline! ✨",
    "Don't worry, I got this! Putting the urgent stuff up top~ 🏹",
    "March 7th to the rescue! Soonest deadlines first, just for you! 💖",
    "Tada~! Sorted by deadline! You can thank me later~ 📸",
    "Ehehe~ March 7th magic! All your urgent stuff is now front and center! ✨",
    "Ice arrows locked on the deadlines! Sorted and ready, Trailblazer! 🏹❄️",
    "Smile~! March 7th took a snapshot and rearranged everything by deadline! 📷",
    "Astral Express express delivery! Soonest tasks coming through! 🚂💨",
    "Pom-Pom would be so proud~ Sorted by what's due first! 📦",
    "Trust me, I'm a memory expert! Deadlines first, no time to lose! 💫",
    "Hehe, leave the boring sorting to me! Earliest deadlines on top! 💝",
    "Boop! March 7th's deadline radar activated~ ❄️✨",
    "Yoink! Grabbed all your tasks and lined them up by deadline! 🎀",
    "Don't panic, Trailblazer! March 7th has your schedule under control~ 🌟",
  ];

  const requestHelp = () => {
    onSortChange('deadline_asc');
    playSuccessSound();
    const msg = marchMessages[Math.floor(Math.random() * marchMessages.length)];
    toast(msg);
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
          <SelectItem value="user">User sort (drag to arrange)</SelectItem>
          {showPinned && <SelectItem value="pinned_first">Pinned first</SelectItem>}
          {showCompleted && <SelectItem value="completed_last">Completed last</SelectItem>}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={requestHelp}
        className="h-8 px-2 text-xs gap-1 border-pink-300 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950"
      >
        <Sparkles size={12} />
        Request March 7th help
      </Button>

      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap flex-1 ml-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1.5 text-xs relative bg-white dark:bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-50 shadow-sm max-w-[260px]"
                title="Filter by tag"
                aria-label="Filter by tag"
              >
                {/* Polaroid-style icon */}
                <span className="relative inline-flex items-center justify-center w-5 h-6 bg-white border border-zinc-400 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] rotate-[-6deg]">
                  <ImageIcon size={10} className="text-pink-500" />
                </span>
                {filterTagIds.length === 0 ? (
                  <span>Filter</span>
                ) : (
                  (() => {
                    const selected = tags.filter((t) => filterTagIds.includes(t.id));
                    const first = selected[0];
                    const extra = selected.length - 1;
                    if (!first) return <span>Filter</span>;
                    return (
                      <span className="flex items-center gap-1 min-w-0">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border max-w-[140px] truncate"
                          style={{
                            background: `${first.color}22`,
                            borderColor: `${first.color}66`,
                            color: first.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: first.color }}
                          />
                          <span className="truncate">{first.name}</span>
                        </span>
                        {extra > 0 && (
                          <span className="inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                            +{extra}
                          </span>
                        )}
                      </span>
                    );
                  })()
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-2" align="start">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Filter by tag</p>
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
              <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto">
                {tags.map((t) => (
                  <TagChip
                    key={t.id}
                    tag={t}
                    onClick={() => toggleTag(t.id)}
                    active={filterTagIds.length === 0 ? undefined : filterTagIds.includes(t.id)}
                  />
                ))}
              </div>
              {filterTagIds.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">Tap a tag to filter. Tap again to remove.</p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export const sortItems = <T extends { created_at: string; title: string; deadline?: string; is_pinned?: boolean; is_completed?: boolean; tag_ids?: string[]; sort_order?: number }>(
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
    case 'user':
      return arr.sort((a, b) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return a.created_at.localeCompare(b.created_at);
      });
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