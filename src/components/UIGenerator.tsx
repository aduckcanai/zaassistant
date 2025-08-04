import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
// import { Textarea } from './ui/textarea';
import {
  Loader2,
  Sparkles,
  Monitor,
  Copy,
  Download,
  Eye,
  Code,
  // Smartphone,
  TrendingUp,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Award,
} from 'lucide-react';

import {
  solutionToUI,
  solutionToUIFromPrompt,
  solutionArchitect,
} from '../api/apiClient';
import { solutionArchitectResponseParser } from '../lib/SolutionArchitectResponseParser';
import { productAnalysisReader } from '../lib/ProductAnalysisReader';
import { HistoryManager } from '../lib/HistoryManager';
import { toast } from 'sonner';
import { logger } from '../lib/logger';
// import { AIThinking } from './AIThinking';

interface UIGeneratorProps {
  initialPrompt?: string;
  solutionArchitectMarkdown?: string;
  solutionArchitectData?: any; // Add this prop to pass raw JSON data
  currentHistoryId?: string | null; // Add history ID for saving UI results
  autoGenerate?: boolean; // Add prop to trigger auto-generation
  externalIsGenerating?: boolean; // Đổi tên prop để tránh conflict
}

interface GeneratedUIContent {
  html_content: string;
  response_id: string;
}

