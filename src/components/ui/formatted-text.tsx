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
  // Split by ~~...~~ pattern
  const parts = children.split(/(~~.+?~~)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return (
            <span key={i} className="line-through opacity-60">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
};
