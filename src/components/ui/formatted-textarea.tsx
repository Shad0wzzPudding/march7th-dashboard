import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { List, Strikethrough, Bold, Italic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Converts plain text with ~~strikethrough~~ markers into HTML.
 */
const toHTML = (text: string): string => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold **text** (must come before italic)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // Italic *text* (not **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
  // Strikethrough ~~text~~
  html = html.replace(/~~([\s\S]+?)~~/g, '<s class="line-through opacity-60">$1</s>');
  html = html.replace(/\n/g, '<br>');
  return html;
};

/**
 * Converts innerHTML back to plain text with ~~ markers.
 */
const toPlainText = (el: HTMLDivElement): string => {
  let text = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if (tag === 'br') {
        text += '\n';
      } else if (tag === 's') {
        text += '~~';
        node.childNodes.forEach(walk);
        text += '~~';
      } else if (tag === 'strong' || tag === 'b') {
        text += '**';
        node.childNodes.forEach(walk);
        text += '**';
      } else if (tag === 'em' || tag === 'i') {
        text += '*';
        node.childNodes.forEach(walk);
        text += '*';
      } else if (tag === 'div' || tag === 'p') {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        node.childNodes.forEach(walk);
      } else {
        node.childNodes.forEach(walk);
      }
    }
  };
  el.childNodes.forEach(walk);
  return text;
};

const toVisibleText = (text: string): string =>
  text.replace(/\*\*/g, '').replace(/(?<!\*)\*(?!\*)/g, '').replace(/~~/g, '');

/**
 * Save and restore cursor position in contentEditable.
 */
const saveCursor = (el: HTMLElement): number => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;

  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);

  const temp = document.createElement('div');
  temp.appendChild(preRange.cloneContents());
  return toVisibleText(toPlainText(temp)).length;
};

const setCaretAt = (sel: Selection, node: Node, offset: number) => {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const setCaretBeforeNode = (sel: Selection, node: Node) => {
  const range = document.createRange();
  range.setStartBefore(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const setCaretAfterNode = (sel: Selection, node: Node) => {
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
};

const restoreCursor = (el: HTMLElement, pos: number) => {
  const sel = window.getSelection();
  if (!sel) return;
  
  let currentPos = 0;
  let lastBreakNode: Node | null = null;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent || '').length;
      if (pos <= currentPos + len) {
        setCaretAt(sel, node, Math.max(0, pos - currentPos));
        return true;
      }
      currentPos += len;
      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'br') {
      lastBreakNode = node;
      if (pos === currentPos) {
        setCaretBeforeNode(sel, node);
        return true;
      }

      currentPos += 1;
      if (pos === currentPos) {
        setCaretAfterNode(sel, node);
        return true;
      }

      return false;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes)) {
        if (walk(child)) return true;
      }
    }

    return false;
  };
  
  if (walk(el)) return;

  if (pos === currentPos && lastBreakNode) {
    setCaretAfterNode(sel, lastBreakNode);
    return;
  }

  setCaretAt(sel, el, el.childNodes.length);
};

/**
 * Map a visible text offset to the corresponding offset in the raw marker string.
 */
const visibleToRaw = (raw: string, visiblePos: number, skipTrailingMarkers = true): number => {
  let vi = 0;
  let ri = 0;
  while (ri < raw.length && vi < visiblePos) {
    // Check for **
    if (raw[ri] === '*' && raw[ri + 1] === '*') {
      ri += 2;
      continue;
    }
    // Check for ~~ 
    if (raw[ri] === '~' && raw[ri + 1] === '~') {
      ri += 2;
      continue;
    }
    // Check for lone * (italic)
    if (raw[ri] === '*' && raw[ri - 1] !== '*' && raw[ri + 1] !== '*') {
      ri += 1;
      continue;
    }
    vi++;
    ri++;
  }
  // Only skip trailing markers for start positions, not end positions
  if (skipTrailingMarkers) {
    while (ri < raw.length) {
      if (raw[ri] === '*' && raw[ri + 1] === '*') { ri += 2; continue; }
      if (raw[ri] === '~' && raw[ri + 1] === '~') { ri += 2; continue; }
      if (raw[ri] === '*' && (ri === 0 || raw[ri - 1] !== '*') && (ri + 1 >= raw.length || raw[ri + 1] !== '*')) { ri += 1; continue; }
      break;
    }
  }
  return ri;
};

