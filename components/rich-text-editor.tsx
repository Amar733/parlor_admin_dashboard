"use client";

import { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, Underline, List, ListOrdered, Link, Type, Palette, AlignLeft, AlignCenter, AlignRight, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const customColors = [
  'hsl(173 80% 25%)', 'hsl(174 65% 85%)',
  'hsl(142 76% 36%)', 'hsl(142 50% 90%)',
  'hsl(217 91% 60%)', 'hsl(216 100% 97%)',
  'hsl(347 77% 58%)', 'hsl(347 30% 92%)',
  'hsl(245 86% 59%)', 'hsl(245 50% 93%)',
  'hsl(25 95% 53%)', 'hsl(25 50% 94%)',
  'hsl(215 39% 51%)', 'hsl(215 20% 92%)',
  'hsl(35 22% 50%)', 'hsl(35 15% 91%)',
  'hsl(262 82% 62%)', 'hsl(262 50% 93%)',
  'hsl(180 75% 40%)', 'hsl(180 40% 90%)',
  'hsl(0 72% 51%)', 'hsl(0 80% 96%)',
];

const colors = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc', '#ffe6e6',
  '#ff6600', '#ff8533', '#ffa366', '#ffc299', '#ffe0cc', '#fff2e6',
  '#ffcc00', '#ffd633', '#ffe066', '#ffeb99', '#fff5cc', '#fffae6',
  '#33cc33', '#66d966', '#99e699', '#ccf2cc', '#e6f9e6', '#f2fcf2',
  '#0066cc', '#3385d6', '#66a3e0', '#99c2ea', '#cce0f4', '#e6f2fa',
  '#6600cc', '#8533d6', '#a366e0', '#c299ea', '#e0ccf4', '#f2e6fa',
  '#cc0066', '#d63385', '#e066a3', '#ea99c2', '#f4cce0', '#fae6f2',
  '#8b4513', '#a0522d', '#cd853f', '#daa520', '#f4a460', '#ffd700',
  '#2e8b57', '#3cb371', '#90ee90', '#98fb98', '#adff2f', '#7fff00',
  '#4169e1', '#6495ed', '#87ceeb', '#b0c4de', '#e0e6ff', '#f0f8ff',
  '#9932cc', '#ba55d3', '#da70d6', '#ee82ee', '#dda0dd', '#e6e6fa'
];

export function RichTextEditor({ value, onChange, disabled = false, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('14');
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isHtmlMode && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection();
      const hadFocus = document.activeElement === editorRef.current;
      let cursorPosition = 0;
      let parentNode: Node | null = null;
      
      if (hadFocus && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorPosition = range.startOffset;
        parentNode = range.startContainer;
      }
      
      // Clean up empty content before setting
      const cleanValue = value === '<br>' || value === '<div><br></div>' || value === '<p><br></p>' ? '' : value;
      editorRef.current.innerHTML = cleanValue;
      
      if (hadFocus && parentNode && editorRef.current.contains(parentNode)) {
        try {
          const newRange = document.createRange();
          newRange.setStart(parentNode, Math.min(cursorPosition, parentNode.textContent?.length || 0));
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [value, isHtmlMode]);

  const execCommand = useCallback((command: string, value?: string) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Add inline styles for lists to ensure frontend compatibility
      const lists = editorRef.current.querySelectorAll('ul, ol');
      lists.forEach(list => {
        if (list.tagName === 'UL') {
          (list as HTMLElement).style.cssText = 'margin: 0.5rem 0; padding-left: 1.5rem; list-style-type: disc;';
        } else if (list.tagName === 'OL') {
          (list as HTMLElement).style.cssText = 'margin: 0.5rem 0; padding-left: 1.5rem; list-style-type: decimal;';
        }
      });
      const listItems = editorRef.current.querySelectorAll('li');
      listItems.forEach(li => {
        (li as HTMLElement).style.cssText = 'display: list-item; margin: 0.25rem 0;';
      });
      onChange(editorRef.current.innerHTML);
    }
  }, [disabled, onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorPosition = range?.startOffset;
      const parentNode = range?.startContainer;
      
      // Clean up empty content
      let content = editorRef.current.innerHTML;
      if (content === '<br>' || content === '<div><br></div>' || content === '<p><br></p>') {
        content = '';
        editorRef.current.innerHTML = '';
      }
      
      // Add inline styles for lists
      const lists = editorRef.current.querySelectorAll('ul, ol');
      lists.forEach(list => {
        if (list.tagName === 'UL') {
          (list as HTMLElement).style.cssText = 'margin: 0.5rem 0; padding-left: 1.5rem; list-style-type: disc;';
        } else if (list.tagName === 'OL') {
          (list as HTMLElement).style.cssText = 'margin: 0.5rem 0; padding-left: 1.5rem; list-style-type: decimal;';
        }
      });
      const listItems = editorRef.current.querySelectorAll('li');
      listItems.forEach(li => {
        (li as HTMLElement).style.cssText = 'display: list-item; margin: 0.25rem 0;';
      });
      
      onChange(content || editorRef.current.innerHTML);
      
      // Restore cursor position
      setTimeout(() => {
        if (selection && parentNode && editorRef.current?.contains(parentNode)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(parentNode, Math.min(cursorPosition || 0, parentNode.textContent?.length || 0));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            // Fallback: place cursor at end
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }, 0);
    }
  }, [onChange]);

  const insertLink = useCallback(() => {
    if (disabled) return;
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [disabled, execCommand]);

  const handleFontSize = useCallback((size: string) => {
    if (disabled) return;
    setFontSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size + 'px';
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Fallback: just apply to current selection
        document.execCommand('fontSize', false, '7');
        const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
        fontElements?.forEach(el => {
          el.removeAttribute('size');
          (el as HTMLElement).style.fontSize = size + 'px';
        });
      }
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [disabled, onChange]);

  return (
    <div className="rich-text-editor border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (editorRef.current && !isHtmlMode) {
              // Switching to HTML mode - get current content
              onChange(editorRef.current.innerHTML);
            }
            setIsHtmlMode(!isHtmlMode);
          }}
          disabled={disabled}
          className={`h-8 w-8 p-0 ${isHtmlMode ? 'bg-muted' : ''}`}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        <Select value={fontSize} onValueChange={handleFontSize} disabled={disabled}>
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="20">20px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto">
            <div className="space-y-3">
              <div className="grid grid-cols-11 gap-1">
                {customColors.map((color, idx) => (
                  <button
                    key={`custom-${idx}`}
                    className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => execCommand('foreColor', color)}
                    disabled={disabled}
                  />
                ))}
              </div>
              <div className="border-t pt-2">
                <div className="grid grid-cols-6 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => execCommand('foreColor', color)}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h3')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
      {isHtmlMode ? (
        <Textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Update editor content when switching back
            if (editorRef.current) {
              editorRef.current.innerHTML = e.target.value;
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-[300px] font-mono text-sm border-0 rounded-none resize-none focus-visible:ring-0"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          suppressContentEditableWarning={true}
          className="min-h-[120px] p-3 focus:outline-none"
          style={{
            color: disabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))'
          }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
}