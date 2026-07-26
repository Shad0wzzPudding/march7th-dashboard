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
  // Protect escaped markers (\* and \~) so they render literally and are
  // ignored by the markdown regex below. User-typed markers are escaped in
  // toPlainText; only button-applied markers stay unescaped.
  const ESC_STAR = '\u0001';
  const ESC_TILDE = '\u0002';
  html = html.replace(/\\\*/g, ESC_STAR).replace(/\\~/g, ESC_TILDE);
  // Bold+Italic ***text*** (must come before bold and italic)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>');
  // Bold **text** (must come before italic)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  // Italic *text* (not **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
  // Strikethrough ~~text~~
  html = html.replace(/~~([\s\S]+?)~~/g, '<s class="line-through opacity-60">$1</s>');
  // Restore escaped markers as literal characters.
  html = html.split(ESC_STAR).join('*').split(ESC_TILDE).join('~');
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
const toPlainText = (el: HTMLDivElement, stripTrailingNewline = true): string => {
  let text = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Escape any literal `*` or `~` typed by the user so they don't get
      // re-interpreted as markdown markers on the next render. Markers that
      // originate from toolbar buttons live inside <strong>/<em>/<s> tags
      // and are re-emitted unescaped by the element branches below.
      text += (node.textContent || '').replace(/[*~]/g, '\\$&');
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if (tag === 'br') {
        text += '\n';
      } else if (tag === 's') {
        const before = text.length;
        const start = text.length;
        text += '~~';
        node.childNodes.forEach(walk);
        // Skip emitting empty markers (e.g. an empty <s> the browser left
        // behind after pressing Enter inside a strikethrough run), which
        // would otherwise show as literal `~~~~` on the new line.
        if (text.length === start + 2) {
          text = text.slice(0, before);
        } else {
          text += '~~';
        }
      } else if (tag === 'strong' || tag === 'b') {
        const before = text.length;
        const start = text.length;
        text += '**';
        node.childNodes.forEach(walk);
        if (text.length === start + 2) {
          text = text.slice(0, before);
        } else {
          text += '**';
        }
      } else if (tag === 'em' || tag === 'i') {
        const before = text.length;
        const start = text.length;
        text += '*';
        node.childNodes.forEach(walk);
        if (text.length === start + 1) {
          text = text.slice(0, before);
        } else {
          text += '*';
        }
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
  // Strip a single trailing newline that comes from the cursor-visibility <br>
  // appended in toHTML; otherwise deletes accumulate phantom blank lines.
  // Skip this when measuring cursor position, otherwise a caret sitting on an
  // empty trailing line collapses back to the end of the previous line.
  if (stripTrailingNewline && text.endsWith('\n')) text = text.slice(0, -1);
  return text;
};

const toVisibleText = (text: string): string =>
  text.replace(/\*+/g, '').replace(/~~/g, '');

/**
 * Count caret position as the number of characters/<br>s in the rendered DOM
 * up to the caret. This mirrors restoreCursor's traversal so save→restore is
 * symmetric regardless of whether markdown markers are matched (and thus
 * hidden inside <em>/<strong>/<s>) or unmatched (and rendered as literal `*`).
 */
const measureDomOffset = (root: Node): number => {
  let count = 0;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      count += (node.textContent || '').length;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if (tag === 'br') {
        count += 1;
      } else {
        node.childNodes.forEach(walk);
      }
    }
  };
  root.childNodes.forEach(walk);
  return count;
};

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
  return measureDomOffset(temp);
};

