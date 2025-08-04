/**
 * Product Analysis Reader Class
 *
 * This class provides functionality to read, parse, and analyze
 * product analysis JSON data with proper TypeScript types.
 */

// Type definitions for the JSON structure
export interface UserProblemGoal {
  problem: string;
  user_goal: string;
}

export interface UserInsight {
  insight: string;
  evidence: string;
}

export interface Scope {
  in_scope: string[];
  out_scope: string[];
  constraints: string[];
}

export interface SuccessMetric {
  name: string;
  type: 'engagement' | 'ops' | 'retention' | 'revenue';
  formula: string;
  target: string;
}

export interface ProductAnalysisData {
  product_goal: string;
  business_goal?: string;
  user_problem_goal: UserProblemGoal;
  target_segments: string[];
  user_insights_data: UserInsight[];
  scope: Scope;
  success_metrics: SuccessMetric[];
  key_assumptions_open_questions?: string;
}

export interface AnalysisSummary {
  totalInsights: number;
  totalMetrics: number;
  inScopeItems: number;
  outScopeItems: number;
  constraints: number;
  targetSegments: number;
}

export class ProductAnalysisReader {
  private data: ProductAnalysisData | null = null;
  private rawJson: string = '';

  constructor() {}

  /**
   * Load JSON data from string
   */
  public loadFromString(jsonString: string): boolean {
    try {
      this.rawJson = jsonString;
      this.data = JSON.parse(jsonString);
      this.normalizeData();
      return true;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return false;
    }
  }

  /**
   * Load JSON data from object
   */
  public loadFromObject(data: ProductAnalysisData): void {
    this.data = data;
    this.normalizeData();
    this.rawJson = JSON.stringify(data, null, 2);
  }

  /**
   * Validate the loaded data structure
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.data) {
      errors.push('No data loaded');
      return { isValid: false, errors };
    }

    // Check required fields - allow empty strings as valid
    if (
      this.data.product_goal === undefined ||
      this.data.product_goal === null
    ) {
      errors.push('Missing product_goal');
    }

    if (!this.data.user_problem_goal) {
      errors.push('Missing user_problem_goal');
    } else {
      if (
        this.data.user_problem_goal.problem === undefined ||
        this.data.user_problem_goal.problem === null
      ) {
        errors.push('Missing user_problem_goal.problem');
      }
      if (
        this.data.user_problem_goal.user_goal === undefined ||
        this.data.user_problem_goal.user_goal === null
      ) {
        errors.push('Missing user_problem_goal.user_goal');
      }
    }

    if (!Array.isArray(this.data.target_segments)) {
      errors.push('target_segments must be an array');
    }

    if (!Array.isArray(this.data.user_insights_data)) {
      errors.push('user_insights_data must be an array');
    }

    if (!this.data.scope) {
      errors.push('Missing scope');
    } else {
      if (!Array.isArray(this.data.scope.in_scope)) {
        errors.push('scope.in_scope must be an array');
      }
      if (!Array.isArray(this.data.scope.out_scope)) {
        errors.push('scope.out_scope must be an array');
      }
      if (!Array.isArray(this.data.scope.constraints)) {
        errors.push('scope.constraints must be an array');
      }
    }

    if (!Array.isArray(this.data.success_metrics)) {
      errors.push('success_metrics must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize data to ensure proper structure
   */
  public normalizeData(): void {
    if (!this.data) return;

    // Handle missing required fields
    if (!this.data.product_goal) {
      this.data.product_goal = '';
    }

    // Handle optional business_goal field
    if (!this.data.business_goal) {
      this.data.business_goal = '';
    }

    if (!this.data.user_problem_goal) {
      this.data.user_problem_goal = {
        problem: '',
        user_goal: '',
      };
    } else {
      if (!this.data.user_problem_goal.problem) {
        this.data.user_problem_goal.problem = '';
      }
      if (!this.data.user_problem_goal.user_goal) {
        this.data.user_problem_goal.user_goal = '';
      }
    }

    // Handle optional key_assumptions_open_questions field
    if (!this.data.key_assumptions_open_questions) {
      this.data.key_assumptions_open_questions = '';
    }

    // Ensure arrays exist and handle string-to-array conversion
    if (!Array.isArray(this.data.target_segments)) {
      this.data.target_segments = this.data.target_segments
        ? [this.data.target_segments]
        : [];
    }

    if (!Array.isArray(this.data.user_insights_data)) {
      this.data.user_insights_data = this.data.user_insights_data
        ? [this.data.user_insights_data]
        : [];
    }

    if (!this.data.scope) {
      this.data.scope = {
        in_scope: [],
        out_scope: [],
        constraints: [],
      };
    } else {
      if (!Array.isArray(this.data.scope.in_scope)) {
        this.data.scope.in_scope = this.data.scope.in_scope
          ? [this.data.scope.in_scope]
          : [];
      }
      if (!Array.isArray(this.data.scope.out_scope)) {
        this.data.scope.out_scope = this.data.scope.out_scope
          ? [this.data.scope.out_scope]
          : [];
      }
      if (!Array.isArray(this.data.scope.constraints)) {
        this.data.scope.constraints = this.data.scope.constraints
          ? [this.data.scope.constraints]
          : [];
      }
    }

    if (!Array.isArray(this.data.success_metrics)) {
      this.data.success_metrics = this.data.success_metrics
        ? [this.data.success_metrics]
        : [];
    }
  }

