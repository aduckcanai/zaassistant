import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  History,
  Search,
  Trash2,
  Brain,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Menu,
} from 'lucide-react';
import { HistoryManager, type HistoryEntry } from '../lib/HistoryManager';
import { cn } from '../lib/utils';

interface HistoryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectEntry?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({
  isOpen,
  onToggle,
  onSelectEntry,
}: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'analysis' | 'ui'>(
    'all'
  );

  // Load history when component mounts
  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history when panel opens
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Auto-refresh history every 3 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return; // Không refresh khi panel đóng

    const interval = setInterval(() => {
      loadHistory(); // Reload history từ localStorage
    }, 3000); // Mỗi 3 giây

    return () => clearInterval(interval); // Cleanup
  }, [isOpen]);

  const loadHistory = () => {
    const history = HistoryManager.getHistory();
    setEntries(history.entries.reverse()); // Show newest first
  };

  // Filter entries based on search and filter
  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.prompt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || entry.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleDeleteEntry = (id: string) => {
    HistoryManager.deleteEntry(id);
    loadHistory();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete all history?')) {
      HistoryManager.clearHistory();
      loadHistory();
    }
  };

  const handleSelectEntry = (entry: HistoryEntry) => {
    if (onSelectEntry) {
      onSelectEntry(entry);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-3 h-3 text-green-500' />;
      case 'error':
        return <AlertCircle className='w-3 h-3 text-red-500' />;
      case 'pending':
        return <Loader2 className='w-3 h-3 text-yellow-500 animate-spin' />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'analysis' ? (
      <Brain className='w-3 h-3 text-blue-500' />
    ) : (
      <Smartphone className='w-3 h-3 text-purple-500' />
    );
  };

  return (
    <>
      {/* Toggle Button - Only visible when closed */}
      {!isOpen && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onToggle}
          className='fixed top-4 left-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm border shadow-lg transition-all duration-300'
        >
          <Menu className='w-4 h-4' />
          <span className='hidden sm:inline'>History</span>
        </Button>
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-background border-r border-border z-40 transition-all duration-300 flex flex-col',
          isOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
        )}
      >
        {/* Header */}
        <div className='flex-shrink-0 p-4 border-b border-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <History className='w-4 h-4' />
              <h2 className='font-semibold text-sm'>History</h2>
            </div>
            <Button variant='ghost' size='sm' onClick={onToggle}>
              <X className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className='flex-shrink-0 p-4 space-y-4 border-b border-border'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search history...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 h-9 text-sm bg-muted/50 border-muted-foreground/20 focus:bg-background'
            />
          </div>

          {/* Filter Buttons */}
          <div className='flex gap-1 p-1 bg-muted/30 rounded-lg'>
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilterType('all')}
              className={cn(
                'h-8 px-3 text-xs font-medium transition-all',
                filterType === 'all'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              )}
            >
              All
            </Button>
            <Button
              variant={filterType === 'analysis' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilterType('analysis')}
              className={cn(
                'h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-all',
                filterType === 'analysis'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              )}
            >
              <Brain className='w-3.5 h-3.5' />
              Analysis
            </Button>
            <Button
              variant={filterType === 'ui' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setFilterType('ui')}
              className={cn(
                'h-8 px-3 text-xs font-medium flex items-center gap-1.5 transition-all',
                filterType === 'ui'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              )}
            >
              <Smartphone className='w-3.5 h-3.5' />
              UI
            </Button>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleClearHistory}
              className='h-8 px-3 text-xs flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50'
            >
              <Trash2 className='w-3 h-3' />
              Clear All
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className='flex-1 overflow-y-auto p-3'>
          {filteredEntries.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground text-xs'>
              {searchQuery || filterType !== 'all'
                ? 'No results found'
                : 'No history yet'}
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredEntries.map(entry => (
                <Card
                  key={entry.id}
                  className={cn(
                    'group relative transition-all duration-300 border overflow-hidden py-3 bg-muted/50 border-muted-foreground/20',
                    entry.status === 'error'
                      ? 'cursor-not-allowed opacity-70 hover:opacity-60'
                      : 'cursor-pointer hover:shadow-md hover:scale-[1.01] hover:bg-muted/70'
                  )}
                  onClick={
                    entry.status !== 'error'
                      ? () => handleSelectEntry(entry)
                      : undefined
                  }
                >
                  <CardContent className='p-x-1 relative'>
                    <div className='space-y-2'>
                      {/* Header with icons */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center gap-1.5 px-2 rounded-full bg-background/60 backdrop-blur-sm'>
                            {getTypeIcon(entry.type)}
                            {getStatusIcon(entry.status)}
                            <span className='text-xs font-medium text-muted-foreground'>
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className='h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/70 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </Button>
                      </div>

                      {/* Title */}
                      <h4 className='font-semibold text-sm leading-tight line-clamp-2 text-foreground pr-2'>
                        {entry.title}
                      </h4>

                      {/* Error message */}
                      {entry.error && (
                        <div className='flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20'>
                          <AlertCircle className='w-3 h-3 text-red-500 flex-shrink-0' />
                          <p className='text-xs text-red-600 line-clamp-1 font-medium'>
                            {entry.error}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      {entry.metadata && (
                        <div className='flex gap-2 text-xs'>
                          {entry.metadata.hasFiles && (
                            <div className='flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20'>
                              <span className='text-blue-600'>📎</span>
                              <span className='text-blue-700 dark:text-blue-400 font-medium'>
                                {entry.metadata.fileCount}
                              </span>
                            </div>
                          )}
                          {entry.metadata.processingTime && (
                            <div className='flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/20'>
                              <span className='text-purple-600'>⏱️</span>
                              <span className='text-purple-700 dark:text-purple-400 font-medium'>
                                {(entry.metadata.processingTime / 1000).toFixed(
                                  1
                                )}
                                s
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open (for mobile) */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden'
          onClick={onToggle}
        />
      )}
    </>
  );
}
