import { useState, useEffect } from 'react';
import { FeatureAnalysis } from './components/FeatureAnalysis';
import { UIGenerator } from './components/UIGenerator';
import { UnifiedInputScreen } from './components/UnifiedInputScreen';
import { Sparkles } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { logger } from './lib/logger';
import { apiClient, type IdeaToAnalysisRequest } from './api/apiClient';
import { productAnalysisReader } from './lib/ProductAnalysisReader';
import { solutionArchitectResponseParser } from './lib/SolutionArchitectResponseParser';
import { HistoryManager, type HistoryEntry } from './lib/HistoryManager';
import { HistoryPanel } from './components/HistoryPanel';
import { cn } from './lib/utils';
import { CacheManager } from './lib/cache';

export default function App() {
  // Always start with fresh state - don't restore from cache on initial load
  const [activeTab, setActiveTab] = useState<'analysis' | 'ui'>('analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uiInput, setUiInput] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const [solutionArchitectMarkdown, setSolutionArchitectMarkdown] =
    useState('');
  const [solutionArchitectData, setSolutionArchitectData] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [shouldAutoGenerateUI, setShouldAutoGenerateUI] = useState(false);

  // Force dark mode on root element
  useEffect(() => {
    document.documentElement.classList.add('dark');
    logger.info('Dark mode enabled');
  }, []);

  // Save state to cache whenever important state changes
  useEffect(() => {
    CacheManager.saveState({
      activeTab,
      uiInput,
      hasContent,
      solutionArchitectMarkdown,
      solutionArchitectData,
      showHistory,
      currentHistoryId,
    });
  }, [
    activeTab,
    uiInput,
    hasContent,
    solutionArchitectMarkdown,
    solutionArchitectData,
    showHistory,
    currentHistoryId,
  ]);

  // Clear any existing cache data on app start to ensure fresh experience
  useEffect(() => {
    CacheManager.clearCache();
    productAnalysisReader.clear();
    logger.info('Starting with fresh state - cache cleared');
  }, []);

  // Reset auto-generate flag after it's been used
  useEffect(() => {
    console.log('Auto-generate reset effect:', {
      shouldAutoGenerateUI,
      activeTab,
    });
    if (shouldAutoGenerateUI && activeTab === 'ui') {
      // Reset the flag after a short delay to allow the UIGenerator to process it
      const timer = setTimeout(() => {
        console.log('Resetting auto-generate flag');
        setShouldAutoGenerateUI(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoGenerateUI, activeTab]);

  const handleAnalysisGenerate = async (input: string) => {
    logger.logUserAction('analysis_generate', { input });

    // Create history entry
    const historyId = HistoryManager.addEntry('analysis', input);
    setCurrentHistoryId(historyId);
    const startTime = Date.now();

    setIsGenerating(true);
    // Clear existing analysis data to ensure fresh start
    productAnalysisReader.clear();

    try {
      const request: IdeaToAnalysisRequest = {
        idea: input,
        context: 'Product improvement',
      };

      const response = await apiClient.ideaToAnalysis(request);
      const processingTime = Date.now() - startTime;

      if (response.success && response.data) {
        // Extract the analysis_board from the nested response structure
        const analysisData = response.data.analysis_board;

        // Load the response data into ProductAnalysisReader
        productAnalysisReader.loadFromObject(analysisData);

        // Validate the data
        const validation = productAnalysisReader.validate();

        if (validation.isValid) {
          // Update history with results
          HistoryManager.updateEntryStatus(historyId, 'success', undefined, {
            responseSize: JSON.stringify(analysisData).length,
            processingTime,
          });

          // Store the results in history
          HistoryManager.updateEntryResults(historyId, {
            analysisData: analysisData,
            uiState: {
              activeTab: 'analysis',
              analysisFormData: analysisData,
            },
          });

          // Save analysis data to cache
          CacheManager.saveState({
            analysisData: analysisData,
          });

          // Now switch to analysis screen after API completion
          setActiveTab('analysis');
          setHasContent(true);

          logger.info('Analysis completed successfully', {
            input,
            productGoal: productAnalysisReader.getProductGoal(),
            insightsCount: productAnalysisReader.getUserInsights().length,
            metricsCount: productAnalysisReader.getSuccessMetrics().length,
          });

          toast.success('Analysis completed successfully!');
        } else {
          HistoryManager.updateEntryStatus(
            historyId,
            'error',
            'Data validation failed'
          );
          logger.error('Analysis data validation failed', {
            input,
            errors: validation.errors,
          });

          toast.error('Analysis data validation failed. Please try again.');
        }
      } else {
        HistoryManager.updateEntryStatus(
          historyId,
          'error',
          response.error || 'Unknown error'
        );
        logger.error('Analysis failed', {
          input,
          error: response.error,
        });

        toast.error(`Analysis failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      HistoryManager.updateEntryStatus(
        historyId,
        'error',
        error instanceof Error ? error.message : 'Network error'
      );
      logger.error('Analysis request failed', {
        input,
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(
        `Analysis request failed: ${error instanceof Error ? error.message : 'Network error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUIGenerate = async (input: string) => {
    logger.logUserAction('ui_generate', { input });

    // Create history entry
    const historyId = HistoryManager.addEntry('ui', input);
    setCurrentHistoryId(historyId);

    setUiInput(input);
    setIsGenerating(true);
    // Clear existing analysis data to ensure fresh start
    productAnalysisReader.clear();

    try {
      // Only call idea_to_analysis first
      const analysisRequest: IdeaToAnalysisRequest = {
        idea: input,
        context: 'UI generation from user input',
      };

      const analysisResponse = await apiClient.ideaToAnalysis(analysisRequest);

      if (!analysisResponse.success || !analysisResponse.data) {
        throw new Error(analysisResponse.error || 'Analysis failed');
      }

      const analysisData = analysisResponse.data.analysis_board;

      // Load the analysis data into ProductAnalysisReader for display
      productAnalysisReader.loadFromObject(analysisData);

      // Clear any existing solution architect data to ensure fresh generation
      // This ensures UIGenerator will use the analysis-based pipeline
      setSolutionArchitectData(null);
      setSolutionArchitectMarkdown('');
      solutionArchitectResponseParser.clear();

      // Update history with initial results (analysis only)
      HistoryManager.updateEntryStatus(historyId, 'success');
      HistoryManager.updateEntryResults(historyId, {
        analysisData: analysisData,
        uiState: {
          activeTab: 'ui',
          uiInput: input,
        },
      });

      // Now switch to UI screen after API completion
      setActiveTab('ui');
      setHasContent(true);
      setShouldAutoGenerateUI(true);

      logger.info('Analysis for UI generation completed successfully', {
        input,
        responseSize: JSON.stringify(analysisData).length,
      });

      toast.success('Analysis completed! Generating UI...');
    } catch (error) {
      HistoryManager.updateEntryStatus(
        historyId,
        'error',
        error instanceof Error ? error.message : 'Network error'
      );
      logger.error('UI generation request failed', {
        input,
        error: error instanceof Error ? error.message : String(error),
      });

      toast.error(
        `UI generation request failed: ${error instanceof Error ? error.message : 'Network error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToInput = () => {
    logger.logUserAction('back_to_input');
    setHasContent(false);
    setUiInput('');
    setSolutionArchitectMarkdown('');
    setSolutionArchitectData(null);
    setCurrentHistoryId(null);
    setShowHistory(false);
    productAnalysisReader.clear();

    // Clear cache when going back to input
    CacheManager.clearCache();
  };

  // Updated history selection handler
  const handleHistorySelect = (entry: HistoryEntry) => {
    if (entry.status !== 'success' || !entry.results) {
      // If no results, just restore the prompt
      if (entry.type === 'analysis') {
        setActiveTab('analysis');
      } else {
        setActiveTab('ui');
        setUiInput(entry.prompt);
      }
      setHasContent(false);
      return;
    }

    // Restore the complete UI state
    const { uiState } = entry.results;

    if (entry.type === 'analysis' && entry.results.analysisData) {
      setActiveTab('analysis');
      // Load the saved analysis data back into ProductAnalysisReader
      productAnalysisReader.loadFromObject(entry.results.analysisData);

      // Restore additional UI state if available
      if (uiState?.solutionArchitectMarkdown) {
        setSolutionArchitectMarkdown(uiState.solutionArchitectMarkdown);
      }
      if (uiState?.solutionArchitectData) {
        setSolutionArchitectData(uiState.solutionArchitectData);
      }

      setHasContent(true);
    } else if (entry.type === 'ui') {
      setActiveTab('ui');

      // Always restore the UI input, but UIGenerator will handle not auto-generating
      setUiInput(uiState?.uiInput || entry.prompt);

      // Restore solution architect markdown if available
      if (uiState?.solutionArchitectMarkdown) {
        setSolutionArchitectMarkdown(uiState.solutionArchitectMarkdown);
      }
      if (uiState?.solutionArchitectData) {
        setSolutionArchitectData(uiState.solutionArchitectData);
      }

      // UI generation results will be restored by the UIGenerator component
      // when it receives the currentHistoryId and checks for existing results

      setHasContent(true);
    }

    setCurrentHistoryId(entry.id);
  };

  const handleGenerateUIFromAnalysis = (analysisData: any) => {
    // Create a comprehensive prompt from the analysis data
    let prompt = 'Generate UI based on this feature analysis:\n\n';

    if (analysisData.productGoal.value) {
      prompt += `Product Goal: ${analysisData.productGoal.value}\n\n`;
    }

    if (analysisData.userProblem.value) {
      prompt += `User Problem: ${analysisData.userProblem.value}\n\n`;
    }

    if (analysisData.targetUsers.value) {
      prompt += `Target Users: ${analysisData.targetUsers.value}\n\n`;
    }

    if (analysisData.userInsights.value) {
      prompt += `User Insights: ${analysisData.userInsights.value}\n\n`;
    }

    if (analysisData.businessGoal.value) {
      prompt += `Business Goal: ${analysisData.businessGoal.value}\n\n`;
    }

    if (analysisData.assumptions.value) {
      prompt += `Key Assumptions: ${analysisData.assumptions.value}\n\n`;
    }

    prompt +=
      'Please create UI designs that address these user needs and business goals.';

    // Set loading state and switch to UI tab
    setIsGenerating(true);
    setUiInput(prompt);
    setActiveTab('ui');
    setShouldAutoGenerateUI(true);

    console.log(
      'handleGenerateUIFromAnalysis called, setting auto-generate flag'
    );
  };

  // Function to update ProductAnalysisReader with current analysisData
  const updateProductAnalysisReader = (analysisData: any) => {
    try {
      // Convert AnalysisData to ProductAnalysisData format
      const productAnalysisData = {
        product_goal: analysisData.productGoal?.value || '',
        business_goal: analysisData.businessGoal?.value || '',
        user_problem_goal: {
          problem: analysisData.userProblem?.value || '',
          user_goal: '',
        },
        target_segments: analysisData.targetUsers?.value
          ? analysisData.targetUsers.value
              .split(',')
              .map((s: string) => s.trim())
          : [],
        user_insights_data: analysisData.userInsights?.value
          ? analysisData.userInsights.value
              .split('\n\n')
              .map((insight: string) => {
                const parts = insight.split(': ');
                return {
                  insight: parts[0] || '',
                  evidence: parts.slice(1).join(': ') || '',
                };
              })
          : [],
        scope: {
          in_scope: [],
          out_scope: [],
          constraints: [],
        },
        success_metrics: [],
        key_assumptions_open_questions: analysisData.assumptions?.value || '',
      };

      // Update the ProductAnalysisReader
      productAnalysisReader.loadFromObject(productAnalysisData);

      logger.info('ProductAnalysisReader updated with current analysis data');
    } catch (error) {
      logger.error('Failed to update ProductAnalysisReader', { error });
    }
  };

  if (!hasContent) {
    return (
      <div className='relative min-h-screen bg-background text-foreground'>
        {/* History Sidebar */}
        <HistoryPanel
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onSelectEntry={handleHistorySelect}
        />

        {/* Main Content with margin for sidebar */}
        <div
          className={cn(
            'transition-all duration-300 min-h-screen',
            showHistory ? 'ml-80' : 'ml-0'
          )}
        >
          <UnifiedInputScreen
            onAnalysisGenerate={handleAnalysisGenerate}
            onUIGenerate={handleUIGenerate}
            isGenerating={isGenerating}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* History Sidebar */}
      <HistoryPanel
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onSelectEntry={handleHistorySelect}
      />

      {/* Main Content với margin cho sidebar */}
      <div
        className={cn(
          'transition-all duration-300',
          showHistory ? 'ml-80' : 'ml-0'
        )}
      >
        {/* Header with Navigation */}
        <header className='border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-20'>
          <div className='container mx-auto px-4 py-3 lg:py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 lg:gap-3 min-w-0 flex-1'>
                <button
                  onClick={handleBackToInput}
                  className='group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 min-w-0'
                >
                  <div className='p-1.5 rounded-lg bg-ai-accent-muted group-hover:bg-ai-accent transition-colors duration-200'>
                    <Sparkles className='w-4 h-4 lg:w-5 lg:h-5 text-ai-accent group-hover:text-ai-accent-foreground flex-shrink-0 transition-colors duration-200' />
                  </div>
                  <h1 className='text-lg lg:text-xl font-medium tracking-tight leading-tight py-1'>
                    AI FeatureLab
                  </h1>
                </button>
              </div>
              {/* Removed the Analysis/UI toggle buttons */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='container mx-auto px-4 py-8 lg:py-10'>
          {activeTab === 'analysis' ? (
            <FeatureAnalysis
              onGenerateUI={handleGenerateUIFromAnalysis}
              productAnalysisData={productAnalysisReader.getData()}
              isProductAnalysisLoaded={productAnalysisReader.isLoaded()}
              onUpdateProductAnalysisReader={updateProductAnalysisReader}
              currentHistoryId={currentHistoryId}
              isGenerating={isGenerating}
              currentHistoryEntry={
                currentHistoryId
                  ? HistoryManager.getHistory().entries.find(
                      e => e.id === currentHistoryId
                    )
                  : undefined
              }
              initialReviewResults={
                currentHistoryId
                  ? HistoryManager.getHistory().entries.find(
                      e => e.id === currentHistoryId
                    )?.results?.reviewResults
                  : undefined
              }
            />
          ) : (
            <UIGenerator
              initialPrompt={uiInput}
              solutionArchitectMarkdown={solutionArchitectMarkdown}
              solutionArchitectData={solutionArchitectData}
              currentHistoryId={currentHistoryId}
              autoGenerate={shouldAutoGenerateUI}
              externalIsGenerating={isGenerating} // Sử dụng tên prop mới
            />
          )}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
