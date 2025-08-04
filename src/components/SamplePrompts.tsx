import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { getSamplePrompts, type SamplePrompt } from '../api/apiClient';
import { logger } from '../lib/logger';

interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

export function SamplePrompts({
  onSelectPrompt,
  isLoading = false,
}: SamplePromptsProps) {
  const [prompts, setPrompts] = useState<SamplePrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoadingPrompts(true);
    setError(null);

    try {
      logger.info('Fetching sample prompts');
      const response = await getSamplePrompts();

      if (response.success && response.data) {
        setPrompts(response.data.prompts);
        logger.info(`Loaded ${response.data.prompts.length} sample prompts`);
      } else {
        setError(response.error || 'Failed to load sample prompts');
        logger.error('Failed to fetch sample prompts', {
          error: response.error,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Exception while fetching sample prompts', {
        error: errorMessage,
      });
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handlePromptClick = (prompt: SamplePrompt) => {
    if (isLoading) return;

    logger.info('Sample prompt selected', {
      promptId: prompt.id,
      title: prompt.title,
    });

    onSelectPrompt(prompt.description);
  };

  if (error) {
    return (
      <Card className='border-border/50'>
        <CardContent className='p-4 text-center'>
          <p className='text-sm text-muted-foreground mb-3'>
            Failed to load sample prompts: {error}
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchPrompts}
            disabled={isLoadingPrompts}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoadingPrompts ? 'animate-spin' : ''}`}
            />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/50'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base flex items-center gap-2'>
            <Sparkles className='w-4 h-4 text-ai-accent' />
            Sample Prompts
          </CardTitle>
        </div>
        <p className='text-xs text-muted-foreground'>
          Click on any sample to use it as your prompt
        </p>
      </CardHeader>
      <CardContent className='pt-0'>
        {isLoadingPrompts ? (
          <div className='space-y-2'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse'>
                <div className='h-3 bg-muted rounded w-3/4 mb-1'></div>
                <div className='h-2 bg-muted rounded w-full'></div>
              </div>
            ))}
          </div>
        ) : (
          <div className='space-y-2'>
            {prompts.map(prompt => (
              <Button
                key={prompt.id}
                variant='ghost'
                className={`w-full p-3 h-auto text-left justify-start hover:bg-ai-accent-muted hover:border-ai-accent/20 border border-transparent transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => handlePromptClick(prompt)}
                disabled={isLoading}
              >
                <div className='flex-1 space-y-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium text-sm text-foreground'>
                      {prompt.title}
                    </h4>
                    <ChevronRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                  </div>
                  <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                    {prompt.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}

        {prompts.length > 0 && (
          <div className='mt-3 pt-3 border-t border-border/30'>
            <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
              <Badge variant='secondary' className='text-xs'>
                {prompts.length} prompts available
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