export function UIGenerator({
  initialPrompt = '',
  solutionArchitectMarkdown,
  solutionArchitectData,
  currentHistoryId,
  autoGenerate = false,
  externalIsGenerating = false, // Đổi tên prop
}: UIGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiThoughts, setAiThoughts] = useState('');
  const [generatedUIContent, setGeneratedUIContent] =
    useState<GeneratedUIContent | null>(null);
  const [selectedApproach, setSelectedApproach] = useState<string>('');
  // const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>(
  //   'mobile'
  // );
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isRestoringFromHistory, setIsRestoringFromHistory] = useState(false);
  const [localSolutionArchitectMarkdown, setLocalSolutionArchitectMarkdown] =
    useState<string>('');

  // Merge external and internal loading states
  const combinedIsGenerating = isGenerating || externalIsGenerating;

  // Load solution architect data into parser when available
  useEffect(() => {
    console.log('=== DEBUG SOLUTION ARCHITECT DATA ===');
    console.log('solutionArchitectData:', solutionArchitectData);
    console.log('solutionArchitectMarkdown:', solutionArchitectMarkdown);
    console.log(
      'Parser isLoaded before:',
      solutionArchitectResponseParser.isLoaded()
    );

    if (solutionArchitectData && !solutionArchitectResponseParser.isLoaded()) {
      try {
        console.log('Attempting to load data into parser...');
        console.log(
          'Data structure:',
          JSON.stringify(solutionArchitectData, null, 2)
        );

        solutionArchitectResponseParser.loadFromObject(solutionArchitectData);

        console.log('Parser loaded successfully');
        console.log(
          'Parser isLoaded after:',
          solutionArchitectResponseParser.isLoaded()
        );
        console.log(
          'Problem statement:',
          solutionArchitectResponseParser.getProblemStatement()
        );

        logger.info('Solution architect data loaded into parser');
      } catch (error) {
        console.error('Failed to load solution architect data:', error);
        console.error(
          'Error details:',
          error instanceof Error ? error.message : String(error)
        );

        logger.error('Failed to load solution architect data into parser', {
          error,
        });
        toast.error('Failed to load solution architect data');
      }
    } else if (
      solutionArchitectData &&
      solutionArchitectResponseParser.isLoaded()
    ) {
      console.log(
        'Parser already loaded, current problem statement:',
        solutionArchitectResponseParser.getProblemStatement()
      );
    } else if (!solutionArchitectData) {
      console.log('No solutionArchitectData provided');
    }

    console.log('=== END DEBUG ===');
  }, [solutionArchitectData]);

  // Debug autoGenerate prop changes
  useEffect(() => {
    console.log('UIGenerator autoGenerate prop changed:', autoGenerate);
  }, [autoGenerate]);

  // Restore UI generation results from history when component mounts
  useEffect(() => {
    if (currentHistoryId && !generatedUIContent) {
      setIsRestoringFromHistory(true);
      try {
        const history = HistoryManager.getHistory();
        const currentEntry = history.entries.find(
          entry => entry.id === currentHistoryId
        );

        if (currentEntry?.results?.uiResults) {
          const uiResults = currentEntry.results.uiResults;
          setGeneratedUIContent({
            html_content: uiResults.html_content,
            response_id: uiResults.response_id,
          });

          if (uiResults.approach_name) {
            setSelectedApproach(uiResults.approach_name);
          } else if (uiResults.generation_type === 'prompt-based') {
            setSelectedApproach('Generated from Prompt');
          }

          // Restore the prompt if it was saved with the UI results
          if (
            uiResults.prompt &&
            uiResults.generation_type === 'prompt-based'
          ) {
            setPrompt(uiResults.prompt);
          }

          logger.info('UI generation results restored from history', {
            historyId: currentHistoryId,
            responseId: uiResults.response_id,
          });
        }
      } catch (error) {
        logger.error('Failed to restore UI results from history', { error });
      } finally {
        // Reset the flag after a short delay to allow the restore to complete
        setTimeout(() => setIsRestoringFromHistory(false), 100);
      }
    }
  }, [currentHistoryId, generatedUIContent]);

  // New function to handle solution-to-UI API call
  const generateUIFromSolution = async (approachName: string) => {
    if (!solutionArchitectResponseParser.isLoaded()) {
      toast.error('Solution architect data not available');
      return;
    }

    setIsGenerating(true);
    setAiThoughts('Analyzing solution approach and generating UI prototype...');
    setGeneratedUIContent(null); // Clear previous content

    try {
      const problemStatement =
        solutionArchitectResponseParser.getProblemStatement();
      const solutionAnalysis =
        solutionArchitectResponseParser.getSolutionAnalysis(approachName);

      if (!solutionAnalysis) {
        throw new Error(`Solution approach "${approachName}" not found`);
      }

      // Transform the solution analysis to match the API format
      const selectedApproach = {
        approach_name: solutionAnalysis.approach_name,
        description: solutionAnalysis.description,
        core_tradeoff:
          solutionAnalysis.core_tradeoff ||
          (solutionAnalysis.risk_tradeoff_analysis ||
            solutionAnalysis.implementation_risk_analysis ||
            [])[0]?.resulting_tradeoff ||
          'No core tradeoff identified',
        key_benefits:
          solutionAnalysis.pros || solutionAnalysis.key_benefits || [],
        implementation_risk_analysis: (
          solutionAnalysis.risk_tradeoff_analysis ||
          solutionAnalysis.implementation_risk_analysis ||
          []
        ).map(risk => ({
          risk: risk.risk,
          mitigation_idea: risk.mitigation_idea,
          resulting_tradeoff: risk.resulting_tradeoff,
        })),
      };

      logger.info('Calling solution-to-UI API', {
        problemStatement,
        approachName,
        keyBenefitsCount: selectedApproach.key_benefits.length,
        riskAnalysisCount: selectedApproach.implementation_risk_analysis.length,
      });

      const response = await solutionToUI({
        problem_statement: problemStatement,
        selected_approach: selectedApproach,
      });

      if (response.success && response.data) {
        setGeneratedUIContent({
          html_content: response.data.html_content,
          response_id: response.data.response_id,
        });
        setSelectedApproach(approachName);
        setAiThoughts(''); // Clear loading message
        toast.success('UI prototype generated successfully!');

        // Save UI generation results to history
        if (currentHistoryId) {
          HistoryManager.updateEntryResults(currentHistoryId, {
            uiResults: {
              html_content: response.data.html_content,
              response_id: response.data.response_id,
              approach_name: approachName,
              generation_type: 'solution-based',
              timestamp: new Date().toISOString(),
            },
            uiState: {
              selectedApproach: approachName,
              generatedContent: {
                html_content: response.data.html_content,
                response_id: response.data.response_id,
              },
            },
          });
        }

        logger.info('Solution-to-UI generation completed', {
          approachName,
          responseId: response.data.response_id,
          htmlContentLength: response.data.html_content?.length || 0,
        });
      } else {
        throw new Error(
          response.error || 'Failed to generate UI from solution'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Solution-to-UI generation failed', {
        approachName,
        error: errorMessage,
      });
      toast.error(`Failed to generate UI: ${errorMessage}`);
      setAiThoughts(''); // Clear loading message
    } finally {
      setIsGenerating(false);
    }
  };

  // New function to handle full UI generation pipeline: analysis -> solution_architect -> solution_to_ui
  const generateUIFromAnalysis = async () => {
    if (!productAnalysisReader.isLoaded()) {
      toast.error('Analysis data not available');
      return;
    }

    setIsGenerating(true);
    setAiThoughts(
      'Analyzing requirements and generating solution approaches...'
    );
    setGeneratedUIContent(null); // Clear previous content

    try {
      // Step 1: Call solution_architect with analysis data
      const analysisData = productAnalysisReader.getData();

      if (!analysisData) {
        throw new Error('Analysis data is not available');
      }

      logger.info('Calling solution_architect API', {
        analysisDataKeys: Object.keys(analysisData),
        analysisDataSize: JSON.stringify(analysisData).length,
      });

      setAiThoughts('Creating solution approaches from analysis...');

      const solutionRequest = {
        analysis_board: analysisData,
      };

      const solutionResponse = await solutionArchitect(solutionRequest);

      if (!solutionResponse.success || !solutionResponse.data) {
        throw new Error(solutionResponse.error || 'Solution architect failed');
      }

      console.log('Solution architect API success:', {
        hasData: !!solutionResponse.data,
        dataKeys: Object.keys(solutionResponse.data),
        solutionAnalysisLength: solutionResponse.data.solution_analysis?.length,
      });

      // Load solution architect data into parser
      solutionArchitectResponseParser.loadFromObject(solutionResponse.data);

      // Update local state to trigger UI re-render with solution approaches
      setLocalSolutionArchitectMarkdown(
        JSON.stringify(solutionResponse.data, null, 2)
      );

      // Step 2: Extract the first solution approach and call solution_to_ui
      const solutionData = solutionResponse.data;
      const firstApproach = solutionData.solution_analysis?.[0];

      if (!firstApproach) {
        console.error('Solution response structure:', solutionData);
        throw new Error('No solution approaches found in response');
      }

      setAiThoughts('Generating UI prototype from solution approach...');

      console.log('First approach found:', {
        approach_name: firstApproach.approach_name,
        description: firstApproach.description,
        hasKeyBenefits: !!firstApproach.key_benefits,
        hasRiskAnalysis: !!firstApproach.implementation_risk_analysis,
      });

      // Transform the solution analysis to match the API format
      const selectedApproach = {
        approach_name: firstApproach.approach_name,
        description: firstApproach.description,
        core_tradeoff:
          firstApproach.core_tradeoff || 'No core tradeoff identified',
        key_benefits: firstApproach.key_benefits || [],
        implementation_risk_analysis: (
          firstApproach.implementation_risk_analysis || []
        ).map((risk: any) => ({
          risk: risk.risk,
          mitigation_idea: risk.mitigation_idea,
          resulting_tradeoff: risk.resulting_tradeoff,
        })),
      };

      const uiRequest = {
        problem_statement: solutionData.problem_statement || prompt,
        selected_approach: selectedApproach,
      };

      console.log('Calling solution_to_ui API with request:', {
        problem_statement: uiRequest.problem_statement,
        approach_name: uiRequest.selected_approach.approach_name,
        key_benefits_count: uiRequest.selected_approach.key_benefits.length,
      });

      const uiResponse = await solutionToUI(uiRequest);

      console.log('Solution_to_ui API response:', {
        success: uiResponse.success,
        hasData: !!uiResponse.data,
        error: uiResponse.error,
      });

      if (uiResponse.success && uiResponse.data) {
        setGeneratedUIContent({
          html_content: uiResponse.data.html_content,
          response_id: uiResponse.data.response_id,
        });
        setSelectedApproach(firstApproach.approach_name);
        setAiThoughts(''); // Clear loading message
        toast.success('UI prototype generated successfully!');

        console.log('UI generation completed, setting states:', {
          hasGeneratedContent: !!uiResponse.data.html_content,
          selectedApproach: firstApproach.approach_name,
        });

        // Save UI generation results to history
        if (currentHistoryId) {
          HistoryManager.updateEntryResults(currentHistoryId, {
            solutionArchitectData: solutionResponse.data,
            uiResults: {
              html_content: uiResponse.data.html_content,
              response_id: uiResponse.data.response_id,
              approach_name: firstApproach.approach_name,
              generation_type: 'analysis-based',
              timestamp: new Date().toISOString(),
            },
            uiState: {
              selectedApproach: firstApproach.approach_name,
              generatedContent: {
                html_content: uiResponse.data.html_content,
                response_id: uiResponse.data.response_id,
              },
            },
          });
        }

        logger.info('UI generation from analysis completed successfully', {
          responseId: uiResponse.data.response_id,
          approachName: firstApproach.approach_name,
          htmlContentLength: uiResponse.data.html_content?.length || 0,
        });
      } else {
        throw new Error(uiResponse.error || 'UI generation failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('UI generation from analysis failed', {
        error: errorMessage,
      });
      toast.error(`Failed to generate UI: ${errorMessage}`);
      setAiThoughts(''); // Clear loading message
    } finally {
      setIsGenerating(false);
    }
  };

  const generateUI = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setAiThoughts('Analyzing your requirements and generating UI prototype...');
    setGeneratedUIContent(null); // Clear previous content

    try {
      logger.info('Calling solution-to-UI API with prompt', {
        prompt,
        promptLength: prompt.length,
      });

      const response = await solutionToUIFromPrompt(prompt);

      if (response.success && response.data) {
        setGeneratedUIContent({
          html_content: response.data.html_content,
          response_id: response.data.response_id,
        });
        setSelectedApproach('Generated from Prompt');
        setAiThoughts(''); // Clear loading message
        toast.success('UI prototype generated successfully!');

        // Save UI generation results to history
        if (currentHistoryId) {
          HistoryManager.updateEntryResults(currentHistoryId, {
            uiResults: {
              html_content: response.data.html_content,
              response_id: response.data.response_id,
              prompt: prompt,
              generation_type: 'prompt-based',
              timestamp: new Date().toISOString(),
            },
            uiState: {
              selectedApproach: 'Generated from Prompt',
              generatedContent: {
                html_content: response.data.html_content,
                response_id: response.data.response_id,
              },
              uiInput: prompt,
            },
          });
        }

        logger.info('Solution-to-UI generation from prompt completed', {
          responseId: response.data.response_id,
          htmlContentLength: response.data.html_content?.length || 0,
        });
      } else {
        throw new Error(response.error || 'Failed to generate UI from prompt');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Solution-to-UI generation from prompt failed', {
        prompt,
        error: errorMessage,
      });
      toast.error(`Failed to generate UI: ${errorMessage}`);
      setAiThoughts(''); // Clear loading message
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate UI when there's initial prompt or autoGenerate is true
  useEffect(() => {
    console.log('Auto-generation check:', {
      autoGenerate,
      initialPrompt: initialPrompt?.trim(),
      prompt: prompt?.trim(),
      generatedUIContent: !!generatedUIContent,
      isGenerating,
      currentHistoryId,
      isRestoringFromHistory,
    });

    // Check if current history entry has UI results
    let hasHistoryUIResults = false;
    if (currentHistoryId) {
      try {
        const history = HistoryManager.getHistory();
        const currentEntry = history.entries.find(
          entry => entry.id === currentHistoryId
        );
        hasHistoryUIResults = !!currentEntry?.results?.uiResults;
      } catch (error) {
        // Ignore error, default to false
      }
    }

    // Simplified auto-generation logic
    const shouldAutoGenerate =
      (autoGenerate && !generatedUIContent && !isGenerating) ||
      (initialPrompt &&
        initialPrompt.trim() &&
        prompt === initialPrompt &&
        !generatedUIContent &&
        !isGenerating &&
        !currentHistoryId &&
        !isRestoringFromHistory &&
        !hasHistoryUIResults);

    if (shouldAutoGenerate) {
      console.log('Auto-generating UI...');

      // Choose the appropriate generation method based on available data
      if (
        productAnalysisReader.isLoaded() &&
        !solutionArchitectResponseParser.isLoaded()
      ) {
        // We have analysis data but no solution architect data - use full pipeline
        console.log('Using analysis-based generation pipeline');
        generateUIFromAnalysis();
      } else if (solutionArchitectResponseParser.isLoaded()) {
        // We have solution architect data - use existing solution approach
        console.log('Using solution-based generation');
        const approaches =
          solutionArchitectResponseParser.getSolutionAnalyses();
        if (approaches.length > 0) {
          generateUIFromSolution(approaches[0].approach_name);
        } else {
          generateUI(); // Fallback to prompt-based
        }
      } else {
        // No analysis data - use prompt-based generation
        console.log('Using prompt-based generation');
        generateUI();
      }
    }
  }, [
    initialPrompt,
    autoGenerate,
    prompt,
    generatedUIContent,
    isGenerating,
    currentHistoryId,
    isRestoringFromHistory,
  ]);

  // Show loading state when generating from analysis (calling solution_architect)
  if (
    combinedIsGenerating &&
    !solutionArchitectResponseParser.isLoaded() &&
    productAnalysisReader.isLoaded()
  ) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
              Analyzing Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='mb-6'>
                <div className='relative'>
                  <div className='w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse'></div>
                  <div className='absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                </div>
              </div>
              <h3 className='text-lg font-medium text-foreground mb-2'>
                Creating Solution Approaches
              </h3>
              <p className='text-sm text-muted-foreground max-w-sm mb-4'>
                {aiThoughts ||
                  'Analyzing your requirements and generating solution approaches...'}
              </p>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <div className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'></div>
                <div
                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state when generating from prompt (no analysis data)
  if (
    combinedIsGenerating &&
    !productAnalysisReader.isLoaded() &&
    prompt.trim()
  ) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
              Generating UI Prototype
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='mb-6'>
                <div className='relative'>
                  <div className='w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse'></div>
                  <div className='absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                </div>
              </div>
              <h3 className='text-lg font-medium text-foreground mb-2'>
                Creating UI Prototype
              </h3>
              <p className='text-sm text-muted-foreground max-w-sm mb-4'>
                {aiThoughts ||
                  'Analyzing your requirements and generating UI prototype...'}
              </p>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <div className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'></div>
                <div
                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  solutionArchitectData;
  const effectiveSolutionArchitectMarkdown =
    localSolutionArchitectMarkdown || solutionArchitectMarkdown;

  return (
    <div className='space-y-6'>
      {/* Solution Architect Results - Improved Display */}
      {effectiveSolutionArchitectMarkdown && (
        <div className='mb-4 space-y-6'>
          {/* Problem Statement Card */}
          <Card className='border-blue-200 dark:border-blue-800/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-blue-700 dark:text-blue-300'>
                <Target className='w-5 h-5' />
                Problem Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm leading-relaxed text-blue-800 dark:text-blue-200'>
                {(() => {
                  console.log('Rendering problem statement...');
                  console.log(
                    'Parser isLoaded:',
                    solutionArchitectResponseParser.isLoaded()
                  );

                  if (solutionArchitectResponseParser.isLoaded()) {
                    try {
                      const problemStatement =
                        solutionArchitectResponseParser.getProblemStatement();
                      console.log(
                        'Retrieved problem statement:',
                        problemStatement
                      );
                      return problemStatement;
                    } catch (error) {
                      console.error('Error getting problem statement:', error);
                      return 'Error loading problem statement';
                    }
                  } else {
                    console.log('Parser not loaded, showing loading message');
                    return 'Loading problem statement...';
                  }
                })()}
              </p>
            </CardContent>
          </Card>

          {/* Solution Approaches Grid */}
          {solutionArchitectResponseParser.isLoaded() && (
            <>
              {/* Evaluation Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='w-5 h-5' />
                    Solution Approaches Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse'>
                      <thead>
                        <tr className='border-b border-border/50'>
                          <th className='text-left p-3 font-semibold'>
                            Approach
                          </th>
                          <th className='text-center p-3 font-semibold'>
                            <div className='flex items-center justify-center gap-1'>
                              <TrendingUp className='w-4 h-4' />
                              Impact
                            </div>
                          </th>
                          <th className='text-center p-3 font-semibold'>
                            <div className='flex items-center justify-center gap-1'>
                              <Clock className='w-4 h-4' />
                              Effort
                            </div>
                          </th>
                          <th className='text-center p-3 font-semibold'>
                            <div className='flex items-center justify-center gap-1'>
                              <Shield className='w-4 h-4' />
                              Confidence
                            </div>
                          </th>
                          <th className='text-center p-3 font-semibold'>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {solutionArchitectResponseParser
                          .getEvaluationTable()
                          .sort((a, b) => {
                            // Sắp xếp để recommended approaches lên đầu
                            const recommendation =
                              solutionArchitectResponseParser
                                .getRecommendation()
                                .toLowerCase();
                            const aIsRecommended = recommendation.includes(
                              a.approach_name.toLowerCase()
                            );
                            const bIsRecommended = recommendation.includes(
                              b.approach_name.toLowerCase()
                            );

                            if (aIsRecommended && !bIsRecommended) return -1;
                            if (!aIsRecommended && bIsRecommended) return 1;
                            return 0;
                          })
                          .map(entry => {
                            const getScoreColor = (
                              score: string,
                              type: 'impact' | 'effort' | 'confidence'
                            ) => {
                              if (type === 'effort') {
                                // For effort, lower is better
                                if (score === 'Low')
                                  return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
                                if (score === 'Medium')
                                  return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
                                if (score === 'High')
                                  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
                              } else {
                                // For impact and confidence, higher is better
                                if (
                                  score === 'High' ||
                                  score === 'Potentially High'
                                )
                                  return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
                                if (score === 'Medium')
                                  return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
                                if (score === 'Low')
                                  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
                              }
                              return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
                            };

                            return (
                              <tr
                                key={entry.approach_name}
                                className='border-b border-border/30 hover:bg-muted/30 transition-colors'
                              >
                                <td className='p-3'>
                                  <div className='font-medium text-sm'>
                                    {entry.approach_name}
                                  </div>
                                  <div className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                                    {
                                      solutionArchitectResponseParser.getSolutionAnalysis(
                                        entry.approach_name
                                      )?.description
                                    }
                                  </div>
                                </td>
                                <td className='p-3 text-center'>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(entry.impact_score, 'impact')}`}
                                  >
                                    {entry.impact_score}
                                  </span>
                                </td>
                                <td className='p-3 text-center'>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(entry.effort_score, 'effort')}`}
                                  >
                                    {entry.effort_score}
                                  </span>
                                </td>
                                <td className='p-3 text-center'>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(entry.confidence_score, 'confidence')}`}
                                  >
                                    {entry.confidence_score}
                                  </span>
                                </td>
                                <td className='p-3 text-center'>
                                  <Button
                                    size='sm'
                                    variant={
                                      selectedApproach === entry.approach_name
                                        ? 'default'
                                        : 'outline'
                                    }
                                    onClick={() =>
                                      generateUIFromSolution(
                                        entry.approach_name
                                      )
                                    }
                                    disabled={isGenerating}
                                    className='text-xs h-8'
                                  >
                                    {selectedApproach ===
                                    entry.approach_name ? (
                                      <>
                                        <CheckCircle className='w-3 h-3 mr-1' />
                                        Selected
                                      </>
                                    ) : (
                                      <>
                                        <Zap className='w-3 h-3 mr-1' />
                                        Generate UI
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Solution Approaches - Two Column Layout */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <Sparkles className='w-5 h-5' />
                  Detailed Solution Analysis
                </h3>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Left Column - Solution Analysis Cards */}
                  <div className='space-y-4'>
                    {solutionArchitectResponseParser
                      .getSolutionAnalyses()
                      .sort((a, b) => {
                        // Sắp xếp để recommended approaches lên đầu
                        const recommendation = solutionArchitectResponseParser
                          .getRecommendation()
                          .toLowerCase();
                        const aIsRecommended = recommendation.includes(
                          a.approach_name.toLowerCase()
                        );
                        const bIsRecommended = recommendation.includes(
                          b.approach_name.toLowerCase()
                        );

                        if (aIsRecommended && !bIsRecommended) return -1;
                        if (!aIsRecommended && bIsRecommended) return 1;
                        return 0;
                      })
                      .map(analysis => {
                        const evaluation =
                          solutionArchitectResponseParser.getApproachEvaluation(
                            analysis.approach_name
                          );
                        const isRecommended = solutionArchitectResponseParser
                          .getRecommendation()
                          .toLowerCase()
                          .includes(analysis.approach_name.toLowerCase());

                        return (
                          <Card
                            key={analysis.approach_name}
                            className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isRecommended
                                ? 'ring-2 ring-green-500 dark:ring-green-400'
                                : ''
                            } ${
                              selectedApproach === analysis.approach_name
                                ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950/20'
                                : ''
                            } ${
                              isGenerating &&
                              selectedApproach === analysis.approach_name
                                ? 'opacity-75 cursor-wait'
                                : ''
                            }`}
                            onClick={() =>
                              !isGenerating &&
                              generateUIFromSolution(analysis.approach_name)
                            }
                          >
                            {isRecommended && (
                              <div className='absolute -top-2 -right-2 z-10'>
                                <div className='bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                                  <Award className='w-3 h-3' />
                                  Recommended
                                </div>
                              </div>
                            )}

                            <CardHeader className='pb-3'>
                              <CardTitle className='text-base flex items-center justify-between'>
                                <span>{analysis.approach_name}</span>
                                <div className='flex gap-1'>
                                  {evaluation && (
                                    <>
                                      <span className='text-xs bg-muted px-2 py-1 rounded'>
                                        Impact: {evaluation.impact_score}
                                      </span>
                                      <span className='text-xs bg-muted px-2 py-1 rounded'>
                                        Effort: {evaluation.effort_score}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </CardTitle>
                              <p className='text-sm text-muted-foreground'>
                                {analysis.description}
                              </p>
                            </CardHeader>

                            <CardContent className='pt-0 space-y-4'>
                              {/* Advantages */}
                              <div>
                                <h4 className='text-sm font-medium flex items-center gap-2 mb-2'>
                                  <CheckCircle className='w-4 h-4 text-green-500' />
                                  Key Benefits
                                </h4>
                                <ul className='space-y-1'>
                                  {(
                                    analysis.pros ||
                                    analysis.key_benefits ||
                                    []
                                  ).map((pro, proIndex) => (
                                    <li
                                      key={proIndex}
                                      className='text-xs text-muted-foreground flex items-start gap-2'
                                    >
                                      <span className='w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0'></span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Risk Analysis */}
                              {(
                                analysis.risk_tradeoff_analysis ||
                                analysis.implementation_risk_analysis ||
                                []
                              ).length > 0 && (
                                <div>
                                  <h4 className='text-sm font-medium flex items-center gap-2 mb-2'>
                                    <AlertTriangle className='w-4 h-4 text-orange-500' />
                                    Risk Analysis
                                  </h4>
                                  <div className='space-y-2'>
                                    {(
                                      analysis.risk_tradeoff_analysis ||
                                      analysis.implementation_risk_analysis ||
                                      []
                                    ).map((risk, riskIndex) => (
                                      <div
                                        key={riskIndex}
                                        className='bg-orange-50 dark:bg-orange-950/20 p-3 rounded border border-orange-200 dark:border-orange-800/30'
                                      >
                                        <div className='text-xs font-medium text-orange-800 dark:text-orange-300 mb-1'>
                                          Risk: {risk.risk}
                                        </div>
                                        <div className='text-xs text-orange-700 dark:text-orange-400 mb-1'>
                                          Mitigation: {risk.mitigation_idea}
                                        </div>
                                        <div className='text-xs text-orange-600 dark:text-orange-500'>
                                          Trade-off: {risk.resulting_tradeoff}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Status Indicator */}
                              <div className='flex items-center justify-between pt-2 border-t border-border/50'>
                                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                  {selectedApproach ===
                                  analysis.approach_name ? (
                                    <>
                                      <CheckCircle className='w-4 h-4 text-green-500' />
                                      Selected
                                    </>
                                  ) : (
                                    <>
                                      <Zap className='w-4 h-4' />
                                      Click to generate UI
                                    </>
                                  )}
                                </div>
                                {isGenerating &&
                                  selectedApproach ===
                                    analysis.approach_name && (
                                    <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
                                  )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>

                  {/* Right Column - UI Preview */}
                  <div className='space-y-4'>
                    <div className='sticky top-4'>
                      {isGenerating ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                              <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
                              Generating UI - {selectedApproach}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='flex flex-col items-center justify-center py-20 text-center'>
                              <div className='mb-6'>
                                <div className='relative'>
                                  <div className='w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse'></div>
                                  <div className='absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                                </div>
                              </div>
                              <h3 className='text-lg font-medium text-foreground mb-2'>
                                Creating UI Prototype
                              </h3>
                              <p className='text-sm text-muted-foreground max-w-sm mb-4'>
                                {aiThoughts ||
                                  'Analyzing solution approach and generating UI prototype...'}
                              </p>
                              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'></div>
                                <div
                                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                                  style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                  className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                                  style={{ animationDelay: '0.2s' }}
                                ></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : generatedUIContent && selectedApproach ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                              <Monitor className='w-5 h-5' />
                              UI Preview - {selectedApproach}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='space-y-4'>
                              {/* View Mode Tabs */}
                              <div className='flex items-center gap-2 p-1 bg-muted rounded-lg'>
                                <Button
                                  variant={
                                    viewMode === 'preview' ? 'default' : 'ghost'
                                  }
                                  size='sm'
                                  onClick={() => setViewMode('preview')}
                                  className='flex items-center gap-2'
                                >
                                  <Eye className='w-4 h-4' />
                                  Preview
                                </Button>
                                <Button
                                  variant={
                                    viewMode === 'code' ? 'default' : 'ghost'
                                  }
                                  size='sm'
                                  onClick={() => setViewMode('code')}
                                  className='flex items-center gap-2'
                                >
                                  <Code className='w-4 h-4' />
                                  Code
                                </Button>
                              </div>

                              {viewMode === 'preview' ? (
                                <div className='border rounded-lg overflow-hidden bg-white'>
                                  <div className='bg-muted px-4 py-2 text-sm font-medium border-b flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <Eye className='w-4 h-4' />
                                      Live Preview - Mobile View
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            generatedUIContent.html_content
                                          );
                                          toast.success('HTML code copied!');
                                        }}
                                        className='flex items-center gap-1'
                                      >
                                        <Copy className='w-3 h-3' />
                                        Copy
                                      </Button>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => {
                                          const blob = new Blob(
                                            [generatedUIContent.html_content],
                                            { type: 'text/html' }
                                          );
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `ui-${selectedApproach.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(url);
                                          toast.success(
                                            'HTML file downloaded!'
                                          );
                                        }}
                                        className='flex items-center gap-1'
                                      >
                                        <Download className='w-3 h-3' />
                                        Download
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Mobile Preview Frame */}
                                  <div className='bg-black p-6 flex justify-center min-h-[800px] items-center'>
                                    <div className='relative'>
                                      <div
                                        className='relative rounded-[2.5rem] shadow-2xl'
                                        style={{
                                          width: '380px',
                                          height: '760px',
                                          background:
                                            'linear-gradient(180deg, #374151 0%, #4a5568 50%, #2d3748 100%)',
                                          border: '3px solid #4a5568',
                                        }}
                                      >
                                        <div
                                          className='relative rounded-[2.2rem] m-2'
                                          style={{
                                            width: '364px',
                                            height: '744px',
                                            background:
                                              'radial-gradient(ellipse at center, #000000 0%, #1a1a1a 100%)',
                                            padding: '8px',
                                          }}
                                        >
                                          <div
                                            className='relative bg-white rounded-[1.8rem] overflow-hidden'
                                            style={{
                                              width: '348px',
                                              height: '728px',
                                              margin: '8px auto',
                                              boxShadow:
                                                'inset 0 0 30px rgba(0,0,0,0.15), 0 0 20px rgba(255,255,255,0.1)',
                                              border:
                                                '1px solid rgba(255,255,255,0.1)',
                                            }}
                                          >
                                            <iframe
                                              srcDoc={
                                                generatedUIContent.html_content
                                              }
                                              className='w-full h-full border-0'
                                              title='Generated UI Preview'
                                              sandbox='allow-scripts'
                                            />
                                          </div>

                                          {/* Home Indicator */}
                                          <div
                                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2'
                                            style={{
                                              width: '140px',
                                              height: '5px',
                                              background:
                                                'rgba(255,255,255,0.4)',
                                              borderRadius: '2.5px',
                                              boxShadow:
                                                '0 1px 3px rgba(0,0,0,0.3)',
                                            }}
                                          />
                                        </div>

                                        {/* Speaker Grille */}
                                        <div className='absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-1'>
                                          {[...Array(10)].map((_, i) => (
                                            <div
                                              key={i}
                                              style={{
                                                width: '2px',
                                                height: '2px',
                                                background:
                                                  'radial-gradient(circle, #4a5568 0%, #2d3748 100%)',
                                                borderRadius: '50%',
                                                boxShadow:
                                                  'inset 0 0.5px 1px rgba(0,0,0,0.6)',
                                              }}
                                            />
                                          ))}
                                        </div>

                                        {/* USB-C Port */}
                                        <div
                                          className='absolute bottom-8 left-1/2 transform -translate-x-1/2 rounded-md'
                                          style={{
                                            width: '32px',
                                            height: '5px',
                                            background:
                                              'linear-gradient(to bottom, #1a202c, #2d3748, #1a202c)',
                                            boxShadow:
                                              'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,255,255,0.05)',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className='border rounded-lg overflow-hidden'>
                                  <div className='bg-muted px-4 py-2 text-sm font-medium border-b flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <Code className='w-4 h-4' />
                                      HTML Source Code
                                    </div>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          generatedUIContent.html_content
                                        );
                                        toast.success('HTML code copied!');
                                      }}
                                      className='flex items-center gap-1'
                                    >
                                      <Copy className='w-3 h-3' />
                                      Copy
                                    </Button>
                                  </div>
                                  <div className='relative'>
                                    <pre className='p-4 text-xs overflow-x-auto bg-slate-50 max-h-96 font-mono'>
                                      <code className='text-slate-800'>
                                        {generatedUIContent.html_content}
                                      </code>
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className='border-dashed border-2 border-muted-foreground/25'>
                          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
                            <Monitor className='w-12 h-12 text-muted-foreground/50 mb-4' />
                            <h3 className='text-lg font-medium text-muted-foreground mb-2'>
                              No UI Generated Yet
                            </h3>
                            <p className='text-sm text-muted-foreground/75 max-w-sm'>
                              Click on a solution approach on the left to
                              generate and preview the UI prototype
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
