import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { FormattedText } from '@/components/ui/formatted-text';
import { Interest } from "@/lib/types";
import { playUnpinSound } from "@/lib/sounds";

interface SwipeableInterestCardProps {
  interest: Interest;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onUnpin: (interest: Interest) => void;
}

export const SwipeableInterestCard = ({
  interest,
  isCollapsed,
  onToggleCollapse,
  onUnpin,
}: SwipeableInterestCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const translateXRef = useRef(0);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;

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
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Only allow right swipe (positive diff)
    if (diff > 0) {
      updateTranslateX(Math.min(diff, 150));
    }
  };

  const handleTouchEnd = () => {
    // Check ref for immediate value (React state may be stale)
    if (translateXRef.current > SWIPE_THRESHOLD) {
      // Play sound FIRST, before any state updates (per iOS audio requirements)
      playUnpinSound();
      updateTranslateX(300);
      setIsDragging(false);
      setTimeout(() => {
        onUnpin(interest);
      }, 200);
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
    const diff = e.clientX - startXRef.current;
    if (diff > 0) {
      updateTranslateX(Math.min(diff, 150));
    }
  };

  const handleMouseUp = () => {
    // Check ref for immediate value (React state may be stale)
    if (translateXRef.current > SWIPE_THRESHOLD) {
      // Play sound FIRST, before any state updates
      playUnpinSound();
      updateTranslateX(300);
      setIsDragging(false);
      setTimeout(() => {
        onUnpin(interest);
      }, 200);
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
    <div className="relative overflow-hidden rounded-lg">
      {/* Background action indicator */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 flex items-center pl-4 rounded-lg"
        style={{ opacity: Math.min(translateX / SWIPE_THRESHOLD, 1) }}
      >
        <div className="flex items-center gap-2 text-white font-medium">
          <X size={20} />
          <span>Unpin</span>
        </div>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative bg-card/80 border border-main-focus/30 rounded-lg transition-transform cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Collapsible open={!isCollapsed}>
          <div className="p-3">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                {interest.title}
              </h4>
              {interest.description && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollapse(interest.id);
                    }}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    {isCollapsed ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronUp size={16} />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>

            <CollapsibleContent>
              {interest.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                  <FormattedText>{interest.description}</FormattedText>
                </p>
              )}
            </CollapsibleContent>

            {interest.deadline && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock size={12} />
                {format(parseISO(interest.deadline), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
