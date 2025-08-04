import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Sparkles,
  Wand2,
  Undo2,
  Redo2,
  Copy,
  Download,
  Smartphone,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIThinking } from './AIThinking';
import { MagicEditPopover } from './MagicEditPopover';

import { type ProductAnalysisData } from '../lib/ProductAnalysisReader';
import { productCritique, assessmentCenter } from '../api/apiClient';
import { critiqueResponseParser } from '../lib/CritiqueResponseParser';
import { assessmentResponseParser } from '../lib/AssessmentResponseParser';
import { HistoryManager } from '../lib/HistoryManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CacheManager } from '../lib/cache';

interface FieldData {
  value: string;
  isAIGenerated: boolean;
}

// Memoized FieldComponent to prevent re-renders
const FieldComponent = memo(
  ({
    title,
    field,
    required = false,
    description,
    placeholder,
    value,
    onChange,
    isAIGenerated = false,
    onMagicEdit,
    isEditing = false,
    magicEditField,
    setMagicEditField,
  }: {
    title: string;
    field: keyof AnalysisData;
    required?: boolean;
    description?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    isAIGenerated?: boolean;
    onMagicEdit: (instruction: string) => void;
    isEditing?: boolean;
    magicEditField: keyof AnalysisData | null;
    setMagicEditField: (field: keyof AnalysisData | null) => void;
  }) => {
    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-medium'>
            {title}
            {required && <span className='text-destructive ml-1'>*</span>}
          </h3>
        </div>
        {description && (
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {description}
          </p>
        )}
        <div className='relative'>
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || `Enter ${title.toLowerCase()}...`}
            className={`min-h-[100px] text-sm leading-relaxed pr-12 transition-colors duration-300 ${
              isAIGenerated ? 'text-ai-accent' : ''
            }`}
          />
          <MagicEditPopover
            isOpen={magicEditField === field}
            onOpenChange={open => setMagicEditField(open ? field : null)}
            onImprove={onMagicEdit}
            isImproving={isEditing}
            fieldTitle={title}
          >
            <Button
              variant='ghost'
              size='sm'
              className='absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-ai-accent hover:bg-ai-accent-muted transition-colors duration-200'
              disabled={isEditing}
            >
              <Wand2 className='w-4 h-4' />
            </Button>
          </MagicEditPopover>
        </div>
      </div>
    );
  }
);

interface AnalysisData {
  productGoal: FieldData;
  businessGoal: FieldData;
  userProblem: FieldData;
  assumptions: FieldData;
  targetUsers: FieldData;
  userInsights: FieldData;
}

interface VersionEntry {
  data: AnalysisData;
  timestamp: number;
  action: string;
}

interface FeatureAnalysisProps {
  onGenerateUI?: (analysisData: AnalysisData) => void;
  productAnalysisData?: ProductAnalysisData | null;
  isProductAnalysisLoaded?: boolean;
  onUpdateProductAnalysisReader?: (analysisData: AnalysisData) => void;
  currentHistoryId?: string | null;
  isGenerating?: boolean;
  initialReviewResults?: string;
  currentHistoryEntry?: any; // Add this prop to receive the current history entry
}

