import React, { Fragment } from 'react';
import { cloneElement, isValidElement } from 'react';

interface FormattedTextProps {
  children: string;
  className?: string;
}

/**
 * Renders text with **bold**, *italic*, and ~~strikethrough~~ support.
 */
export const FormattedText = ({ children, className }: FormattedTextProps) => {
  if (!children) return null;
  
  // Split by formatting patterns: **bold**, *italic*, ~~strike~~
  // Process in order: bold first, then italic, then strikethrough
  const renderFormatted = (text: string): React.ReactNode[] => {
    // Split by ~~...~~ 
    const parts = text.split(/(~~[\s\S]+?~~)/g);
    
    return parts.flatMap((part, i) => {
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        return [
          <span key={`s-${i}`} className="line-through opacity-60">
            {renderBoldItalic(part.slice(2, -2))}
          </span>
        ];
      }
      return renderBoldItalic(part).map((node, j) => {
        if (isValidElement(node)) return cloneElement(node, { key: `t-${i}-${j}` });
        return <span key={`t-${i}-${j}`}>{node}</span>;
      });
    });
  };

  const renderBoldItalic = (text: string): React.ReactNode[] => {
    // Bold **text**
    const parts = text.split(/(\*\*[^*]+?\*\*)/g);
    return parts.flatMap((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return [<strong key={`b-${i}`} className="font-bold">{renderItalic(part.slice(2, -2))}</strong>];
      }
      return renderItalic(part).map((node, j) => {
        if (isValidElement(node)) return cloneElement(node, { key: `bi-${i}-${j}` });
        return <span key={`bi-${i}-${j}`}>{node}</span>;
      });
    });
  };

  const renderItalic = (text: string): React.ReactNode[] => {
    // Italic *text* (not **)
    const parts = text.split(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g);
    const result: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        result.push(<em key={`i-${i}`} className="italic">{parts[i]}</em>);
      } else if (parts[i]) {
        result.push(parts[i]);
      }
    }
    return result;
  };

  return (
    <span className={className}>
      {renderFormatted(children)}
    </span>
  );
};
