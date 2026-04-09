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
  // Bold+Italic ***text*** (must come before bold and italic)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>');
  // Bold **text** (must come before italic)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // Italic *text* (not **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
  // Strikethrough ~~text~~
  html = html.replace(/~~([\s\S]+?)~~/g, '<s class="line-through opacity-60">$1</s>');
  html = html.replace(/\n/g, '<br>');
  // Trailing <br> is invisible in contentEditable; add an extra one so the cursor can land there
  if (html.endsWith('<br>')) {
    html += '<br>';
  }
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
  text.replace(/\*+/g, '').replace(/~~/g, '');

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

const getVisibleOffset = (el: HTMLElement, container: Node, offset: number): number => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(container, offset);

  const temp = document.createElement('div');
  temp.appendChild(range.cloneContents());
  return toVisibleText(toPlainText(temp)).length;
};

const getSelectionVisibleRange = (el: HTMLElement): { start: number; end: number } | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  return {
    start: getVisibleOffset(el, range.startContainer, range.startOffset),
    end: getVisibleOffset(el, range.endContainer, range.endOffset),
  };
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

const placeCursorAfterNthBr = (el: HTMLElement, n: number) => {
  const sel = window.getSelection();
  if (!sel) return;
  let count = 0;
  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'br') {
      count++;
      if (count === n) {
        setCaretAfterNode(sel, node);
        return true;
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of Array.from(node.childNodes)) {
        if (walk(child)) return true;
      }
    }
    return false;
  };
  if (!walk(el)) {
    setCaretAt(sel, el, el.childNodes.length);
  }
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
    // Skip any consecutive * markers (*, **, ***)
    if (raw[ri] === '*') {
      let j = ri;
      while (j < raw.length && raw[j] === '*') j++;
      ri = j;
      continue;
    }
    // Check for ~~
    if (raw[ri] === '~' && raw[ri + 1] === '~') {
      ri += 2;
      continue;
    }
    vi++;
    ri++;
  }
  // Only skip trailing markers for start positions, not end positions
  if (skipTrailingMarkers) {
    while (ri < raw.length) {
      if (raw[ri] === '*') {
        let j = ri;
        while (j < raw.length && raw[j] === '*') j++;
        ri = j;
        continue;
      }
      if (raw[ri] === '~' && raw[ri + 1] === '~') { ri += 2; continue; }
      break;
    }
  }
  return ri;
};

const countEdgeStars = (text: string, side: 'start' | 'end'): number => {
  let count = 0;
  if (side === 'start') {
    for (let i = 0; i < text.length && text[i] === '*'; i++) count++;
  } else {
    for (let i = text.length - 1; i >= 0 && text[i] === '*'; i--) count++;
  }
  return count;
};

/**
 * Check if text has a specific format applied, distinguishing * from **.
 * italic (*): present when edge star count is odd (1, 3)
 * bold (**): present when edge star count >= 2
 */
const hasSpecificFormat = (text: string, marker: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  if (marker === '~~') {
    return trimmed.startsWith('~~') && trimmed.endsWith('~~') && trimmed.length > 4;
  }
  
  const leading = countEdgeStars(trimmed, 'start');
  const trailing = countEdgeStars(trimmed, 'end');
  const minStars = Math.min(leading, trailing);
  if (trimmed.length <= minStars * 2) return false;
  
  if (marker === '**') return minStars >= 2;
  if (marker === '*') return minStars % 2 === 1;
  return false;
};

const toggleStarMarkerOnText = (text: string, markerLength: number): string => {
  const leadingWhitespace = text.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = text.match(/\s*$/)?.[0] ?? '';
  const core = text.slice(leadingWhitespace.length, text.length - trailingWhitespace.length);

  if (!core) return text;

  const leadingStars = countEdgeStars(core, 'start');
  const trailingStars = countEdgeStars(core, 'end');
  const surroundingStars = Math.min(leadingStars, trailingStars);
  const unwrappedCore = core.slice(leadingStars, core.length - trailingStars);

  const isActive = markerLength === 1
    ? surroundingStars % 2 === 1
    : surroundingStars >= 2;

  const nextStarCount = markerLength === 1
    ? Math.max(0, surroundingStars + (isActive ? -1 : 1))
    : Math.max(0, surroundingStars + (isActive ? -2 : 2));

  return `${leadingWhitespace}${'*'.repeat(nextStarCount)}${unwrappedCore}${'*'.repeat(nextStarCount)}${trailingWhitespace}`;
};

const toggleStarMarkerAroundSelection = (
  before: string,
  selected: string,
  after: string,
  markerLength: number,
): string => {
  const leadingStars = countEdgeStars(before, 'end');
  const trailingStars = countEdgeStars(after, 'start');
  const surroundingStars = Math.min(leadingStars, trailingStars);

  const isActive = markerLength === 1
    ? surroundingStars % 2 === 1
    : surroundingStars >= 2;

  const nextStarCount = markerLength === 1
    ? Math.max(0, surroundingStars + (isActive ? -1 : 1))
    : Math.max(0, surroundingStars + (isActive ? -2 : 2));

  return `${before.slice(0, before.length - leadingStars)}${'*'.repeat(nextStarCount)}${selected}${'*'.repeat(nextStarCount)}${after.slice(trailingStars)}`;
};