export function FeatureAnalysis({
  onGenerateUI,
  productAnalysisData,
  isProductAnalysisLoaded = false,
  onUpdateProductAnalysisReader,
  currentHistoryId,
  isGenerating = false,
  initialReviewResults,
  currentHistoryEntry,
}: FeatureAnalysisProps) {
  // Initialize analysis data from ProductAnalysisReader if available
  const getInitialAnalysisData = (): AnalysisData => {
    // First check for cached form data
    const cachedState = CacheManager.loadState();
    if (cachedState.analysisFormData) {
      return cachedState.analysisFormData;
    }

    if (isProductAnalysisLoaded && productAnalysisData) {
      return {
        productGoal: {
          value: productAnalysisData.product_goal || '',
          isAIGenerated: true,
        },
        businessGoal: {
          value: productAnalysisData.business_goal || '',
          isAIGenerated: true,
        },
        userProblem: {
          value: productAnalysisData.user_problem_goal
            ? `Problem: ${productAnalysisData.user_problem_goal.problem || ''}\n` +
              `User Goal: ${productAnalysisData.user_problem_goal.user_goal || ''}`
            : '',
          isAIGenerated: true,
        },
        assumptions: {
          value: productAnalysisData.key_assumptions_open_questions || '',
          isAIGenerated: true,
        },
        targetUsers: {
          value: productAnalysisData.target_segments?.join(', ') || '',
          isAIGenerated: true,
        },
        userInsights: {
          value:
            productAnalysisData.user_insights_data
              ?.map(insight => `${insight.insight}: ${insight.evidence}`)
              .join('\n\n') || '',
          isAIGenerated: true,
        },
      };
    }

    return {
    productGoal: { value: '', isAIGenerated: false },
    businessGoal: { value: '', isAIGenerated: false },
    userProblem: { value: '', isAIGenerated: false },
    assumptions: { value: '', isAIGenerated: false },
    targetUsers: { value: '', isAIGenerated: false },
      userInsights: { value: '', isAIGenerated: false },
    };
  };

  const [analysisData, setAnalysisData] = useState<AnalysisData>(
    getInitialAnalysisData()
  );

  // Track ProductAnalysisReader data changes
  const isInitialLoadRef = useRef(true);

  // Function to update from ProductAnalysisReader
  const updateFromProductAnalysisReader = useCallback(() => {
    if (isProductAnalysisLoaded && productAnalysisData) {
      const newAnalysisData: AnalysisData = {
        productGoal: {
          value: productAnalysisData.product_goal || '',
          isAIGenerated: true,
        },
        businessGoal: {
          value: productAnalysisData.business_goal || '',
          isAIGenerated: true,
        },
        userProblem: {
          value: productAnalysisData.user_problem_goal
            ? `Problem: ${productAnalysisData.user_problem_goal.problem || ''}\n` +
              `User Goal: ${productAnalysisData.user_problem_goal.user_goal || ''}`
            : '',
          isAIGenerated: true,
        },
        assumptions: {
          value: productAnalysisData.key_assumptions_open_questions || '',
          isAIGenerated: true,
        },
        targetUsers: {
          value: productAnalysisData.target_segments?.join(', ') || '',
          isAIGenerated: true,
        },
        userInsights: {
          value:
            productAnalysisData.user_insights_data
              ?.map(insight => `${insight.insight}: ${insight.evidence}`)
              .join('\n\n') || '',
          isAIGenerated: true,
        },
      };
      setAnalysisData(newAnalysisData);
    }
  }, [isProductAnalysisLoaded, productAnalysisData]);

  // Function to update ProductAnalysisData when analysisData changes
  const updateProductAnalysisData = useCallback(() => {
    if (onUpdateProductAnalysisReader) {
      onUpdateProductAnalysisReader(analysisData);
    }
  }, [analysisData, onUpdateProductAnalysisReader]);
  
  // Version history for undo functionality
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  
  // Magic edit state
  const [magicEditField, setMagicEditField] = useState<
    keyof AnalysisData | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Overall review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [overallReview, setOverallReview] = useState(
    initialReviewResults || ''
  );

  const requiredFields = [
    'productGoal',
    'userProblem',
    'targetUsers',
    'userInsights',
  ];

  // History entry card collapse state
  const [isHistoryCardCollapsed, setIsHistoryCardCollapsed] = useState(true);

  // Save version to history
  const saveVersion = useCallback(
    (action: string, dataToSave: AnalysisData) => {
    const newVersion: VersionEntry = {
      data: JSON.parse(JSON.stringify(dataToSave)),
      timestamp: Date.now(),
        action,
    };
    
    setVersionHistory(prev => {
        const newHistory = [
          ...prev.slice(0, currentVersionIndex + 1),
          newVersion,
        ];
      return newHistory.slice(-20); // Keep only last 20 versions
    });
    setCurrentVersionIndex(prev => Math.min(prev + 1, 19));
    },
    [currentVersionIndex]
  );

  // Initialize version history
  useEffect(() => {
    if (versionHistory.length === 0 && analysisData) {
      const initialVersion: VersionEntry = {
        data: JSON.parse(JSON.stringify(analysisData)),
        timestamp: Date.now(),
        action: 'Initial State',
      };
      setVersionHistory([initialVersion]);
      setCurrentVersionIndex(0);
    }
  }, [versionHistory.length, analysisData]);

  // Update analysis data when ProductAnalysisReader data changes
  useEffect(() => {
    if (isProductAnalysisLoaded && productAnalysisData) {
      const newAnalysisData: AnalysisData = {
        productGoal: {
          value: productAnalysisData.product_goal || '',
          isAIGenerated: true,
        },
        businessGoal: {
          value: productAnalysisData.business_goal || '',
          isAIGenerated: true,
        },
        userProblem: {
          value: productAnalysisData.user_problem_goal?.problem || '',
          isAIGenerated: true,
        },
        assumptions: {
          value: productAnalysisData.key_assumptions_open_questions || '',
          isAIGenerated: true,
        },
        targetUsers: {
          value: productAnalysisData.target_segments?.join(', ') || '',
          isAIGenerated: true,
        },
        userInsights: {
          value:
            productAnalysisData.user_insights_data
              ?.map(insight => `${insight.insight}: ${insight.evidence}`)
              .join('\n\n') || '',
          isAIGenerated: true,
        },
      };

      setAnalysisData(newAnalysisData);
      isInitialLoadRef.current = false;
    }
  }, [isProductAnalysisLoaded, productAnalysisData]);

  // Sync analysisData changes back to parent
  useEffect(() => {
    if (!isInitialLoadRef.current && onUpdateProductAnalysisReader) {
      updateProductAnalysisData();
    }
  }, [analysisData, updateProductAnalysisData, onUpdateProductAnalysisReader]);

  // Save form data to cache whenever it changes
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      CacheManager.saveState({
        analysisFormData: analysisData,
      });
    }
  }, [analysisData]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const previousVersion = versionHistory[currentVersionIndex - 1];
      setAnalysisData(previousVersion.data);
      setCurrentVersionIndex(prev => prev - 1);
    }
  }, [currentVersionIndex, versionHistory]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (currentVersionIndex < versionHistory.length - 1) {
      const nextVersion = versionHistory[currentVersionIndex + 1];
      setAnalysisData(nextVersion.data);
      setCurrentVersionIndex(prev => prev + 1);
    }
  }, [currentVersionIndex, versionHistory]);

  // Ctrl+Z/Ctrl+Y handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'y' || (event.key === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleMagicEdit = async (
    field: keyof AnalysisData,
    instruction: string
  ) => {
    if (!instruction.trim() || !analysisData) return;
    
    setIsEditing(true);
    
    // Save current state before magic edit
    saveVersion(`Before Magic Edit: ${field}`, analysisData);
    
    // Apply the instruction directly to the field
    const currentField = analysisData[field];
    if (!currentField) {
      setIsEditing(false);
      setMagicEditField(null);
      return;
    }

    const currentValue = currentField.value || '';
    const newValue = currentValue + ' ' + instruction;
      
      const newData = {
        ...analysisData,
      [field]: { value: newValue, isAIGenerated: true },
      };
      
      setAnalysisData(newData);
      saveVersion(`Magic Edit Complete: ${field}`, newData);
      
      setIsEditing(false);
      setMagicEditField(null);
  };

  const handleFieldUpdate = useCallback(
    (field: keyof AnalysisData, value: string) => {
      if (!analysisData) return;

      const currentField = analysisData[field];
      if (!currentField) return;

    const newData = {
      ...analysisData,
        [field]: { ...currentField, value, isAIGenerated: false },
    };
    setAnalysisData(newData);
    
      // Don't auto-save versions on every keystroke to prevent focus loss
      // Versions will be saved on explicit actions like magic edit, review, etc.
    },
    [analysisData]
  );

  const isAllRequiredFieldsFilled = () => {
    if (!analysisData) return false;
    return requiredFields.every(field => {
      const fieldData = analysisData[field as keyof AnalysisData];
      return fieldData && fieldData.value && fieldData.value.trim() !== '';
    });
  };

  // Copy functionality with fallback
  const handleCopyAnalysis = async () => {
    if (!analysisData) return;

    const analysisText = `FEATURE ANALYSIS

WHY
---

Product Goal*
${analysisData.productGoal?.value || '[Not filled]'}

Business Goal
${analysisData.businessGoal?.value || '[Not filled]'}

User Problem & Goal*
${analysisData.userProblem?.value || '[Not filled]'}

Key Assumptions & Open Questions
${analysisData.assumptions?.value || '[Not filled]'}


WHO
---

Target User Segment(s)*
${analysisData.targetUsers?.value || '[Not filled]'}

User Insights & Data*
${analysisData.userInsights?.value || '[Not filled]'}


Generated by AI FeatureLab 
${new Date().toLocaleDateString()}`;

    try {
      // Always use fallback method for reliability
      const textArea = document.createElement('textarea');
      textArea.value = analysisText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Analysis copied to clipboard!');
      } else {
        // Show text in alert as final fallback
        alert(
          'Copy failed. Here is the text to copy manually:\n\n' + analysisText
        );
      }
    } catch (err) {
      // Show text in alert as final fallback
      alert(
        'Copy failed. Here is the text to copy manually:\n\n' + analysisText
      );
    }
  };

  // Export as Document functionality
  const handleExportAsDoc = () => {
    try {
      const analysisText = `FEATURE ANALYSIS

WHY
---

Product Goal*
${analysisData.productGoal.value || '[Not filled]'}

Business Goal
${analysisData.businessGoal.value || '[Not filled]'}

User Problem & Goal*
${analysisData.userProblem.value || '[Not filled]'}

Key Assumptions & Open Questions
${analysisData.assumptions.value || '[Not filled]'}


WHO
---

Target User Segment(s)*
${analysisData.targetUsers.value || '[Not filled]'}

User Insights & Data*
${analysisData.userInsights.value || '[Not filled]'}


Generated by AI FeatureLab 
${new Date().toLocaleDateString()}`;

      const element = document.createElement('a');
      const file = new Blob([analysisText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `feature-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(element.href), 100);
      
      toast.success('Analysis exported successfully!');
    } catch (err) {
      toast.error('Failed to export analysis. Please try again.');
    }
  };

  // Generate UI functionality with solution architect API
  const handleGenerateUI = async () => {
    if (!onGenerateUI) return;
    
    // Show the UIGenerator immediately
    onGenerateUI(analysisData);
    toast.success('Switching to UI Generator...');
  };

  // Overall Review functionality with API integration
  const handleOverallReview = async () => {
    setIsReviewing(true);
    setOverallReview('');

    try {
      // Update ProductAnalysisReader with current analysisData
      updateProductAnalysisData();

      // Generate initial review with completeness
      // const filledFields = Object.keys(analysisData).filter(key => {
      //   const field = analysisData[key as keyof AnalysisData];
      //   return (
      //     field &&
      //     field.value &&
      //     typeof field.value === 'string' &&
      //     field.value.trim() !== ''
      //   );
      // });

      // const completeness = (filledFields.length / 6) * 100;

      let review = `# 🤖 AI-Powered Analysis Review\n\n`;

      // Set initial review
      setOverallReview(review);

      // Call productCritique API
      const critiqueResponse = await productCritique({
        analysis_board: productAnalysisData || {},
      });

      if (!critiqueResponse.success) {
        toast.error(
          `Product critique failed: ${critiqueResponse.error || 'Unknown error'}`
        );
        throw new Error(`Product critique failed: ${critiqueResponse.error}`);
      }

      // Parse critique response
      let critiqueAnalysis = '';
      if (critiqueResponse.data) {
        try {
          critiqueResponseParser.loadFromObject(critiqueResponse.data);

          if (critiqueResponseParser.isLoaded()) {
            // Generate structured critique analysis
            // const analysis = critiqueResponseParser.getAnalysis();
            const highPriorityPoints =
              critiqueResponseParser.getHighPriorityPoints();

            critiqueAnalysis = `## 🔍 Product Critique Analysis\n\n`;
            critiqueAnalysis += `### 📋 Executive Summary\n\n`;
            critiqueAnalysis += `> ${critiqueResponseParser.getOverallSummary()}\n\n`;

            if (highPriorityPoints.length > 0) {
              critiqueAnalysis += `### 🚨 Critical Issues\n\n`;
              highPriorityPoints.forEach((point, index) => {
                critiqueAnalysis += `#### ${index + 1}. **${point.category.toUpperCase()}**\n`;
                critiqueAnalysis += `**Issue:** ${point.critique}\n\n`;
                critiqueAnalysis += `**Key Question:** *${point.challenge_question}*\n\n`;
                critiqueAnalysis += `---\n\n`;
              });
            }

            // Add all critique points
            const allPoints = critiqueResponseParser.getCritiquePoints();
            if (allPoints.length > 0) {
              critiqueAnalysis += `### 📋 Complete Analysis\n\n`;
              critiqueAnalysis += `| Category | Issue | Question |\n`;
              critiqueAnalysis += `|----------|-------|----------|\n`;
              allPoints.forEach(point => {
                critiqueAnalysis += `| **${point.category}** | ${point.critique} | *${point.challenge_question}* |\n`;
              });
              critiqueAnalysis += `\n`;
        }
      } else {
            critiqueAnalysis = `## Product Critique\n\n${JSON.stringify(critiqueResponse.data, null, 2)}`;
          }
        } catch (error) {
          critiqueAnalysis = `## Product Critique\n\n${JSON.stringify(critiqueResponse.data, null, 2)}`;
        }
      }

      // Update review with critique analysis
      if (critiqueAnalysis) {
        review += critiqueAnalysis + '\n\n';
        setOverallReview(review);
        toast.success('Product critique analysis completed!');
      }

      // Call assessmentCenter API
      const assessmentResponse = await assessmentCenter({
        analysis_board: productAnalysisData || {},
        product_critique: critiqueResponse.data,
      });

      if (!assessmentResponse.success) {
        toast.error(
          `Assessment center failed: ${assessmentResponse.error || 'Unknown error'}`
        );
        throw new Error(
          `Assessment center failed: ${assessmentResponse.error}`
        );
      }

      // Parse assessment response
      let assessmentAnalysis = '';
      if (assessmentResponse.data) {
        try {
          assessmentResponseParser.loadFromObject(assessmentResponse.data);

          if (assessmentResponseParser.isLoaded()) {
            // Generate structured assessment analysis
            const analysis = assessmentResponseParser.getAnalysis();
            const scores = assessmentResponseParser.getScores();
            const rationale = assessmentResponseParser.getRationale();

            assessmentAnalysis = `## 📈 Assessment Analysis\n\n`;
            assessmentAnalysis += `### 🏆 Overall Performance\n\n`;
            assessmentAnalysis += `| Metric | Score | Grade |\n`;
            assessmentAnalysis += `|--------|-------|-------|\n`;
            assessmentAnalysis += `| **Overall Score** | \`${assessmentResponseParser.getOverallScore()}/100\` | \`${analysis.grade}\` |\n`;
            assessmentAnalysis += `| **Average Score** | \`${analysis.averageScore.toFixed(1)}/100\` | - |\n\n`;

            // Score breakdown
            if (scores) {
              assessmentAnalysis += `### 📊 Detailed Score Breakdown\n\n`;
              assessmentAnalysis += `| Rank | Category | Score | Status |\n`;
              assessmentAnalysis += `|------|----------|-------|--------|\n`;
              analysis.scoreRanking.forEach((item, index) => {
                const emoji =
                  item.score >= 80 ? '🟢' : item.score >= 60 ? '🟡' : '🔴';
                const status =
                  item.score >= 80
                    ? 'Excellent'
                    : item.score >= 60
                      ? 'Good'
                      : 'Needs Improvement';
                assessmentAnalysis += `| ${index + 1} | **${item.category.replace(/_/g, ' ').toUpperCase()}** | \`${item.score}/100\` | ${emoji} ${status} |\n`;
              });
              assessmentAnalysis += `\n`;
            }

            // Detailed rationale
            if (rationale) {
              assessmentAnalysis += `### 📝 Detailed Analysis\n\n`;
              Object.entries(rationale).forEach(([category, rationaleText]) => {
                const score = scores?.[category as keyof typeof scores] || 0;
                const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
                assessmentAnalysis += `#### ${category.replace(/_/g, ' ').toUpperCase()} ${emoji} \`${score}/100\`\n\n`;
                assessmentAnalysis += `> ${rationaleText}\n\n`;
                assessmentAnalysis += `---\n\n`;
              });
            }

            // Areas needing improvement
            const needsImprovement =
              assessmentResponseParser.getCategoriesNeedingImprovement();
            if (needsImprovement.length > 0) {
              assessmentAnalysis += `### ⚠️ Priority Improvement Areas\n\n`;
              assessmentAnalysis += `| Category | Current Score | Priority |\n`;
              assessmentAnalysis += `|----------|---------------|----------|\n`;
              needsImprovement.forEach(item => {
                assessmentAnalysis += `| **${item.category.replace(/_/g, ' ').toUpperCase()}** | \`${item.score}/100\` | 🔴 High |\n`;
              });
              assessmentAnalysis += `\n`;
            }
          } else {
            assessmentAnalysis = `## Assessment Results\n\n${JSON.stringify(assessmentResponse.data, null, 2)}`;
          }
        } catch (error) {
          assessmentAnalysis = `## Assessment Results\n\n${JSON.stringify(assessmentResponse.data, null, 2)}`;
        }
      }

      // Update review with assessment analysis
      if (assessmentAnalysis) {
        review += assessmentAnalysis + '\n\n';
        setOverallReview(review);
        toast.success('Assessment analysis completed!');
      }

      // Store review results in history if currentHistoryId is available
      if (currentHistoryId && review) {
        HistoryManager.updateEntryResults(currentHistoryId, {
          reviewResults: review,
          uiState: {
            overallReview: review,
          },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Review generation failed: ${errorMessage}`);

      // Fallback to simple review
      const filledFields = Object.keys(analysisData).filter(key => {
        const field = analysisData[key as keyof AnalysisData];
        return (
          field &&
          field.value &&
          typeof field.value === 'string' &&
          field.value.trim() !== ''
        );
      });

      const completeness = (filledFields.length / 6) * 100;
      const review = `## Analysis Review\n\n**Completeness: ${Math.round(completeness)}%** (${filledFields.length}/6 fields completed)\n\nFields completed: ${filledFields.join(', ')}\n\n*Note: AI analysis unavailable - showing basic review*`;
      
      setOverallReview(review);

      // Store fallback review results in history if currentHistoryId is available
      if (currentHistoryId && review) {
        HistoryManager.updateEntryResults(currentHistoryId, {
          reviewResults: review,
          uiState: {
            overallReview: review,
          },
        });
      }
    } finally {
      setIsReviewing(false);
    }
  };

  // Show loading state when generating analysis and no data is loaded yet
  if (isGenerating && !isProductAnalysisLoaded) {
    return (
      <div className='max-w-4xl mx-auto space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
              Generating Analysis
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
                Creating Feature Analysis
          </h3>
              <p className='text-sm text-muted-foreground max-w-sm mb-4'>
                Analyzing your requirements and generating comprehensive feature
                analysis...
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

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* Sticky Header with Review Button and Undo/Redo */}
      <div className='sticky top-[3.5rem] z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 py-4 lg:py-6 -mx-4 px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='flex-1 min-w-0'>
              <h1 className='text-xl lg:text-2xl font-medium'>
                Feature Analysis
              </h1>
              <p className='text-muted-foreground text-sm lg:text-base'>
                Complete your feature analysis with AI assistance
                {isProductAnalysisLoaded && (
                  <span className='ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded'>
                    Data Loaded
                  </span>
                )}
              </p>
              <p className='text-xs text-muted-foreground mt-1 hidden lg:block'>
                Press Ctrl+Z to undo • Ctrl+Y to redo • Click the magic wand ✨
                to improve any field
              </p>
            </div>
            
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-2'>
              {/* UI and Review buttons */}
              <div className='flex items-center gap-1'>
                {onGenerateUI && (
                  <Button
                    onClick={handleGenerateUI}
                    className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground'
                    size='sm'
                  >
                    <Smartphone className='w-4 h-4' />
                    UI
                  </Button>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleOverallReview}
                        className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground'
                        size='sm'
                        disabled={!isAllRequiredFieldsFilled()}
                      >
                        <Sparkles className='w-4 h-4' />
                        Review
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isAllRequiredFieldsFilled() 
                      ? 'Complete all required fields (*) to use review function'
                      : 'Generate comprehensive analysis review'}
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Undo/Redo buttons */}
              {(currentVersionIndex > 0 ||
                currentVersionIndex < versionHistory.length - 1) && (
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleUndo}
                    disabled={currentVersionIndex <= 0}
                    className='h-8 w-8 p-0'
                    title='Undo (Ctrl+Z)'
                  >
                    <Undo2 className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleRedo}
                    disabled={currentVersionIndex >= versionHistory.length - 1}
                    className='h-8 w-8 p-0'
                    title='Redo (Ctrl+Y)'
                  >
                    <Redo2 className='w-4 h-4' />
                  </Button>
                </div>
              )}

              {/* Copy and Export buttons */}
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={updateFromProductAnalysisReader}
                  className='h-8 w-8 p-0'
                  title='Refresh from Analysis'
                  disabled={!isProductAnalysisLoaded}
                >
                  <Sparkles className='w-4 h-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCopyAnalysis}
                  className='h-8 w-8 p-0'
                  title='Copy Analysis'
                >
                  <Copy className='w-4 h-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportAsDoc}
                  className='h-8 w-8 p-0'
                  title='Export Analysis'
                >
                  <Download className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {currentHistoryEntry && (
        <Card className='bg-muted/30 border-muted-foreground/20 mt-4'>
          <CardHeader
            className='cursor-pointer hover:bg-muted/50 transition-colors'
            onClick={() => setIsHistoryCardCollapsed(!isHistoryCardCollapsed)}
          >
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Sparkles className='w-5 h-5' />
                Current Analysis Idea
          </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isHistoryCardCollapsed ? 'rotate-180' : ''
                }`}
              />
            </CardTitle>
          </CardHeader>
          {!isHistoryCardCollapsed && (
            <CardContent>
              <div className='space-y-4'>
                {/* Entry Header */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary'>
                      {currentHistoryEntry.type}
                    </div>
                    <div className='px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                      {currentHistoryEntry.status}
                    </div>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {new Date(currentHistoryEntry.timestamp).toLocaleString()}
                  </span>
                </div>
                {/* Entry Prompt */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-muted-foreground'>Original Input:</h4>
                  <div className='p-3 bg-background rounded-md border'>
                    <p className='text-sm leading-relaxed'>{currentHistoryEntry.prompt}</p>
                  </div>
                </div>
                {/* Entry Metadata */}
                {currentHistoryEntry.metadata && (
                  <div className='flex gap-2 text-xs'>
                    {currentHistoryEntry.metadata.processingTime && (
                      <div className='flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20'>
                        <span className='text-blue-600'>⏱️</span>
                        <span className='text-blue-700 dark:text-blue-400 font-medium'>
                          {(currentHistoryEntry.metadata.processingTime / 1000).toFixed(1)}s
                        </span>
            </div>
                    )}
                    {currentHistoryEntry.metadata.responseSize && (
                      <div className='flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20'>
                        <span className='text-green-600'>📊</span>
                        <span className='text-green-700 dark:text-green-400 font-medium'>
                          {Math.round(currentHistoryEntry.metadata.responseSize / 1024)}KB
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Error Message */}
                {currentHistoryEntry.error && (
                  <div className='flex items-center gap-1.5 px-3 py-2 bg-red-500/10 rounded-md border border-red-500/20'>
                    <span className='text-red-500'>⚠️</span>
                    <p className='text-sm text-red-600 font-medium'>
                      {currentHistoryEntry.error}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Review Section */}
          {isReviewing && (
        <div className='mt-4 relative z-0'>
              <AIThinking 
            message='Scanning through your analysis and generating comprehensive feedback...'
            stage='reviewing'
              />
            </div>
          )}
          
          {overallReview && (
        <div className='mt-6 p-6 bg-ai-accent-muted/20 rounded-xl border border-ai-accent/20 shadow-lg'>
          <div className='prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-hr:border-border/50'>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className='text-lg font-semibold mt-4 mb-2 first:mt-0'>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className='text-base font-medium mt-3 mb-2'>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className='mb-2 text-sm leading-relaxed'>{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className='font-medium'>{children}</strong>
                ),
                em: ({ children }) => <em className='italic'>{children}</em>,
                ul: ({ children }) => (
                  <ul className='list-disc list-inside mb-2 space-y-1'>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className='list-decimal list-inside mb-2 space-y-1'>
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className='text-sm'>{children}</li>,
                hr: () => <hr className='my-4 border-border/50' />,
                code: ({ children }) => (
                  <code className='bg-ai-accent/20 border border-ai-accent/30 px-2 py-1 rounded-md text-sm font-semibold text-ai-accent'>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className='bg-muted p-3 rounded text-xs font-mono overflow-x-auto'>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className='border-l-4 border-ai-accent pl-4 italic text-muted-foreground'>
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <table className='w-full border-collapse border border-border/50 rounded-lg overflow-hidden'>
                    {children}
                  </table>
                ),
                thead: ({ children }) => (
                  <thead className='bg-muted/50'>{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className='divide-y divide-border/50'>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className='hover:bg-muted/30 transition-colors'>
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className='px-4 py-3 text-left font-semibold text-foreground border-b border-border/50'>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className='px-4 py-3 text-sm'>{children}</td>
                ),
              }}
            >
              {overallReview}
            </ReactMarkdown>
              </div>
            </div>
          )}



      {/* Analysis Document */}
      <div className='bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-8 lg:p-10 space-y-12 shadow-lg'>
        {/* Why Section */}
        <div className='space-y-8'>
          <div className='border-b border-border/50 pb-4'>
            <h2 className='text-xl lg:text-2xl font-medium text-foreground'>
              Why
            </h2>
            <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
              Understanding the purpose and context of your feature
            </p>
          </div>
          
          <div className='space-y-8'>
            <FieldComponent
              key='productGoal'
              title='Product Goal'
              field='productGoal'
              required
              description='What are you trying to achieve with this feature? Define the intended outcome and success criteria.'
              placeholder='e.g., Create an intuitive task management system that reduces cognitive load...'
              value={analysisData.productGoal.value}
              onChange={value => handleFieldUpdate('productGoal', value)}
              isAIGenerated={analysisData.productGoal.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('productGoal', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
            
            <FieldComponent
              key='businessGoal'
              title='Business Goal'
              field='businessGoal'
              description='How does this feature align with broader business objectives and strategy?'
              placeholder='e.g., Increase user engagement by 25% and reduce churn rate...'
              value={analysisData.businessGoal.value}
              onChange={value => handleFieldUpdate('businessGoal', value)}
              isAIGenerated={analysisData.businessGoal.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('businessGoal', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
            
            <FieldComponent
              key='userProblem'
              title='User Problem & Goal'
              field='userProblem'
              required
              description='What specific problem are you solving for users? What do they want to achieve?'
              placeholder='e.g., Users struggle with managing their daily tasks efficiently due to...'
              value={analysisData.userProblem.value}
              onChange={value => handleFieldUpdate('userProblem', value)}
              isAIGenerated={analysisData.userProblem.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('userProblem', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
            
            <FieldComponent
              key='assumptions'
              title='Key Assumptions & Open Questions'
              field='assumptions'
              description='What assumptions are you making about users, market, or technology? What needs validation?'
              placeholder='e.g., We assume users prefer mobile-first experience and are willing to...'
              value={analysisData.assumptions.value}
              onChange={value => handleFieldUpdate('assumptions', value)}
              isAIGenerated={analysisData.assumptions.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('assumptions', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
          </div>
        </div>

        {/* Who Section */}
        <div className='space-y-8'>
          <div className='border-b border-border/50 pb-4'>
            <h2 className='text-xl lg:text-2xl font-medium text-foreground'>
              Who
            </h2>
            <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>
              Identifying and understanding your target users
            </p>
          </div>
          
          <div className='space-y-8'>
            <FieldComponent
              key='targetUsers'
              title='Target User Segment(s)'
              field='targetUsers'
              required
              description='Who are the primary users of this feature? Include demographics, job roles, and key characteristics.'
              placeholder='e.g., Knowledge workers, product managers, and small business owners who...'
              value={analysisData.targetUsers.value}
              onChange={value => handleFieldUpdate('targetUsers', value)}
              isAIGenerated={analysisData.targetUsers.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('targetUsers', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
            
            <FieldComponent
              key='userInsights'
              title='User Insights & Data'
              field='userInsights'
              required
              description='What evidence supports your understanding of users? Include research findings, analytics, or user feedback.'
              placeholder='e.g., User research shows that 70% of our users switch between 5+ apps daily...'
              value={analysisData.userInsights.value}
              onChange={value => handleFieldUpdate('userInsights', value)}
              isAIGenerated={analysisData.userInsights.isAIGenerated}
              onMagicEdit={instruction =>
                handleMagicEdit('userInsights', instruction)
              }
              isEditing={isEditing}
              magicEditField={magicEditField}
              setMagicEditField={setMagicEditField}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
