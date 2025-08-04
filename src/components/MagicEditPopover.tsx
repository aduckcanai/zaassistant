import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Wand2, Send, Loader2 } from 'lucide-react';

interface MagicEditPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImprove: (instruction: string) => void;
  isImproving: boolean;
  fieldTitle: string;
  children: React.ReactNode;
}

export function MagicEditPopover({
  isOpen,
  onOpenChange,
  onImprove,
  isImproving,
  fieldTitle,
  children,
}: MagicEditPopoverProps) {
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the textarea when opened
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      // Clear instruction when closed
      setInstruction('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (instruction.trim()) {
      onImprove(instruction.trim());
      setInstruction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className='w-80 p-4' side='right' align='start'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Wand2 className='w-4 h-4 text-primary' />
            <h4 className='font-medium text-sm'>Improve: {fieldTitle}</h4>
          </div>

          <Textarea
            ref={textareaRef}
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder='Tell me how to improve this field...'
            className='min-h-[80px] text-sm resize-none'
            onKeyDown={handleKeyDown}
            disabled={isImproving}
          />

          <div className='flex justify-between items-center'>
            <p className='text-xs text-muted-foreground'>Ctrl+Enter to send</p>
            <Button
              size='sm'
              onClick={handleSubmit}
              disabled={!instruction.trim() || isImproving}
              className='h-7 px-3 text-xs'
            >
              {isImproving ? (
                <>
                  <Loader2 className='w-3 h-3 animate-spin mr-1' />
                  Improving...
                </>
              ) : (
                <>
                  <Send className='w-3 h-3 mr-1' />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