  /**
   * Get the complete data object
   */
  public getData(): ProductAnalysisData | null {
    return this.data;
  }

  /**
   * Get product goal
   */
  public getProductGoal(): string {
    return this.data?.product_goal || '';
  }

  /**
   * Get business goal
   */
  public getBusinessGoal(): string {
    return this.data?.business_goal || '';
  }

  /**
   * Get user problem and goal
   */
  public getUserProblemGoal(): UserProblemGoal | null {
    return this.data?.user_problem_goal || null;
  }

  /**
   * Get key assumptions and open questions
   */
  public getKeyAssumptionsOpenQuestions(): string {
    return this.data?.key_assumptions_open_questions || '';
  }

  /**
   * Get target segments
   */
  public getTargetSegments(): string[] {
    return this.data?.target_segments || [];
  }

  /**
   * Get user insights
   */
  public getUserInsights(): UserInsight[] {
    return this.data?.user_insights_data || [];
  }

  /**
   * Get scope information
   */
  public getScope(): Scope | null {
    return this.data?.scope || null;
  }

  /**
   * Get success metrics
   */
  public getSuccessMetrics(): SuccessMetric[] {
    return this.data?.success_metrics || [];
  }

  /**
   * Get in-scope items
   */
  public getInScopeItems(): string[] {
    return this.data?.scope?.in_scope || [];
  }

  /**
   * Get out-of-scope items
   */
  public getOutScopeItems(): string[] {
    return this.data?.scope?.out_scope || [];
  }

  /**
   * Get constraints
   */
  public getConstraints(): string[] {
    return this.data?.scope?.constraints || [];
  }

  /**
   * Get analysis summary
   */
  public getSummary(): AnalysisSummary {
    return {
      totalInsights: this.getUserInsights().length,
      totalMetrics: this.getSuccessMetrics().length,
      inScopeItems: this.getInScopeItems().length,
      outScopeItems: this.getOutScopeItems().length,
      constraints: this.getConstraints().length,
      targetSegments: this.getTargetSegments().length,
    };
  }

