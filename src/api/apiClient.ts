// src/api/apiClient.ts

import { type ProductAnalysisData } from '../lib/ProductAnalysisReader';
import { logger } from '../lib/logger';

const ROOT_URL = 'https://be-zaassistant.vercel.app/api';
const BASE_URL = ROOT_URL;

// Types for API requests and responses
export interface IdeaToAnalysisRequest {
  idea: string;
  context: string;
}

export interface ProductCritiqueRequest {
  analysis_board: any;
}

export interface AssessmentCenterRequest {
  analysis_board: any;
  product_critique: any;
}

export interface SolutionArchitectRequest {
  analysis_board: any;
}

export interface SolutionToUIRequest {
  problem_statement: string;
  selected_approach?: {
    approach_name: string;
    description: string;
    core_tradeoff: string;
    key_benefits: string[];
    implementation_risk_analysis: Array<{
      risk: string;
      mitigation_idea: string;
      resulting_tradeoff: string;
    }>;
  };
}

export interface UpdateAnalysisFieldRequest {
  analysis_board: {
    product_goal: string;
    business_goal?: string;
    user_problem_goal: {
      problem: string;
      user_goal: string;
    };
    target_segments: string[];
    user_insights_data: Array<{
      insight: string;
      evidence: string;
    }>;
    scope: {
      in_scope: string[];
      out_scope: string[];
      constraints: string[];
    };
    success_metrics: Array<{
      name: string;
      type: 'engagement' | 'ops' | 'retention' | 'revenue';
      formula: string;
      target: string;
    }>;
    key_assumptions_open_questions?: string;
  };
  field_name: string;
  updated_field: {
    instruction?: string;
    [key: string]: any;
  };
}

export interface UpdateAnalysisFieldResponse {
  id: string;
  field_name: string;
  updated_value: {
    problem?: string;
    user_goal?: string;
    [key: string]: any;
  };
}

// Types for sample prompts
export interface SamplePrompt {
  id: string;
  title: string;
  description: string;
}

export interface SamplePromptsResponse {
  prompts: SamplePrompt[];
  total: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  retryDelay: 1000, // 1 second delay between retries
};

// Retry wrapper function - immediate retry without delay
async function withRetry<T>(
  operation: () => Promise<APIResponse<T>>,
  endpoint: string,
  requestId: string
): Promise<APIResponse<T>> {
  let lastError: any;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries + 1; attempt++) {
    try {
      const result = await operation();

      // If the result has success: false, retry after delay
      if (!result.success && attempt <= RETRY_CONFIG.maxRetries) {
        logger.warn(`API Request Retry`, {
          endpoint,
          requestId,
          attempt,
          maxRetries: RETRY_CONFIG.maxRetries,
          error: result.error,
          willRetry: true,
        });

        // Wait 1 second before retrying
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_CONFIG.retryDelay)
        );
        continue;
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt <= RETRY_CONFIG.maxRetries) {
        logger.warn(`API Request Retry`, {
          endpoint,
          requestId,
          attempt,
          maxRetries: RETRY_CONFIG.maxRetries,
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          willRetry: true,
        });

        // Wait 1 second before retrying
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_CONFIG.retryDelay)
        );
        continue;
      }

      // If we've exhausted retries or error shouldn't be retried
      break;
    }
  }

  // If we get here, all retries failed
  const errorMessage =
    lastError instanceof Error ? lastError.message : String(lastError);

  logger.error(`API Request Failed After Retries`, {
    endpoint,
    requestId,
    maxRetries: RETRY_CONFIG.maxRetries,
    error: errorMessage,
    errorType:
      lastError instanceof Error
        ? lastError.constructor.name
        : typeof lastError,
  });

  return {
    success: false,
    error: errorMessage,
  };
}

