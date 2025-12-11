import { useState, useRef } from "react";

interface DraggableSummaryItemProps {
  id: string;
  value: number;
  label: string;
  colorClass: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const DraggableSummaryItem = ({
  id,
  value,
  label,
  colorClass,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: DraggableSummaryItemProps) => {
  const [touchStartX, setTouchStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsTouchDragging(true);
    onDragStart(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDragging) return;
    const diff = e.touches[0].clientX - touchStartX;
    setCurrentX(diff);
    
    // Determine which item we're over
    const elements = document.querySelectorAll('[data-summary-item]');
    const touchX = e.touches[0].clientX;
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touchX >= rect.left && touchX <= rect.right) {
        onDragOver(i);
      }
    });
  };

  const handleTouchEnd = () => {
    setIsTouchDragging(false);
    setCurrentX(0);
    onDragEnd();
  };

  return (
    <div
      ref={itemRef}
      data-summary-item
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
      className={`text-center p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 select-none
        ${isDragging && dragOverIndex === index ? 'scale-105 ring-2 ring-blue-400' : ''}
        ${isTouchDragging ? 'opacity-80' : ''}
        bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80
      `}
      style={{
        transform: isTouchDragging ? `translateX(${currentX}px)` : undefined,
      }}
    >
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
      </div>
      <div className={`text-sm ${colorClass}`}>{label}</div>
    </div>
  );
};
