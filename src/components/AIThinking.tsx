import { Card, CardContent } from './ui/card';
import { Sparkles, Brain, Lightbulb, Search, Zap, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIThinkingProps {
  message: string;
  stage?: 'analyzing' | 'generating' | 'reviewing' | 'suggesting';
}

export function AIThinking({ message, stage = 'analyzing' }: AIThinkingProps) {
  const [currentIcon, setCurrentIcon] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotating icons for more dynamic feel
  const icons = [
    <Brain className='w-5 h-5' />,
    <Cpu className='w-5 h-5' />,
    <Zap className='w-5 h-5' />,
    <Sparkles className='w-5 h-5' />,
  ];

  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing':
        return <Brain className='w-5 h-5' />;
      case 'generating':
        return <Sparkles className='w-5 h-5' />;
      case 'reviewing':
        return <Search className='w-5 h-5' />;
      case 'suggesting':
        return <Lightbulb className='w-5 h-5' />;
      default:
        return <Sparkles className='w-5 h-5' />;
    }
  };

  // Cycle through icons every 2 seconds
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 2000);

    return () => clearInterval(iconInterval);
  }, []);

  // Simulate progress for long operations
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 2 + 0.5; // Random increment between 0.5-2.5%
        return Math.min(prev + increment, 95); // Cap at 95% to avoid reaching 100%
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <Card className='bg-ai-accent-muted/50 border-ai-accent/30 shadow-lg overflow-hidden relative'>
      {/* Animated background gradient */}
      <div className='absolute inset-0 bg-gradient-to-r from-ai-accent/5 via-ai-accent/10 to-ai-accent/5 animate-pulse'></div>

      {/* Shimmer effect overlay */}
      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer'></div>

      <CardContent className='pt-6 relative z-10'>
        <div className='flex items-start gap-3'>
          {/* Enhanced icon container with rotation and glow */}
          <div className='relative'>
            <div className='text-ai-accent p-3 rounded-xl bg-ai-accent-muted/80 backdrop-blur-sm border border-ai-accent/20 shadow-lg'>
              <div className='transition-all duration-500 ease-in-out transform hover:scale-110'>
                {icons[currentIcon]}
              </div>
            </div>
            {/* Pulsing glow effect */}
            <div className='absolute inset-0 rounded-xl bg-ai-accent/20 animate-ping'></div>
            <div className='absolute inset-0 rounded-xl bg-ai-accent/10 animate-pulse'></div>
          </div>

          <div className='flex-1'>
            {/* Enhanced header with shimmer text */}
            <div className='flex items-center gap-3 mb-3'>
              <p className='font-medium text-ai-accent shimmer-text'>
                AI is thinking...
              </p>

              {/* Enhanced bouncing dots with different colors */}
              <div className='flex gap-1.5'>
                <div className='w-2 h-2 bg-ai-accent rounded-full animate-bounce shadow-lg'></div>
                <div
                  className='w-2 h-2 bg-ai-accent/80 rounded-full animate-bounce shadow-lg'
                  style={{ animationDelay: '0.15s' }}
                ></div>
                <div
                  className='w-2 h-2 bg-ai-accent/60 rounded-full animate-bounce shadow-lg'
                  style={{ animationDelay: '0.3s' }}
                ></div>
              </div>
            </div>

            {/* Progress bar */}
            <div className='mb-3'>
              <div className='w-full bg-ai-accent-muted/50 rounded-full h-1.5 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-ai-accent/60 to-ai-accent transition-all duration-1000 ease-out relative'
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shine effect on progress bar */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer'></div>
                </div>
              </div>
              <p className='text-xs text-muted-foreground mt-1 opacity-70'>
                Processing... {Math.round(progress)}%
              </p>
            </div>

            {/* Message with typing effect */}
            <div className='relative'>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                {message}
              </p>
            </div>

            {/* Floating particles effect */}
            <div className='absolute -top-2 -right-2 w-1 h-1 bg-ai-accent/40 rounded-full animate-ping'></div>
            <div
              className='absolute top-4 -right-1 w-0.5 h-0.5 bg-ai-accent/30 rounded-full animate-pulse'
              style={{ animationDelay: '1s' }}
            ></div>
            <div
              className='absolute -top-1 right-4 w-0.5 h-0.5 bg-ai-accent/20 rounded-full animate-bounce'
              style={{ animationDelay: '2s' }}
            ></div>
          </div>
        </div>

        {/* Stage indicator */}
        <div className='flex items-center gap-2 mt-4 pt-3 border-t border-ai-accent/10'>
          <div className='text-ai-accent/70'>{getStageIcon()}</div>
          <span className='text-xs text-muted-foreground capitalize font-medium'>
            {stage}
          </span>
          <div className='flex-1 flex justify-end'>
            <div className='flex gap-1'>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    i === Math.floor(progress / 25)
                      ? 'bg-ai-accent animate-pulse'
                      : 'bg-ai-accent/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
