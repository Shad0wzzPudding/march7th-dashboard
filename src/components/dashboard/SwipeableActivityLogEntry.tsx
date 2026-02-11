import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Undo2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ActivityLog } from "@/lib/types";
import { playDeleteSound } from "@/lib/sounds";

interface SwipeableActivityLogEntryProps {
  log: ActivityLog;
  onDelete: (id: string) => void;
}

export const SwipeableActivityLogEntry = ({
  log,
  onDelete,
}: SwipeableActivityLogEntryProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const translateXRef = useRef(0);
  const startXRef = useRef(0);

  const SWIPE_THRESHOLD = 80;

  const updateTranslateX = (value: number) => {
    translateXRef.current = value;
    setTranslateX(value);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startXRef.current - e.touches[0].clientX;
    // Only allow left swipe (negative translateX)
    if (diff > 0) {
      updateTranslateX(Math.min(diff, 150));
    }
  };

  const handleTouchEnd = () => {
    if (translateXRef.current > SWIPE_THRESHOLD) {
      playDeleteSound();
      updateTranslateX(300);
      setIsDragging(false);
      setTimeout(() => onDelete(log.id), 200);
    } else {
      updateTranslateX(0);
      setIsDragging(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = startXRef.current - e.clientX;
    if (diff > 0) {
      updateTranslateX(Math.min(diff, 150));
    }
  };

  const handleMouseUp = () => {
    if (translateXRef.current > SWIPE_THRESHOLD) {
      playDeleteSound();
      updateTranslateX(300);
      setIsDragging(false);
      setTimeout(() => onDelete(log.id), 200);
    } else {
      updateTranslateX(0);
      setIsDragging(false);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      updateTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded">
      {/* Background action indicator - right side */}
      <div
        className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-end pr-4 rounded"
        style={{ opacity: Math.min(translateX / SWIPE_THRESHOLD, 1) }}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <Undo2 size={16} />
          <span>Remove</span>
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant={
              log.action_type === "created"
                ? "default"
                : log.action_type === "updated"
                ? "secondary"
                : "destructive"
            }
            className="text-xs"
          >
            {log.action_type}
          </Badge>
          <span className="text-sm font-medium">{log.item_title}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({log.item_type})
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(parseISO(log.created_at), "MMM dd, HH:mm")}
        </span>
      </div>
    </div>
  );
};
