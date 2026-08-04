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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 flex items-end justify-center rounded-b-2xl bg-gradient-to-t from-primary/40 via-primary/20 to-transparent backdrop-blur-md [box-shadow:inset_0_-10px_30px_-10px_hsl(var(--primary)/0.3)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Show all ${items.length} ${label}`}
          title={`Show all ${items.length} ${label}`}
          className="pointer-events-auto mb-1 inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground"
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