const expandRawRangeForLineMarkers = (raw: string, start: number, end: number, marker: string) => {
  const markerLength = marker.length;
  let nextStart = start;
  let nextEnd = end;

  const hasLeadingMarker = nextStart >= markerLength && raw.slice(nextStart - markerLength, nextStart) === marker;
  const leadingBoundaryIndex = nextStart - markerLength - 1;

  if (hasLeadingMarker && (leadingBoundaryIndex < 0 || raw[leadingBoundaryIndex] === '\n')) {
    nextStart -= markerLength;
  }

  const hasTrailingMarker = raw.slice(nextEnd, nextEnd + markerLength) === marker;
  const trailingBoundaryIndex = nextEnd + markerLength;

  if (hasTrailingMarker && (trailingBoundaryIndex >= raw.length || raw[trailingBoundaryIndex] === '\n')) {
    nextEnd += markerLength;
  }

  return { start: nextStart, end: nextEnd };
};

export const FormattedTextarea = ({ value, onChange, placeholder, className }: FormattedTextareaProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [autoBullet, setAutoBullet] = useState(false);
  const isUpdatingRef = useRef(false);
  const applyFormatToggleRef = useRef<(marker: string) => void>(() => {});
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
    const pos = saveCursor(el);
    onChange(plainText);
    
    // Re-render with formatting after a tick
    requestAnimationFrame(() => {
      el.innerHTML = toHTML(plainText);
      restoreCursor(el, pos);
      isUpdatingRef.current = false;
    });
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keyboard shortcuts for formatting
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'b') {
      e.preventDefault();
      applyFormatToggleRef.current('**');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'i') {
      e.preventDefault();
      applyFormatToggleRef.current('*');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      applyFormatToggleRef.current('~~');
      return;
    }

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
      
      // Count newlines in textBefore to find cursor target
      const newlineCount = (textBefore.match(/\n/g) || []).length;
      
      if (autoBullet) {
        const lastNewline = textBefore.lastIndexOf('\n');
        const currentLine = textBefore.slice(lastNewline + 1);
        
        if (currentLine.trim() === '•') {
          // Remove empty bullet
          const newValue = textBefore.slice(0, lastNewline === -1 ? 0 : lastNewline) + '\n' + textAfter;
          onChange(newValue);
          isUpdatingRef.current = true;
          requestAnimationFrame(() => {
            el.innerHTML = toHTML(newValue);
            el.focus();
            placeCursorAfterNthBr(el, newlineCount);
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
          placeCursorAfterNthBr(el, newlineCount + 1);
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
        placeCursorAfterNthBr(el, newlineCount + 1);
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

    const visibleRange = getSelectionVisibleRange(el);
    if (!visibleRange || visibleRange.start === visibleRange.end) return;

    const visStart = visibleRange.start;
    const visEnd = visibleRange.end;
    const mLen = marker.length;
    
    const initialRawStart = visibleToRaw(value, visStart);
    const initialRawEnd = visibleToRaw(value, visEnd, false);
    let rawStart = initialRawStart;
    let rawEnd = initialRawEnd;
    const isMultiLineSelection = value.slice(initialRawStart, initialRawEnd).includes('\n');
    
    if (isMultiLineSelection) {
      // Expand to full line boundaries so we don't cut through existing markers
      while (rawStart > 0 && value[rawStart - 1] !== '\n') rawStart--;
      // Only expand rawEnd if we're not already at a line boundary
      if (rawEnd > 0 && value[rawEnd - 1] !== '\n') {
        while (rawEnd < value.length && value[rawEnd] !== '\n') rawEnd++;
      }
    } else if (marker === '~~') {
      const expanded = expandRawRangeForLineMarkers(value, initialRawStart, initialRawEnd, marker);
      rawStart = expanded.start;
      rawEnd = expanded.end;
    }
    
    const before = value.slice(0, rawStart);
    const selected = value.slice(rawStart, rawEnd);
    const after = value.slice(rawEnd);
    
    let newValue: string;
    let newVisEnd: number;

    if (marker === '*' || marker === '**') {
      if (isMultiLineSelection) {
        const formattedLines = selected.split('\n').map((line) => {
          if (!line.trim()) return line;
          return toggleStarMarkerOnText(line, mLen);
        });

        newValue = before + formattedLines.join('\n') + after;
      } else {
        newValue = toggleStarMarkerAroundSelection(before, selected, after, mLen);
      }
      newVisEnd = visEnd;
    } else {
      const wrappedOutside = hasSpecificFormat(marker + selected + marker, marker) && before.endsWith(marker) && after.startsWith(marker);
      const wrappedInside = hasSpecificFormat(selected, marker);

      if (wrappedOutside) {
        newValue = before.slice(0, -mLen) + selected + after.slice(mLen);
        newVisEnd = visEnd;
      } else if (wrappedInside) {
        newValue = before + selected.slice(mLen, -mLen) + after;
        newVisEnd = visEnd;
      } else {
        // Apply formatting per-line so multi-line selections work correctly
        const lines = selected.split('\n');
        
        const toggleLine = (line: string) => {
          if (!line.trim()) return line;

          if (hasSpecificFormat(line, marker)) {
            // Remove exactly mLen stars from each side
            return line.slice(mLen, -mLen);
          }

          return marker + line + marker;
        };

        if (lines.length > 1) {
          const formattedLines = lines.map(toggleLine);
          newValue = before + formattedLines.join('\n') + after;
        } else {
          newValue = before + marker + selected + marker + after;
        }
        newVisEnd = visEnd;
      }
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

  applyFormatToggleRef.current = applyFormatToggle;

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
      <div className="flex items-center gap-1 flex-wrap">
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
          title="Strikethrough: ~~text~~"
        >
          <Strikethrough size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('**')}
          className="h-7 px-2 text-xs gap-1"
          title="Bold: **text**"
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => applyFormatToggle('*')}
          className="h-7 px-2 text-xs gap-1"
          title="Italic: *text*"
        >
          <Italic size={14} />
        </Button>
        <span className="text-[10px] text-muted-foreground ml-1">
          *italic* · **bold** · ~~strike~~
        </span>
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
