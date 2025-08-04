import React, { useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

import { Loader2, Sparkles, Upload, X, FileText, Image } from 'lucide-react';
import { AIThinking } from './AIThinking';

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'document';
  size: string;
  url?: string;
}

interface EnhancedChatInputProps {
  onAnalyze: (input: string, files?: File[]) => void;
  isAnalyzing: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function EnhancedChatInput({
  onAnalyze,
  isAnalyzing,
  placeholder = 'Ask Magic Patterns to build anything...',
  value,
  onChange,
}: EnhancedChatInputProps) {
  const [input, setInput] = useState(value || '');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update input when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInput(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSubmit = () => {
    if (input.trim() || uploadedFiles.length > 0) {
      // Convert UploadedFile[] to File[] for consistency
      const files = uploadedFiles.map(f => {
        // Create mock File objects since we have UploadedFile interface
        return new File([''], f.name, {
          type: f.type === 'image' ? 'image/jpeg' : 'application/pdf',
        });
      });
      onAnalyze(input, files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      };

      setUploadedFiles(prev => [...prev, newFile]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Main Input Card */}
      <Card className='border-2 border-dashed border-border/50 hover:border-ai-accent/30 transition-all duration-300 shadow-lg hover:shadow-xl'>
        <CardContent className='p-6 space-y-4'>
          {/* Text Input */}
          <div className='relative'>
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder={placeholder}
              className='min-h-[120px] text-base resize-none border-0 bg-transparent px-4 py-3 focus-visible:ring-0'
              onKeyDown={handleKeyDown}
              disabled={isAnalyzing}
            />
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className='space-y-3 pt-4 border-t border-border/30'>
              <p className='text-sm text-muted-foreground font-medium'>
                Uploaded files:
              </p>
              <div className='flex flex-wrap gap-2'>
                {uploadedFiles.map(file => (
                  <div
                    key={file.id}
                    className='flex items-center gap-2 border border-border/30 px-2 py-1.5 rounded-md group hover:border-border/60 transition-colors'
                  >
                    {file.type === 'image' ? (
                      file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className='w-5 h-5 rounded object-cover flex-shrink-0'
                        />
                      ) : (
                        <Image className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                      )
                    ) : (
                      <FileText className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                    )}
                    <span className='text-sm truncate flex-1 min-w-0'>
                      {file.name}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFile(file.id)}
                      className='h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive'
                      disabled={isAnalyzing}
                    >
                      <X className='w-3 h-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className='flex items-center justify-between pt-4 border-t border-border/30'>
            <div className='flex items-center gap-3'>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*,.pdf,.doc,.docx'
                onChange={handleFileUpload}
                className='hidden'
                disabled={isAnalyzing}
              />
              <Button
                variant='ghost'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className='flex items-center gap-2 text-muted-foreground hover:text-ai-accent hover:bg-ai-accent-muted transition-colors duration-200'
              >
                <Upload className='w-4 h-4' />
                Upload files
              </Button>
              <div className='text-xs text-muted-foreground'>
                Supports images, PDF, DOC files
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='text-xs text-muted-foreground'>
                Ctrl+Enter to send
              </div>
              <Button
                onClick={handleSubmit}
                disabled={
                  (!input.trim() && uploadedFiles.length === 0) || isAnalyzing
                }
                className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200'
                size='lg'
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className='w-4 h-4' />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Thinking State */}
          {isAnalyzing && (
            <div className='pt-4'>
              <AIThinking message='Analyzing your input...' stage='analyzing' />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
