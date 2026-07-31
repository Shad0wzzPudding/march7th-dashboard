import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, ChevronDown, ChevronUp, X, GripVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Interest } from "@/lib/types";
import { playUnpinSound } from "@/lib/sounds";
import { FormattedText } from '@/components/ui/formatted-text';

interface DraggableInterestCardProps {
  interest: Interest;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onUnpin: (interest: Interest) => void;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const DraggableInterestCard = ({
  interest,
  isCollapsed,
  onToggleCollapse,
  onUnpin,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableInterestCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isHorizontalDragging, setIsHorizontalDragging] = useState(false);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const translateXRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 60; // Lowered for easier triggering

  const updateTranslateX = (value: number) => {
    translateXRef.current = value;
    setTranslateX(value);
  };

  // Horizontal swipe for unpin (on card content)
  const handleTouchStart = (e: React.TouchEvent) => {
    // If touching the drag handle, don't start horizontal swipe
    if (dragHandleRef.current?.contains(e.target as Node)) return;
    
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragHandleRef.current?.contains(e.target as Node)) return;
    if (isVerticalDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = Math.abs(currentY - startYRef.current);
    
    // If vertical movement is greater, don't swipe horizontally
    if (diffY > Math.abs(diffX) && !isHorizontalDragging) return;
    
    // Only allow right swipe (positive diff)
    if (diffX > 10) {
      setIsHorizontalDragging(true);
      updateTranslateX(Math.min(diffX, 150));
    }
  };

  const handleTouchEnd = () => {
    const currentX = translateXRef.current;
    const wasDragging = isHorizontalDragging;
    console.log('[DraggableInterestCard] TouchEnd - translateX:', currentX, 'threshold:', SWIPE_THRESHOLD, 'wasDragging:', wasDragging);
    
    if (currentX > SWIPE_THRESHOLD) {
      console.log('[DraggableInterestCard] Threshold exceeded, playing sound');
      // Play sound immediately in touch handler
      playUnpinSound();
      updateTranslateX(300);
      setIsHorizontalDragging(false);
      setTimeout(() => {
        onUnpin(interest);
      }, 200);
    } else {
      updateTranslateX(0);
      setIsHorizontalDragging(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragHandleRef.current?.contains(e.target as Node)) return;
    
    startXRef.current = e.clientX;
    setIsHorizontalDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHorizontalDragging) return;
    if (dragHandleRef.current?.contains(e.target as Node)) return;
    
    const diff = e.clientX - startXRef.current;
    if (diff > 0) {
      updateTranslateX(Math.min(diff, 150));
    }
  };

  const handleMouseUp = () => {
    // Check ref for immediate value (React state may be stale)
    if (isHorizontalDragging && translateXRef.current > SWIPE_THRESHOLD) {
      // Play sound FIRST, before any state updates
      console.log('[DraggableInterestCard] Mouse swipe threshold reached, playing unpin sound');
      playUnpinSound();
      updateTranslateX(300);
      setIsHorizontalDragging(false);
      setTimeout(() => {
        onUnpin(interest);
      }, 200);
    } else {
      updateTranslateX(0);
      setIsHorizontalDragging(false);
    }
  };

  const handleMouseLeave = () => {
    if (isHorizontalDragging) {
      setIsHorizontalDragging(false);
      updateTranslateX(0);
    }
  };

  // Vertical drag for reordering (on drag handle)
  const handleDragHandleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsVerticalDragging(true);
    onDragStart(index);
  };

  const handleDragHandleTouchMove = (e: React.TouchEvent) => {
    if (!isVerticalDragging) return;
    
    const touchY = e.touches[0].clientY;
    const elements = document.querySelectorAll('[data-interest-item]');
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        onDragOver(i);
      }
    });
  };

  const handleDragHandleTouchEnd = () => {
    setIsVerticalDragging(false);
    onDragEnd();
  };

  return (
    <div 
      data-interest-item
      className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
        isDragging && dragOverIndex === index ? 'ring-2 ring-sky-400 scale-[1.02]' : ''
      } ${isVerticalDragging ? 'opacity-70 scale-[0.98]' : ''}`}
    >
      {/* Background action indicator for unpin */}
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
        className="relative bg-card/80 border border-main-focus/30 rounded-lg transition-transform select-text"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isHorizontalDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(index);
        }}
        onDragEnd={onDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Collapsible open={!isCollapsed}>
          <div className="p-3 flex items-start gap-2">
            {/* Drag handle */}
            <div
              ref={dragHandleRef}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
              onTouchStart={handleDragHandleTouchStart}
              onTouchMove={handleDragHandleTouchMove}
              onTouchEnd={handleDragHandleTouchEnd}
            >
              <GripVertical size={18} />
            </div>
            
            <div className="flex-1 min-w-0">
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
          </div>
        </Collapsible>
      </div>
    </div>
  );
};
