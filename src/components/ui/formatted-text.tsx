import { Fragment } from 'react';

interface FormattedTextProps {
  children: string;
  className?: string;
}

/**
 * Renders text with ~~strikethrough~~ support.
 * Preserves whitespace via whitespace-pre-wrap on the container.
 */
export const FormattedText = ({ children, className }: FormattedTextProps) => {
  if (!children) return null;
  
  // Split by ~~...~~ pattern (supports multiline)
  const parts = children.split(/(~~[\s\S]+?~~)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
          return (
            <span key={i} className="line-through opacity-60">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
