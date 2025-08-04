// src/lib/SolutionArchitectResponseParser.ts

export interface RiskTradeoffAnalysis {
  risk: string;
  mitigation_idea: string;
  resulting_tradeoff: string;
}

export interface SolutionAnalysis {
  approach_name: string;
  description: string;
  core_tradeoff?: string;
  key_benefits?: string[];
  pros?: string[];
  implementation_risk_analysis?: RiskTradeoffAnalysis[];
  risk_tradeoff_analysis?: RiskTradeoffAnalysis[];
  [key: string]: any; // Allow additional properties for flexibility
}

export interface EvaluationTableEntry {
  approach_name: string;
  impact_score: string;
  effort_score: string;
  confidence_score: string;
}

export interface ComparisonSummary {
  evaluation_table?: EvaluationTableEntry[];
  prioritization_matrix?: EvaluationTableEntry[];
  heuristic_evaluation?: any[];
  recommendation: string;
}

export interface SolutionArchitectResponse {
  problem_statement: string;
  solution_analysis: SolutionAnalysis[];
  comparison_summary: ComparisonSummary;
}

export class SolutionArchitectResponseParser {
  private data: SolutionArchitectResponse | null = null;
  private isLoadedFlag = false;

  /**
   * Load data from a JSON object
   */
  loadFromObject(data: any): void {
    try {
      this.validateData(data);
      this.data = data as SolutionArchitectResponse;
      this.isLoadedFlag = true;
    } catch (error) {
      this.isLoadedFlag = false;
      throw new Error(
        `Failed to load solution architect data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.isLoadedFlag && this.data !== null;
  }

  /**
   * Get the complete response data
   */
  getData(): SolutionArchitectResponse | null {
    return this.isLoaded() ? this.data : null;
  }

  /**
   * Get the problem statement
   */
  getProblemStatement(): string {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return this.data!.problem_statement;
  }

  /**
   * Get all solution analyses
   */
  getSolutionAnalyses(): SolutionAnalysis[] {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return this.data!.solution_analysis;
  }

  /**
   * Get a specific solution analysis by approach name
   */
  getSolutionAnalysis(approachName: string): SolutionAnalysis | null {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return (
      this.data!.solution_analysis.find(
        analysis => analysis.approach_name === approachName
      ) || null
    );
  }

  /**
   * Clear loaded data
   */
  clear(): void {
    this.data = null;
    this.isLoadedFlag = false;
  }

  /**
   * Get all approach names
   */
  getApproachNames(): string[] {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return this.data!.solution_analysis.map(analysis => analysis.approach_name);
  }

  /**
   * Get the comparison summary
   */
  getComparisonSummary(): ComparisonSummary {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return this.data!.comparison_summary;
  }

  /**
   * Get the recommendation
   */
  getRecommendation(): string {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return this.data!.comparison_summary.recommendation;
  }

  /**
   * Get the evaluation table
   */
  getEvaluationTable(): EvaluationTableEntry[] {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    return (
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      []
    );
  }

  /**
   * Get evaluation for a specific approach
   */
  getApproachEvaluation(approachName: string): EvaluationTableEntry | null {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }
    const evaluationTable =
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      [];
    return (
      evaluationTable.find(entry => entry.approach_name === approachName) ||
      null
    );
  }

  /**
   * Get the highest impact approach
   */
  getHighestImpactApproach(): string | null {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    const evaluationTable =
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      [];
    const highImpactApproaches = evaluationTable
      .filter(
        entry =>
          entry.impact_score === 'High' ||
          entry.impact_score === 'Potentially High'
      )
      .sort((a, b) => {
        const scoreMap = { High: 3, 'Potentially High': 2, Medium: 1, Low: 0 };
        return (
          scoreMap[b.impact_score as keyof typeof scoreMap] -
          scoreMap[a.impact_score as keyof typeof scoreMap]
        );
      });

    return highImpactApproaches.length > 0
      ? highImpactApproaches[0].approach_name
      : null;
  }

  /**
   * Get the lowest effort approach
   */
  getLowestEffortApproach(): string | null {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    const evaluationTable =
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      [];
    const lowEffortApproaches = evaluationTable
      .filter(entry => entry.effort_score === 'Low')
      .sort((a, b) => {
        const scoreMap = { Low: 0, Medium: 1, High: 2 };
        return (
          scoreMap[a.effort_score as keyof typeof scoreMap] -
          scoreMap[b.effort_score as keyof typeof scoreMap]
        );
      });

    return lowEffortApproaches.length > 0
      ? lowEffortApproaches[0].approach_name
      : null;
  }

  /**
   * Get the highest confidence approach
   */
  getHighestConfidenceApproach(): string | null {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    const evaluationTable =
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      [];
    const highConfidenceApproaches = evaluationTable
      .filter(entry => entry.confidence_score === 'High')
      .sort((a, b) => {
        const scoreMap = { High: 3, Medium: 2, Low: 1 };
        return (
          scoreMap[b.confidence_score as keyof typeof scoreMap] -
          scoreMap[a.confidence_score as keyof typeof scoreMap]
        );
      });

    return highConfidenceApproaches.length > 0
      ? highConfidenceApproaches[0].approach_name
      : null;
  }

  /**
   * Get all risks for a specific approach
   */
  getApproachRisks(approachName: string): RiskTradeoffAnalysis[] {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    const analysis = this.getSolutionAnalysis(approachName);
    return analysis
      ? analysis.risk_tradeoff_analysis ||
          analysis.implementation_risk_analysis ||
          []
      : [];
  }

  /**
   * Get all pros for a specific approach
   */
  getApproachPros(approachName: string): string[] {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    const analysis = this.getSolutionAnalysis(approachName);
    return analysis ? analysis.pros || analysis.key_benefits || [] : [];
  }

  /**
   * Export data as markdown
   */
  exportAsMarkdown(): string {
    if (!this.isLoaded()) {
      throw new Error('Data not loaded. Call loadFromObject() first.');
    }

    let markdown = `# 🏗️ Solution Architect Analysis\n\n`;

    // Problem Statement
    markdown += `## 📋 Problem Statement\n\n`;
    markdown += `${this.data!.problem_statement}\n\n`;
    markdown += `---\n\n`;

    // Solution Analyses
    markdown += `## 🎯 Solution Approaches\n\n`;

    this.data!.solution_analysis.forEach((analysis, index) => {
      markdown += `### ${index + 1}. ${analysis.approach_name}\n\n`;
      markdown += `**Description:** ${analysis.description}\n\n`;

      // Pros
      markdown += `#### ✅ Advantages\n\n`;
      const pros = analysis.pros || analysis.key_benefits || [];
      pros.forEach((pro, proIndex) => {
        markdown += `${proIndex + 1}. ${pro}\n`;
      });
      markdown += `\n`;

      // Risk Analysis
      markdown += `#### ⚠️ Risk Analysis\n\n`;
      const risks =
        analysis.risk_tradeoff_analysis ||
        analysis.implementation_risk_analysis ||
        [];
      risks.forEach((risk, riskIndex) => {
        markdown += `**Risk ${riskIndex + 1}:** ${risk.risk}\n\n`;
        markdown += `**Mitigation:** ${risk.mitigation_idea}\n\n`;
        markdown += `**Trade-off:** ${risk.resulting_tradeoff}\n\n`;
        markdown += `---\n\n`;
      });
    });

    // Comparison Summary
    markdown += `## 📊 Comparison Summary\n\n`;

    // Evaluation Table
    markdown += `### 📈 Evaluation Matrix\n\n`;
    markdown += `| Approach | Impact | Effort | Confidence |\n`;
    markdown += `|----------|--------|--------|------------|\n`;

    const evaluationTable =
      this.data!.comparison_summary.evaluation_table ||
      this.data!.comparison_summary.prioritization_matrix ||
      [];
    evaluationTable.forEach(entry => {
      markdown += `| **${entry.approach_name}** | \`${entry.impact_score}\` | \`${entry.effort_score}\` | \`${entry.confidence_score}\` |\n`;
    });
    markdown += `\n`;

    // Recommendation
    markdown += `### 🎯 Recommendation\n\n`;
    markdown += `${this.data!.comparison_summary.recommendation}\n\n`;

    return markdown;
  }

  /**
   * Validate the data structure
   */
  private validateData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a non-null object');
    }

    if (typeof data.problem_statement !== 'string') {
      throw new Error('problem_statement must be a string');
    }

    if (!Array.isArray(data.solution_analysis)) {
      throw new Error('solution_analysis must be an array');
    }

    data.solution_analysis.forEach((analysis: any, index: number) => {
      if (typeof analysis !== 'object' || analysis === null) {
        throw new Error(`solution_analysis[${index}] must be an object`);
      }

      if (typeof analysis.approach_name !== 'string') {
        throw new Error(
          `solution_analysis[${index}].approach_name must be a string`
        );
      }

      if (typeof analysis.description !== 'string') {
        throw new Error(
          `solution_analysis[${index}].description must be a string`
        );
      }

      // Check for pros or key_benefits
      const pros = analysis.pros || analysis.key_benefits;
      if (pros && !Array.isArray(pros)) {
        throw new Error(
          `solution_analysis[${index}].pros or key_benefits must be an array`
        );
      }

      if (pros) {
        pros.forEach((pro: any, proIndex: number) => {
          if (typeof pro !== 'string') {
            throw new Error(
              `solution_analysis[${index}].pros/key_benefits[${proIndex}] must be a string`
            );
          }
        });
      }

      // Check for risk_tradeoff_analysis or implementation_risk_analysis
      const risks =
        analysis.risk_tradeoff_analysis ||
        analysis.implementation_risk_analysis;
      if (risks && !Array.isArray(risks)) {
        throw new Error(
          `solution_analysis[${index}].risk_tradeoff_analysis or implementation_risk_analysis must be an array`
        );
      }

      if (risks) {
        risks.forEach((risk: any, riskIndex: number) => {
          if (typeof risk !== 'object' || risk === null) {
            throw new Error(
              `solution_analysis[${index}].risk_tradeoff_analysis/implementation_risk_analysis[${riskIndex}] must be an object`
            );
          }

          if (typeof risk.risk !== 'string') {
            throw new Error(
              `solution_analysis[${index}].risk_tradeoff_analysis/implementation_risk_analysis[${riskIndex}].risk must be a string`
            );
          }

          if (typeof risk.mitigation_idea !== 'string') {
            throw new Error(
              `solution_analysis[${index}].risk_tradeoff_analysis/implementation_risk_analysis[${riskIndex}].mitigation_idea must be a string`
            );
          }

          if (typeof risk.resulting_tradeoff !== 'string') {
            throw new Error(
              `solution_analysis[${index}].risk_tradeoff_analysis/implementation_risk_analysis[${riskIndex}].resulting_tradeoff must be a string`
            );
          }
        });
      }
    });

    if (
      !data.comparison_summary ||
      typeof data.comparison_summary !== 'object'
    ) {
      throw new Error('comparison_summary must be an object');
    }

    // Check for evaluation_table or prioritization_matrix
    const evaluationTable =
      data.comparison_summary.evaluation_table ||
      data.comparison_summary.prioritization_matrix;
    if (evaluationTable && !Array.isArray(evaluationTable)) {
      throw new Error(
        'comparison_summary.evaluation_table or prioritization_matrix must be an array'
      );
    }

    if (evaluationTable) {
      evaluationTable.forEach((entry: any, index: number) => {
        if (typeof entry !== 'object' || entry === null) {
          throw new Error(
            `comparison_summary.evaluation_table/prioritization_matrix[${index}] must be an object`
          );
        }

        if (typeof entry.approach_name !== 'string') {
          throw new Error(
            `comparison_summary.evaluation_table/prioritization_matrix[${index}].approach_name must be a string`
          );
        }

        if (typeof entry.impact_score !== 'string') {
          throw new Error(
            `comparison_summary.evaluation_table/prioritization_matrix[${index}].impact_score must be a string`
          );
        }

        if (typeof entry.effort_score !== 'string') {
          throw new Error(
            `comparison_summary.evaluation_table/prioritization_matrix[${index}].effort_score must be a string`
          );
        }

        if (typeof entry.confidence_score !== 'string') {
          throw new Error(
            `comparison_summary.evaluation_table/prioritization_matrix[${index}].confidence_score must be a string`
          );
        }
      });
    }

    if (typeof data.comparison_summary.recommendation !== 'string') {
      throw new Error('comparison_summary.recommendation must be a string');
    }
  }
}

// Export a singleton instance
export const solutionArchitectResponseParser =
  new SolutionArchitectResponseParser();
