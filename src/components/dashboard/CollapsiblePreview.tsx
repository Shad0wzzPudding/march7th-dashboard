import { ReactNode, useState } from 'react';
import { MoreHorizontal, ChevronUp } from 'lucide-react';

interface Props<T> {
  items: T[];
  previewCount: number;
  renderList: (items: T[]) => ReactNode;
  label?: string;
}

/**
 * Shows only the first row of items with a blurred fade and a centered
 * "dots" button hinting that the rest can be revealed.
 */
export function CollapsiblePreview<T>({ items, previewCount, renderList, label = 'items' }: Props<T>) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - previewCount;

  if (hidden <= 0) return <>{renderList(items)}</>;

  return (
    <div className="relative">
      {renderList(expanded ? items : items.slice(0, previewCount))}

      {!expanded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 flex items-end justify-center rounded-b-lg bg-gradient-to-t from-background via-background/85 to-transparent backdrop-blur-[3px]">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={`Show all ${items.length} ${label}`}
            title={`Show all ${items.length} ${label}`}
            className="pointer-events-auto mb-1 inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground"
          >
            <MoreHorizontal size={16} />
            <span>+{hidden} more</span>
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:scale-105 hover:text-foreground"
          >
            <ChevronUp size={14} />
            <span>Show less</span>
          </button>
        </div>
      )}
    </div>
  );
}