export const FormattedTextarea = ({ value, onChange, placeholder, className }: FormattedTextareaProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [autoBullet, setAutoBullet] = useState(false);
  const isUpdatingRef = useRef(false);

  // Sync external value changes into contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isUpdatingRef.current) return;
    
    const currentText = toPlainText(el);
    if (currentText !== value) {
      const pos = saveCursor(el);
      el.innerHTML = toHTML(value);
      restoreCursor(el, pos);
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    
    isUpdatingRef.current = true;
    const plainText = toPlainText(el);
    onChange(plainText);
    
    // Re-render with formatting after a tick
    requestAnimationFrame(() => {
      const pos = saveCursor(el);
      el.innerHTML = toHTML(plainText);
      restoreCursor(el, pos);
      isUpdatingRef.current = false;
    });
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      
      const el = editorRef.current;
      if (!el) return;
      
      // Split the DOM at cursor to get before/after text accurately
      const range = sel.getRangeAt(0);
      
      // Clone content before cursor
      const beforeRange = document.createRange();
      beforeRange.selectNodeContents(el);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const beforeFrag = beforeRange.cloneContents();
      const beforeDiv = document.createElement('div');
      beforeDiv.appendChild(beforeFrag);
      const textBefore = toPlainText(beforeDiv as HTMLDivElement);
      
      // Clone content after cursor
      const afterRange = document.createRange();
      afterRange.selectNodeContents(el);
      afterRange.setStart(range.startContainer, range.startOffset);
      const afterFrag = afterRange.cloneContents();
      const afterDiv = document.createElement('div');
      afterDiv.appendChild(afterFrag);
      const textAfter = toPlainText(afterDiv as HTMLDivElement);
      
      // Calculate visible position for cursor restore
       const visBeforeLen = toVisibleText(textBefore).length;
      
      if (autoBullet) {
        const lastNewline = textBefore.lastIndexOf('\n');
        const currentLine = textBefore.slice(lastNewline + 1);
        
        if (currentLine.trim() === '•') {
          // Remove empty bullet
          const newValue = textBefore.slice(0, lastNewline === -1 ? 0 : lastNewline) + '\n' + textAfter;
          onChange(newValue);
          isUpdatingRef.current = true;
           const newVisPos = toVisibleText(textBefore.slice(0, lastNewline === -1 ? 0 : lastNewline)).length + 1;
          requestAnimationFrame(() => {
            el.innerHTML = toHTML(newValue);
            el.focus();
            restoreCursor(el, newVisPos);
            isUpdatingRef.current = false;
          });
          return;
        }
        
        const newValue = textBefore + '\n• ' + textAfter;
        onChange(newValue);
        isUpdatingRef.current = true;
        requestAnimationFrame(() => {
          el.innerHTML = toHTML(newValue);
          el.focus();
          restoreCursor(el, visBeforeLen + 3);
          isUpdatingRef.current = false;
        });
        return;
      }
      
      // Normal enter
      const newValue = textBefore + '\n' + textAfter;
      onChange(newValue);
      isUpdatingRef.current = true;
      requestAnimationFrame(() => {
        el.innerHTML = toHTML(newValue);
        el.focus();
        restoreCursor(el, visBeforeLen + 1);
        isUpdatingRef.current = false;
      });
    }
  }, [autoBullet, onChange]);

  const insertBullet = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    
    const visCursorPos = saveCursor(el);
    const cursorPos = visibleToRaw(value, visCursorPos);
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    
    const lastNewline = textBefore.lastIndexOf('\n');
    const currentLine = textBefore.slice(lastNewline + 1);
    
    let newValue: string;
    let newPos: number;
    
    if (currentLine.length === 0 || cursorPos === 0) {
      newValue = textBefore + '• ' + textAfter;
      newPos = visCursorPos + 2;
    } else {
      newValue = textBefore + '\n• ' + textAfter;
      newPos = visCursorPos + 3;
    }
    
    onChange(newValue);
    isUpdatingRef.current = true;
    requestAnimationFrame(() => {
      el.innerHTML = toHTML(newValue);
      restoreCursor(el, newPos);
      el.focus();
      isUpdatingRef.current = false;
    });
  }, [value, onChange]);

  const restoreSelection = useCallback((el: HTMLElement, visStart: number, visEnd: number) => {
    const sel = window.getSelection();
    if (!sel) return;
    
    // First set cursor at start
    restoreCursor(el, visStart);
    if (visStart === visEnd) return;
    
    // Extend selection to end
    const startRange = sel.getRangeAt(0);
    const startNode = startRange.startContainer;
    const startOffset = startRange.startOffset;
    
    // Set cursor at end to find that position
    restoreCursor(el, visEnd);
    const endRange = sel.getRangeAt(0);
    const endNode = endRange.startContainer;
    const endOffset = endRange.startOffset;
    
    // Create selection from start to end
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const applyFormatToggle = useCallback((marker: string) => {
    const el = editorRef.current;
    if (!el) return;
    
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    
    const selectedText = sel.toString();
    const visStart = saveCursor(el);
    const visEnd = visStart + selectedText.length;
    const mLen = marker.length;
    
    // Get the visible text (no markers) to work with
    // Instead of complex mapping, find the selected content in raw value
    // by stripping markers from the selected portion
    const rawStart = visibleToRaw(value, visStart);
    const rawEnd = visibleToRaw(value, visEnd, false);
    
    const before = value.slice(0, rawStart);
    const selected = value.slice(rawStart, rawEnd);
    const after = value.slice(rawEnd);
    
    let newValue: string;
    let newVisEnd: number;
    
    // Check if already wrapped - markers just outside selection
    const wrappedOutside = before.endsWith(marker) && after.startsWith(marker);
    // Check if already wrapped - markers inside selection
    const wrappedInside = selected.startsWith(marker) && selected.endsWith(marker) && selected.length > mLen * 2;
    
    if (wrappedOutside) {
      newValue = before.slice(0, -mLen) + selected + after.slice(mLen);
      newVisEnd = visEnd;
    } else if (wrappedInside) {
      newValue = before + selected.slice(mLen, -mLen) + after;
      newVisEnd = visEnd;
    } else {
      newValue = before + marker + selected + marker + after;
      newVisEnd = visEnd;
    }
    
    onChange(newValue);
    isUpdatingRef.current = true;
    requestAnimationFrame(() => {
      el.innerHTML = toHTML(newValue);
      restoreSelection(el, visStart, newVisEnd);
      el.focus();
      isUpdatingRef.current = false;
    });
  }, [value, onChange, restoreSelection]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const el = editorRef.current;
    if (!el) return;
    
    const visCursorPos = saveCursor(el);
    const rawCursorPos = visibleToRaw(value, visCursorPos);
    const newValue = value.slice(0, rawCursorPos) + text + value.slice(rawCursorPos);
    const newPos = visCursorPos + text.length;
    
    onChange(newValue);
    isUpdatingRef.current = true;
    requestAnimationFrame(() => {
      el.innerHTML = toHTML(newValue);
      restoreCursor(el, newPos);
      isUpdatingRef.current = false;
    });
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
          onClick={() => applyFormatToggle('~~')}
          className="h-7 px-2 text-xs gap-1"
          title="Strikethrough selected text"
        >
          <Strikethrough size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('**')}
          className="h-7 px-2 text-xs gap-1"
          title="Bold selected text"
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('*')}
          className="h-7 px-2 text-xs gap-1"
          title="Italic selected text"
        >
          <Italic size={14} />
        </Button>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "whitespace-pre-wrap break-words",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            className
          )}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};