const getVisibleOffset = (el: HTMLElement, container: Node, offset: number): number => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(container, offset);

  const temp = document.createElement('div');
  temp.appendChild(range.cloneContents());
  return measureDomOffset(temp);
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
    // Escaped marker: `\*` or `\~` counts as a single visible character.
    if (raw[ri] === '\\' && (raw[ri + 1] === '*' || raw[ri + 1] === '~')) {
      ri += 2;
      vi += 1;
      continue;
    }
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
      if (raw[ri] === '\\' && (raw[ri + 1] === '*' || raw[ri + 1] === '~')) break;
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
    for (let i = text.length - 1; i >= 0 && text[i] === '*'; i--) {
      // An escaped star (preceded by `\`) is a literal character, not a marker.
      if (i > 0 && text[i - 1] === '\\') break;
      count++;
    }
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

  // Undo/redo history: stack of {value, cursor} snapshots.
  const historyRef = useRef<{ value: string; cursor: number }[]>([{ value, cursor: 0 }]);
  const historyIndexRef = useRef(0);
  const pendingSnapshotTimerRef = useRef<number | null>(null);

  const commitSnapshot = useCallback((val: string, cursor: number) => {
    const stack = historyRef.current;
    const idx = historyIndexRef.current;
    const cur = stack[idx];
    if (cur && cur.value === val) {
      cur.cursor = cursor;
      return;
    }
    const truncated = stack.slice(0, idx + 1);
    truncated.push({ value: val, cursor });
    if (truncated.length > 200) truncated.shift();
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
  }, []);

  const flushPendingSnapshot = useCallback(() => {
    if (pendingSnapshotTimerRef.current != null) {
      clearTimeout(pendingSnapshotTimerRef.current);
      pendingSnapshotTimerRef.current = null;
    }
  }, []);

  const scheduleTypingSnapshot = useCallback((val: string, cursor: number) => {
    flushPendingSnapshot();
    pendingSnapshotTimerRef.current = window.setTimeout(() => {
      pendingSnapshotTimerRef.current = null;
      commitSnapshot(val, cursor);
    }, 400);
  }, [commitSnapshot, flushPendingSnapshot]);

  const pushSnapshotNow = useCallback((val: string, cursor: number) => {
    flushPendingSnapshot();
    commitSnapshot(val, cursor);
  }, [commitSnapshot, flushPendingSnapshot]);

  const applyHistoryEntry = useCallback((entry: { value: string; cursor: number }, cursorOverride?: number) => {
    const el = editorRef.current;
    if (!el) return;
    isUpdatingRef.current = true;
    el.innerHTML = toHTML(entry.value);
    // Measure the maximum caret offset in the newly-rendered DOM so we can
    // clamp any override without walking past the end.
    const maxOffset = measureDomOffset(el);
    const target = cursorOverride != null
      ? Math.min(Math.max(0, cursorOverride), maxOffset)
      : entry.cursor;
    restoreCursor(el, target);
    el.focus();
    onChange(entry.value);
    requestAnimationFrame(() => {
      isUpdatingRef.current = false;
    });
  }, [onChange]);

  const performUndo = useCallback(() => {
    flushPendingSnapshot();
    const el = editorRef.current;
    let currentCursor: number | undefined;
    if (el) {
      const currentPlain = toPlainText(el);
      currentCursor = saveCursor(el);
      const top = historyRef.current[historyIndexRef.current];
      if (top && top.value !== currentPlain) {
        commitSnapshot(currentPlain, currentCursor);
      }
    }
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    applyHistoryEntry(historyRef.current[historyIndexRef.current], currentCursor);
  }, [applyHistoryEntry, commitSnapshot, flushPendingSnapshot]);

  const performRedo = useCallback(() => {
    flushPendingSnapshot();
    const el = editorRef.current;
    const currentCursor = el ? saveCursor(el) : undefined;
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    applyHistoryEntry(historyRef.current[historyIndexRef.current], currentCursor);
  }, [applyHistoryEntry, flushPendingSnapshot]);

  // Sync external value changes into contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isUpdatingRef.current) return;
    
    const currentText = toPlainText(el);
    if (currentText !== value) {
      const pos = saveCursor(el);
      el.innerHTML = toHTML(value);
      restoreCursor(el, pos);
      // External value replaced the editor contents (e.g. editing a different
      // item) — reset undo history so we don't rewind into unrelated state.
      flushPendingSnapshot();
      historyRef.current = [{ value, cursor: pos }];
      historyIndexRef.current = 0;
    }
  }, [value, flushPendingSnapshot]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    
    isUpdatingRef.current = true;
    const plainText = toPlainText(el);
    const pos = saveCursor(el);
    onChange(plainText);
    scheduleTypingSnapshot(plainText, pos);
    
    // Re-render with formatting after a tick
    requestAnimationFrame(() => {
      el.innerHTML = toHTML(plainText);
      restoreCursor(el, pos);
      isUpdatingRef.current = false;
    });
  }, [onChange, scheduleTypingSnapshot]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Undo / Redo — intercept before the browser's native (broken) undo runs.
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      performUndo();
      return;
    }
    if (mod && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      performRedo();
      return;
    }

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
          pushSnapshotNow(newValue, (lastNewline === -1 ? 0 : lastNewline) + 1);
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
        pushSnapshotNow(newValue, textBefore.length + 3);
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
      pushSnapshotNow(newValue, textBefore.length + 1);
      isUpdatingRef.current = true;
      requestAnimationFrame(() => {
        el.innerHTML = toHTML(newValue);
        el.focus();
        placeCursorAfterNthBr(el, newlineCount + 1);
        isUpdatingRef.current = false;
      });
    }
  }, [autoBullet, onChange, pushSnapshotNow]);

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
    pushSnapshotNow(newValue, newPos);
  }, [value, onChange, pushSnapshotNow]);

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
    pushSnapshotNow(newValue, newVisEnd);
  }, [value, onChange, restoreSelection, pushSnapshotNow]);

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
    pushSnapshotNow(newValue, newPos);
  }, [value, onChange, pushSnapshotNow]);

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
            "min-h-[80px] max-h-[240px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            className
          )}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};
