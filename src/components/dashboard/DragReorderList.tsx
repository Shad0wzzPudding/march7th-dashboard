import { useState, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface DragReorderListProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onReorder: (orderedIds: string[]) => void;
  className?: string;
}

export function DragReorderList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  className,
}: DragReorderListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next.map(getId));
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className={className ?? 'space-y-3'}>
      {items.map((item, idx) => (
        <div
          key={getId(item)}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(idx);
          }}
          onDragLeave={() => setOverIndex((o) => (o === idx ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(idx);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={`relative group transition-all ${
            dragIndex === idx ? 'opacity-50' : ''
          } ${overIndex === idx && dragIndex !== idx ? 'ring-2 ring-pink-300 rounded-lg' : ''}`}
        >
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 opacity-40 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground bg-background/80 rounded p-0.5 pointer-events-none">
            <GripVertical size={14} />
          </div>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}