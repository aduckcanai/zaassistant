import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Brain, Smartphone, Sparkles } from 'lucide-react';
import { EnhancedChatInput } from './EnhancedChatInput';
import { SamplePrompts } from './SamplePrompts';

interface UnifiedInputScreenProps {
  onAnalysisGenerate: (input: string, files?: File[]) => void;
  onUIGenerate: (input: string, files?: File[]) => void;
  isGenerating: boolean;
  activeTab?: 'analysis' | 'ui';
  onTabChange?: (tab: 'analysis' | 'ui') => void;
}

export function UnifiedInputScreen({
  onAnalysisGenerate,
  onUIGenerate,
  isGenerating,
  activeTab: externalActiveTab,
  onTabChange,
}: UnifiedInputScreenProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'analysis' | 'ui'>(
    'analysis'
  );
  const [inputValue, setInputValue] = useState('');

  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab ?? internalActiveTab;
  const setActiveTab = onTabChange ?? setInternalActiveTab;

  const handleGenerate = (input: string, files?: File[]) => {
    if (activeTab === 'analysis') {
      onAnalysisGenerate(input, files);
    } else {
      onUIGenerate(input, files);
    }
  };

  const handleSamplePromptSelect = (prompt: string) => {
    setInputValue(prompt);
  };

  const getPlaceholder = () => {
    if (activeTab === 'analysis') {
      return 'Describe your feature idea, user problems, or product goals...';
    } else {
      return 'Describe the UI you want to create. Include user needs, key features, and any specific requirements...';
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-4'>
      <div className='w-full max-w-4xl'>
        {/* Header */}
        <div className='text-center mb-6'>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-4'>
            <div className='p-3 rounded-xl bg-ai-accent-muted border border-ai-accent/20 shadow-lg flex-shrink-0'>
              <Sparkles className='w-8 h-8 text-ai-accent' />
            </div>
            <div className='overflow-visible flex items-center'>
              <h1 className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tight shimmer-text text-center sm:text-left leading-normal pb-2'>
                AI FeatureLab
              </h1>
            </div>
          </div>
          <p className='text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
            Transform your ideas into structured analysis and interactive UI
            prototypes
          </p>
        </div>

        {/* Input Card */}
        <Card className='w-full border-border/50 shadow-xl bg-card/80 backdrop-blur-sm mb-4'>
          <CardContent className='p-4 lg:p-6'>
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as 'analysis' | 'ui')}
              className='w-full'
            >
              <div className='flex justify-center mb-4'>
                <TabsList className='grid w-full max-w-md grid-cols-2 bg-muted/50 border border-border/50 h-12 p-1 rounded-lg'>
                  <TabsTrigger
                    value='analysis'
                    className='flex items-center gap-2 text-muted-foreground data-[state=active]:!bg-purple-600 data-[state=active]:!text-white data-[state=active]:shadow-md font-medium transition-all duration-200 hover:text-ai-accent hover:bg-ai-accent-muted/50 rounded-md data-[state=active]:font-semibold'
                  >
                    <Brain className='w-4 h-4' />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value='ui'
                    className='flex items-center gap-2 text-muted-foreground data-[state=active]:!bg-purple-600 data-[state=active]:!text-white data-[state=active]:shadow-md font-medium transition-all duration-200 hover:text-ai-accent hover:bg-ai-accent-muted/50 rounded-md data-[state=active]:font-semibold'
                  >
                    <Smartphone className='w-4 h-4' />
                    UI
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='analysis' className='mt-0'>
                <div className='space-y-4'>
                  <div className='text-center mb-3'>
                    <p className='text-sm text-muted-foreground'>
                      Structure your feature ideas with comprehensive analysis
                      fields
                    </p>
                  </div>
                  <EnhancedChatInput
                    onAnalyze={handleGenerate}
                    isAnalyzing={isGenerating}
                    placeholder={getPlaceholder()}
                    value={inputValue}
                    onChange={setInputValue}
                  />
                </div>
              </TabsContent>

              <TabsContent value='ui' className='mt-0'>
                <div className='space-y-4'>
                  <div className='text-center mb-3'>
                    <p className='text-sm text-muted-foreground'>
                      Generate interactive mobile prototypes with AI assistance
                    </p>
                  </div>
                  <EnhancedChatInput
                    onAnalyze={handleGenerate}
                    isAnalyzing={isGenerating}
                    placeholder={getPlaceholder()}
                    value={inputValue}
                    onChange={setInputValue}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sample Prompts - Below Input */}
        <div className='mb-4'>
          <SamplePrompts
            onSelectPrompt={handleSamplePromptSelect}
            isLoading={isGenerating}
          />
        </div>

        {/* Footer */}
        <div className='text-center mt-4'>
          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <Sparkles className='w-3 h-3 text-ai-accent' />
            <span>Powered by AI</span>
            <span className='text-border/50'>•</span>
            <span>Built for Product Owners and Designers</span>
            <Sparkles className='w-3 h-3 text-ai-accent' />
          </div>
        </div>
      </div>
    </div>
  );
}
