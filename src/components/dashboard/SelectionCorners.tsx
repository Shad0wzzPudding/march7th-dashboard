import { AnimatePresence, motion } from 'framer-motion';

interface SelectionCornersProps {
  visible: boolean;
}

export const SelectionCorners = ({ visible }: SelectionCornersProps) => {
  if (!visible) return null;

  return (
    <span className="absolute inset-0 border-2 border-dashed border-primary/60 rounded-lg pointer-events-none z-10" />
  );
};

/** Full-screen camera viewfinder overlay with pink tint + corner brackets + center crosshair */
export const SelectModeOverlay = ({ visible }: { visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-40 pointer-events-none"
        >
          {/* Stronger pink gradient tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5" />

          {/* Corner brackets */}
          <span className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-primary/80 rounded-tl-md" />
          <span className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary/80 rounded-tr-md" />
          <span className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-primary/80 rounded-bl-md" />
          <span className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-primary/80 rounded-br-md" />

          {/* Edge center ticks */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 w-8 border-t-2 border-primary/50" />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 border-b-2 border-primary/50" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 h-8 border-l-2 border-primary/50" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 h-8 border-r-2 border-primary/50" />

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/60" />
            <span className="absolute top-1 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/60" />
            <span className="absolute top-1/2 -left-4 -translate-y-1/2 h-px w-3 bg-primary/60" />
            <span className="absolute top-1/2 left-1 -translate-y-1/2 h-px w-3 bg-primary/60" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-primary/60" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
