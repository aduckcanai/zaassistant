import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ProductAnalysisData } from './ProductAnalysisReader';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert UI AnalysisData to API ProductAnalysisData format
export function convertUIToAPIData(analysisData: any): ProductAnalysisData {
  // Parse user problem field
  let userProblemGoal = { problem: '', user_goal: '' };
  if (analysisData.userProblem?.value) {
    const lines = analysisData.userProblem.value.split('\n');
    const problemLine = lines.find((line: string) => line.startsWith('Problem:'));
    const goalLine = lines.find((line: string) => line.startsWith('User Goal:'));
    
    if (problemLine) {
      userProblemGoal.problem = problemLine.replace('Problem:', '').trim();
    }
    if (goalLine) {
      userProblemGoal.user_goal = goalLine.replace('User Goal:', '').trim();
    }
  }

  // Parse user insights field
  const userInsightsData = [];
  if (analysisData.userInsights?.value) {
    const insights = analysisData.userInsights.value.split('\n\n');
    for (const insight of insights) {
      const parts = insight.split(': ');
      if (parts.length >= 2) {
        userInsightsData.push({
          insight: parts[0].trim(),
          evidence: parts.slice(1).join(': ').trim(),
        });
      }
    }
  }

  // Parse target segments
  const targetSegments = analysisData.targetUsers?.value
    ? analysisData.targetUsers.value.split(',').map((s: string) => s.trim())
    : [];

  return {
    product_goal: analysisData.productGoal?.value || '',
    business_goal: analysisData.businessGoal?.value || '',
    user_problem_goal: userProblemGoal,
    target_segments: targetSegments,
    user_insights_data: userInsightsData,
    scope: {
      in_scope: [],
      out_scope: [],
      constraints: [],
    },
    success_metrics: [],
    key_assumptions_open_questions: analysisData.assumptions?.value || '',
  };
}

// Convert API field name to UI field name
export function convertAPIFieldNameToUI(fieldName: string): string {
  const fieldMapping: Record<string, string> = {
    'product_goal': 'productGoal',
    'business_goal': 'businessGoal',
    'user_problem_goal': 'userProblem',
    'target_segments': 'targetUsers',
    'user_insights_data': 'userInsights',
    'key_assumptions_open_questions': 'assumptions',
  };
  
  return fieldMapping[fieldName] || fieldName;
}

// Convert UI field name to API field name
export function convertUIFieldNameToAPI(fieldName: string): string {
  const fieldMapping: Record<string, string> = {
    'productGoal': 'product_goal',
    'businessGoal': 'business_goal',
    'userProblem': 'user_problem_goal',
    'targetUsers': 'target_segments',
    'userInsights': 'user_insights_data',
    'assumptions': 'key_assumptions_open_questions',
  };
  
  return fieldMapping[fieldName] || fieldName;
}
