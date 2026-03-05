import { useRef, useState, useCallback, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormattedText } from '@/components/ui/formatted-text';
import { Button } from '@/components/ui/button';
import { List, Strikethrough, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FormattedTextarea = ({ value, onChange, placeholder, className }: FormattedTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoBullet, setAutoBullet] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autoBullet || e.key !== 'Enter') return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const textBefore = value.slice(0, selectionStart);
    const textAfter = value.slice(selectionStart);

    // Find the current line
    const lastNewline = textBefore.lastIndexOf('\n');
    const currentLine = textBefore.slice(lastNewline + 1);

    // If current line is just a bullet (empty bullet), remove it instead
    if (currentLine.trim() === '•') {
      e.preventDefault();
      const newValue = textBefore.slice(0, lastNewline === -1 ? 0 : lastNewline) + '\n' + textAfter;
      onChange(newValue);
      setTimeout(() => {
        const pos = (lastNewline === -1 ? 0 : lastNewline) + 1;
        textarea.setSelectionRange(pos, pos);
      }, 0);
      return;
    }

    // Auto-bullet: add bullet to every new line when enabled
    e.preventDefault();
    const newValue = textBefore + '\n• ' + textAfter;
    onChange(newValue);
    setTimeout(() => {
      const pos = selectionStart + 3;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }, [autoBullet, value, onChange]);

  const insertBullet = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const textBefore = value.slice(0, selectionStart);
    const textAfter = value.slice(selectionStart);

    // Check if we're at start of line
    const lastNewline = textBefore.lastIndexOf('\n');
    const currentLineStart = lastNewline + 1;
    const currentLine = textBefore.slice(currentLineStart);

    let newValue: string;
    let cursorPos: number;

    if (currentLine.length === 0 || selectionStart === 0) {
      // Empty line or start - just add bullet
      newValue = textBefore + '• ' + textAfter;
      cursorPos = selectionStart + 2;
    } else {
      // Mid-line - add bullet on new line
      newValue = textBefore + '\n• ' + textAfter;
      cursorPos = selectionStart + 3;
    }

    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, [value, onChange]);

  const toggleStrikethrough = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);

    if (selectionStart === selectionEnd) return; // No selection

    let newValue: string;
    let newStart: number;
    let newEnd: number;

    // Check if already wrapped in ~~
    if (selectedText.startsWith('~~') && selectedText.endsWith('~~')) {
      // Remove strikethrough
      const unwrapped = selectedText.slice(2, -2);
      newValue = value.slice(0, selectionStart) + unwrapped + value.slice(selectionEnd);
      newStart = selectionStart;
      newEnd = selectionStart + unwrapped.length;
    } else {
      // Add strikethrough
      newValue = value.slice(0, selectionStart) + '~~' + selectedText + '~~' + value.slice(selectionEnd);
      newStart = selectionStart;
      newEnd = selectionEnd + 4;
    }

    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  }, [value, onChange]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={autoBullet ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoBullet(!autoBullet)}
          className="h-7 px-2 text-xs gap-1"
          title="Toggle auto-bullet on Enter"
        >
          <List size={14} />
          Auto •
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertBullet}
          className="h-7 px-2 text-xs"
          title="Insert bullet point"
        >
          • Add
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleStrikethrough}
          className="h-7 px-2 text-xs gap-1"
          title="Strikethrough selected text"
        >
          <Strikethrough size={14} />
        </Button>
        <Button
          type="button"
          variant={showPreview ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-7 px-2 text-xs gap-1 ml-auto"
          title="Toggle preview"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
        </Button>
      </div>
      {showPreview && value ? (
        <div
          className={cn("min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm whitespace-pre-wrap", className)}
          onClick={() => setShowPreview(false)}
        >
          <FormattedText>{value}</FormattedText>
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(className)}
        />
      )}
    </div>
  );
};
