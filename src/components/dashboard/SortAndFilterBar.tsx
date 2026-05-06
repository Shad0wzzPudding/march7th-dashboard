import { useTags } from '@/hooks/useTags';
import { TagChip } from './TagPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/sounds';
import march7thExcited from '@/assets/march7th-excited.png';
import march7thHappy from '@/assets/march7th-happy.png';
import march7thWinking from '@/assets/march7th-winking.png';
import march7thProud from '@/assets/march7th-proud.png';
import march7thConfident from '@/assets/march7th-confident.png';
import march7thWelcoming from '@/assets/march7th-welcoming.png';
import march7thCandy from '@/assets/march7th-candy.png';
import march7thThumbsup from '@/assets/march7th-thumbsup.png';
import march7thClipboard from '@/assets/march7th-clipboard.png';
import march7thSalute from '@/assets/march7th-salute.png';
import march7thPeace from '@/assets/march7th-peace.png';

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

  const marchVariants: { msg: string; sticker: string }[] = [
    { msg: "March 7th is on the case! Sorting by what's due soonest~ ❄️", sticker: march7thExcited },
    { msg: "Leave it to me! Everything's sorted by deadline now! ✨", sticker: march7thProud },
    { msg: "Don't worry, I got this! Urgent stuff up top~ 🏹", sticker: march7thConfident },
    { msg: "March 7th to the rescue! Soonest deadlines first! 💖", sticker: march7thSalute },
    { msg: "Tada~! Sorted by deadline! You can thank me later~ 📸", sticker: march7thWinking },
    { msg: "Aha! Found the most urgent ones — handled! ⚡", sticker: march7thHappy },
    { msg: "Heehee, organizing your life is my specialty! 📋", sticker: march7thClipboard },
    { msg: "Easy peasy! All deadlines lined up and ready! 👍", sticker: march7thThumbsup },
    { msg: "Trailblazer~ I prioritized everything for you! ✌️", sticker: march7thPeace },
    { msg: "Welcome to a perfectly sorted list! 🌸", sticker: march7thWelcoming },
    { msg: "Sweet sweet organization, just for you~ 🍭", sticker: march7thCandy },
  ];

  const requestHelp = () => {
    onSortChange('deadline_asc');
    playSuccessSound();
    const v = marchVariants[Math.floor(Math.random() * marchVariants.length)];
    toast(v.msg, {
      icon: (
        <img
          src={v.sticker}
          alt="March 7th"
          className="w-10 h-10 object-contain"
          loading="lazy"
        />
      ),
      duration: 4000,
    });
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