  /**
   * Search insights by keyword
   */
  public searchInsights(keyword: string): UserInsight[] {
    const insights = this.getUserInsights();
    return insights.filter(
      insight =>
        insight.insight.toLowerCase().includes(keyword.toLowerCase()) ||
        insight.evidence.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get metrics by type
   */
  public getMetricsByType(type: SuccessMetric['type']): SuccessMetric[] {
    return this.getSuccessMetrics().filter(metric => metric.type === type);
  }

  /**
   * Get metrics with target values
   */
  public getMetricsWithTargets(): SuccessMetric[] {
    return this.getSuccessMetrics().filter(metric => metric.target);
  }

  /**
   * Export data as formatted JSON
   */
  public exportAsJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Export data as markdown
   */
  public exportAsMarkdown(): string {
    if (!this.data) return '';

    let markdown = '# Product Analysis\n\n';

    // Product Goal
    markdown += `## Product Goal\n\n${this.data.product_goal}\n\n`;

    // User Problem & Goal
    if (this.data.user_problem_goal) {
      markdown += `## User Problem & Goal\n\n`;
      markdown += `**Problem:** ${this.data.user_problem_goal.problem}\n\n`;
      markdown += `**User Goal:** ${this.data.user_problem_goal.user_goal}\n\n`;
    }

    // Target Segments
    if (this.data.target_segments.length > 0) {
      markdown += `## Target Segments\n\n`;
      this.data.target_segments.forEach(segment => {
        markdown += `- ${segment}\n`;
      });
      markdown += '\n';
    }

    // User Insights
    if (this.data.user_insights_data.length > 0) {
      markdown += `## User Insights\n\n`;
      this.data.user_insights_data.forEach((insight, index) => {
        markdown += `### Insight ${index + 1}\n\n`;
        markdown += `**Insight:** ${insight.insight}\n\n`;
        markdown += `**Evidence:** ${insight.evidence}\n\n`;
      });
    }

    // Scope
    if (this.data.scope) {
      markdown += `## Scope\n\n`;

      if (this.data.scope.in_scope.length > 0) {
        markdown += `### In Scope\n\n`;
        this.data.scope.in_scope.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      if (this.data.scope.out_scope.length > 0) {
        markdown += `### Out of Scope\n\n`;
        this.data.scope.out_scope.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      if (this.data.scope.constraints.length > 0) {
        markdown += `### Constraints\n\n`;
        this.data.scope.constraints.forEach(constraint => {
          markdown += `- ${constraint}\n`;
        });
        markdown += '\n';
      }
    }

    // Success Metrics
    if (this.data.success_metrics.length > 0) {
      markdown += `## Success Metrics\n\n`;
      this.data.success_metrics.forEach(metric => {
        markdown += `### ${metric.name}\n\n`;
        markdown += `- **Type:** ${metric.type}\n`;
        markdown += `- **Formula:** ${metric.formula}\n`;
        markdown += `- **Target:** ${metric.target}\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Export data as CSV
   */
  public exportAsCsv(): string {
    if (!this.data) return '';

    let csv = 'Type,Name,Value\n';

    // Product Goal
    csv += `Product Goal,Goal,"${this.data.product_goal}"\n`;

    // User Problem & Goal
    if (this.data.user_problem_goal) {
      csv += `User Problem,Problem,"${this.data.user_problem_goal.problem}"\n`;
      csv += `User Goal,Goal,"${this.data.user_problem_goal.user_goal}"\n`;
    }

    // Target Segments
    this.data.target_segments.forEach(segment => {
      csv += `Target Segment,Segment,"${segment}"\n`;
    });

    // User Insights
    this.data.user_insights_data.forEach((insight, index) => {
      csv += `User Insight ${index + 1},Insight,"${insight.insight}"\n`;
      csv += `User Insight ${index + 1},Evidence,"${insight.evidence}"\n`;
    });

    // Success Metrics
    this.data.success_metrics.forEach(metric => {
      csv += `Success Metric,${metric.name},Type: ${metric.type}, Formula: ${metric.formula}, Target: ${metric.target}\n`;
    });

    return csv;
  }

  /**
   * Check if data is loaded
   */
  public isLoaded(): boolean {
    return this.data !== null;
  }

  /**
   * Clear loaded data
   */
  public clear(): void {
    this.data = null;
    this.rawJson = '';
  }

  /**
   * Get raw JSON string
   */
  public getRawJson(): string {
    return this.rawJson;
  }
}

// Create singleton instance
export const productAnalysisReader = new ProductAnalysisReader();

// Export convenience functions
export const reader = {
  loadFromString: (jsonString: string) =>
    productAnalysisReader.loadFromString(jsonString),
  loadFromObject: (data: ProductAnalysisData) =>
    productAnalysisReader.loadFromObject(data),
  validate: () => productAnalysisReader.validate(),
  getData: () => productAnalysisReader.getData(),
  getProductGoal: () => productAnalysisReader.getProductGoal(),
  getUserProblemGoal: () => productAnalysisReader.getUserProblemGoal(),
  getTargetSegments: () => productAnalysisReader.getTargetSegments(),
  getUserInsights: () => productAnalysisReader.getUserInsights(),
  getScope: () => productAnalysisReader.getScope(),
  getSuccessMetrics: () => productAnalysisReader.getSuccessMetrics(),
  getSummary: () => productAnalysisReader.getSummary(),
  searchInsights: (keyword: string) =>
    productAnalysisReader.searchInsights(keyword),
  getMetricsByType: (type: SuccessMetric['type']) =>
    productAnalysisReader.getMetricsByType(type),
  exportAsJson: () => productAnalysisReader.exportAsJson(),
  exportAsMarkdown: () => productAnalysisReader.exportAsMarkdown(),
  exportAsCsv: () => productAnalysisReader.exportAsCsv(),
  isLoaded: () => productAnalysisReader.isLoaded(),
  clear: () => productAnalysisReader.clear(),
};

export default productAnalysisReader;
