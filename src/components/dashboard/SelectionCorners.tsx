import { AnimatePresence, motion } from 'framer-motion';

interface SelectionCornersProps {
  visible: boolean;
}

export const SelectionCorners = ({ visible }: SelectionCornersProps) => {
  if (!visible) return null;

  const cornerSize = "w-5 h-5";
  const base = "absolute pointer-events-none z-10 border-primary";

  return (
    <>
      <span className={`${base} ${cornerSize} top-0 left-0 border-t-2 border-l-2 rounded-tl-lg`} />
      <span className={`${base} ${cornerSize} top-0 right-0 border-t-2 border-r-2 rounded-tr-lg`} />
      <span className={`${base} ${cornerSize} bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg`} />
      <span className={`${base} ${cornerSize} bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg`} />
    </>
  );
};

/** Full-screen camera viewfinder overlay with pink tint + corner brackets */
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
          {/* Pink gradient tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />

          {/* Corner brackets */}
          {/* Top-left */}
          <span className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-primary/60 rounded-tl-md" />
          {/* Top-right */}
          <span className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary/60 rounded-tr-md" />
          {/* Bottom-left */}
          <span className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-primary/60 rounded-bl-md" />
          {/* Bottom-right */}
          <span className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-primary/60 rounded-br-md" />

          {/* Center crosshair ticks */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 w-8 border-t-2 border-primary/40" />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 border-b-2 border-primary/40" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 h-8 border-l-2 border-primary/40" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 h-8 border-r-2 border-primary/40" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
