import { ReactNode, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Dialog, ResizableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props<T> {
  items: T[];
  previewCount: number;
  renderList: (items: T[]) => ReactNode;
  label?: string;
}

/**
 * Shows only the first row of items with a blurred fade and a centered
 * "dots" button that opens a modal containing the full list.
 */
export function CollapsiblePreview<T>({ items, previewCount, renderList, label = 'items' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const hidden = items.length - previewCount;

  if (hidden <= 0) return <>{renderList(items)}</>;

  return (
    <div className="relative">
      {renderList(items.slice(0, previewCount))}

      <div className="pink-shimmer pointer-events-none absolute inset-x-0 bottom-0 z-10 isolate flex h-[clamp(6rem,22vh,16rem)] w-full items-end justify-center overflow-hidden rounded-b-2xl bg-gradient-to-t from-primary/50 via-primary/25 via-primary/5 to-primary/1 backdrop-blur-[4px] [box-shadow:inset_0_-4vh_60px_-12px_hsl(var(--primary)/0.25)] sm:h-[clamp(8rem,26vh,20rem)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Show all ${items.length} ${label}`}
          title={`Show all ${items.length} ${label}`}
          className="pointer-events-auto relative z-20 mb-[max(0.25rem,1vh)] inline-flex max-w-[90%] items-center gap-1 rounded-full border border-border bg-card px-[clamp(0.75rem,2vw,1.25rem)] py-1.5 text-[clamp(0.7rem,1.6vw,0.8rem)] font-medium text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground"
        >
          <MoreHorizontal size={16} />
          <span>+{hidden} more</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <ResizableDialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              All {label} ({items.length})
            </DialogTitle>
          </DialogHeader>
          <div data-modal-list className="overflow-y-auto pr-1">{renderList(items)}</div>
        </ResizableDialogContent>
      </Dialog>
    </div>
  );
}