// Generic POST function with error handling and retry logic
async function postJSON<T>(
  endpoint: string,
  payload: any
): Promise<APIResponse<T>> {
  const requestId = Math.random().toString(36).substring(2, 15);

  console.log('🔍 postJSON Debug:', {
    endpoint,
    requestId,
    url: `${BASE_URL}/${endpoint}`,
    payload,
  });

  const operation = async (): Promise<APIResponse<T>> => {
    try {
      logger.info(`API Request Started`, {
        endpoint,
        requestId,
        payloadSize: JSON.stringify(payload).length,
        payload: payload,
        timestamp: new Date().toISOString(),
      });

      const startTime = performance.now();

      console.log('🔍 Making HTTP request to:', `${BASE_URL}/${endpoint}`);

      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log('🔍 HTTP Response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        duration: `${duration}ms`,
      });

      logger.info(`API Response Received`, {
        endpoint,
        requestId,
        status: res.status,
        statusText: res.statusText,
        duration: `${duration}ms`,
        success: res.ok,
      });

      if (!res.ok) {
        const errorMessage = `API error: ${res.status} - ${res.statusText}`;
        logger.error(`API Request Failed`, {
          endpoint,
          requestId,
          status: res.status,
          statusText: res.statusText,
          duration: `${duration}ms`,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await res.json();

      console.log('🔍 Response data:', data);

      logger.info(`API Request Successful`, {
        endpoint,
        requestId,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(data).length,
        responseData: data,
        hasData: !!data,
      });

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error('🔍 API Error:', error);

      logger.error(`API Request Exception`, {
        endpoint,
        requestId,
        error: errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return withRetry(operation, endpoint, requestId);
}

// Analysis API
export async function ideaToAnalysis(
  inputData: IdeaToAnalysisRequest
): Promise<APIResponse<{ analysis_board: ProductAnalysisData }>> {
  logger.info(`ideaToAnalysis called`, {
    inputData,
    idea: inputData.idea,
    context: inputData.context,
    ideaLength: inputData.idea.length,
    contextLength: inputData.context.length,
  });

  const response = await postJSON<{ analysis_board: ProductAnalysisData }>(
    'idea_to_analysis',
    {
      inputData: JSON.stringify(inputData),
    }
  );

  logger.info(`ideaToAnalysis completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    analysisBoardKeys: response.data?.analysis_board
      ? Object.keys(response.data.analysis_board)
      : [],
    error: response.error,
  });

  return response;
}

// Product critique API
export async function productCritique(
  request: ProductCritiqueRequest
): Promise<APIResponse<any>> {
  logger.info(`productCritique called`, {
    request,
    analysisBoardKeys: request.analysis_board
      ? Object.keys(request.analysis_board)
      : [],
    analysisBoardSize: JSON.stringify(request.analysis_board).length,
  });

  const response = await postJSON('product_critique', request);

  logger.info(`productCritique completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Assessment center API
export async function assessmentCenter(
  request: AssessmentCenterRequest
): Promise<APIResponse<any>> {
  logger.info(`assessmentCenter called`, {
    request,
    analysisBoardKeys: request.analysis_board
      ? Object.keys(request.analysis_board)
      : [],
    productCritiqueKeys: request.product_critique
      ? Object.keys(request.product_critique)
      : [],
    analysisBoardSize: JSON.stringify(request.analysis_board).length,
    productCritiqueSize: JSON.stringify(request.product_critique).length,
  });

  const response = await postJSON('assessment_center', request);

  logger.info(`assessmentCenter completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Solution architect API
export async function solutionArchitect(
  request: SolutionArchitectRequest
): Promise<APIResponse<any>> {
  logger.info(`solutionArchitect called`, {
    request,
    analysisBoardKeys: request.analysis_board
      ? Object.keys(request.analysis_board)
      : [],
    analysisBoardSize: JSON.stringify(request.analysis_board).length,
  });

  const response = await postJSON('solution_architect', request);

  logger.info(`solutionArchitect completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Solution to UI API
export async function solutionToUI(
  request: SolutionToUIRequest
): Promise<APIResponse<any>> {
  logger.info(`solutionToUI called`, {
    request,
    problemStatement: request.problem_statement,
    approachName: request.selected_approach?.approach_name,
    keyBenefitsCount: request.selected_approach?.key_benefits.length,
    riskAnalysisCount:
      request.selected_approach?.implementation_risk_analysis.length,
  });

  const response = await postJSON('solution_to_ui', request);

  logger.info(`solutionToUI completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Simplified Solution to UI API - only requires a prompt
export async function solutionToUIFromPrompt(
  prompt: string
): Promise<APIResponse<any>> {
  logger.info(`solutionToUIFromPrompt called`, {
    prompt,
    promptLength: prompt.length,
  });

  // Create a simplified request structure
  const request: SolutionToUIRequest = {
    problem_statement: prompt,
  };

  const response = await postJSON('solution_to_ui', request);

  logger.info(`solutionToUIFromPrompt completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Additional API endpoints that might be useful

export async function mobilePrototype(
  type: string,
  variant: string
): Promise<APIResponse<any>> {
  logger.info(`mobilePrototype called`, {
    type,
    variant,
  });

  const response = await postJSON('mobile_prototype', {
    inputData: JSON.stringify({
      type,
      variant,
      features: [],
    }),
  });

  logger.info(`mobilePrototype completed`, {
    success: response.success,
    hasData: !!response.data,
    dataKeys: response.data ? Object.keys(response.data) : [],
    error: response.error,
  });

  return response;
}

// Health check function with retry logic
export async function healthCheck(): Promise<APIResponse<any>> {
  const requestId = Math.random().toString(36).substring(2, 15);

  const operation = async (): Promise<APIResponse<any>> => {
    try {
      logger.info(`Health Check Started`, {
        requestId,
        url: `${BASE_URL.replace('/responses', '')}/health`,
        timestamp: new Date().toISOString(),
      });

      const startTime = performance.now();
      const res = await fetch(`${BASE_URL.replace('/responses', '')}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      logger.info(`Health Check Response`, {
        requestId,
        status: res.status,
        statusText: res.statusText,
        duration: `${duration}ms`,
        success: res.ok,
      });

      if (!res.ok) {
        const errorMessage = `Health check failed: ${res.status}`;
        logger.error(`Health Check Failed`, {
          requestId,
          status: res.status,
          statusText: res.statusText,
          duration: `${duration}ms`,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await res.json();

      logger.info(`Health Check Successful`, {
        requestId,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(data).length,
        responseData: data,
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error(`Health Check Exception`, {
        requestId,
        error: errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return withRetry(operation, 'health', requestId);
}

// Sample prompts API with retry logic
export async function getSamplePrompts(): Promise<
  APIResponse<SamplePromptsResponse>
> {
  const requestId = Math.random().toString(36).substring(2, 15);

  const operation = async (): Promise<APIResponse<SamplePromptsResponse>> => {
    try {
      logger.info(`Sample Prompts Request Started`, {
        requestId,
        url: `${ROOT_URL}/sample-prompts`,
        timestamp: new Date().toISOString(),
      });

      const startTime = performance.now();
      const res = await fetch(`${ROOT_URL}/sample-prompts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      logger.info(`Sample Prompts Response`, {
        requestId,
        status: res.status,
        statusText: res.statusText,
        duration: `${duration}ms`,
        success: res.ok,
      });

      if (!res.ok) {
        const errorMessage = `Sample prompts fetch failed: ${res.status}`;
        logger.error(`Sample Prompts Request Failed`, {
          requestId,
          status: res.status,
          statusText: res.statusText,
          duration: `${duration}ms`,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await res.json();

      logger.info(`Sample Prompts Request Successful`, {
        requestId,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(data).length,
        responseData: data,
        totalPrompts: data.total,
        promptsCount: data.prompts?.length || 0,
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error(`Sample Prompts Request Exception`, {
        requestId,
        error: errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return withRetry(operation, 'sample-prompts', requestId);
}

// Update analysis field API
export async function updateAnalysisField(
  request: UpdateAnalysisFieldRequest
): Promise<APIResponse<UpdateAnalysisFieldResponse>> {
  const requestId = Math.random().toString(36).substring(2, 15);

  console.log('🔍 API Client Debug - updateAnalysisField called:', {
    requestId,
    fieldName: request.field_name,
    analysisBoardKeys: Object.keys(request.analysis_board),
    request: request,
  });

  logger.info(`updateAnalysisField called`, {
    requestId,
    fieldName: request.field_name,
    analysisBoardKeys: Object.keys(request.analysis_board),
  });

  const response = await postJSON<UpdateAnalysisFieldResponse>(
    'field-edit',
    request
  );

  console.log('🔍 API Client Debug - updateAnalysisField response:', response);

  logger.info(`updateAnalysisField completed`, {
    requestId,
    success: response.success,
    hasData: !!response.data,
    fieldName: response.data?.field_name,
    error: response.error,
  });

  return response;
}

// Export all API functions
export const apiClient = {
  ideaToAnalysis,
  productCritique,
  assessmentCenter,
  solutionArchitect,
  solutionToUI,
  solutionToUIFromPrompt,
  mobilePrototype,
  healthCheck,
  getSamplePrompts,
  updateAnalysisField,
};

export default apiClient;
