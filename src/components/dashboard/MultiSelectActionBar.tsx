import { Button } from '@/components/ui/button';
import { Copy, Trash2, Pin, PinOff, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiSelectActionBarProps {
  selectedCount: number;
  onCopy: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onCancel: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

export const MultiSelectActionBar = ({
  selectedCount,
  onCopy,
  onDelete,
  onUnpin,
  onCancel,
  onSelectAll,
  totalCount,
}: MultiSelectActionBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {selectedCount} selected
          </span>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onSelectAll}
            className="text-xs"
            disabled={selectedCount === totalCount}
          >
            <CheckSquare size={14} className="mr-1" />
            All
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            className="text-xs"
          >
            <Copy size={14} className="mr-1" />
            Copy
          </Button>

          {onUnpin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUnpin}
              className="text-xs text-orange-500 hover:text-orange-600"
            >
              <PinOff size={14} className="mr-1" />
              Unpin
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="text-xs"
          >
            <X size={14} className="mr-1" />
            Cancel
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
