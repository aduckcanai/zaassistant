/**
 * Critique Response Parser Class
 *
 * This class provides functionality to parse, validate, and access
 * critique response JSON data with proper TypeScript types.
 */

// Type definitions for the critique response structure
export interface CritiquePoint {
  category: string;
  critique: string;
  challenge_question: string;
}

export interface CritiqueResponse {
  overall_summary: string;
  critique_points: CritiquePoint[];
}

export interface CritiqueAnalysis {
  totalPoints: number;
  categories: string[];
  summaryLength: number;
  hasChallengeQuestions: boolean;
}

export class CritiqueResponseParser {
  private data: CritiqueResponse | null = null;
  private rawJson: string = '';

  constructor() {}

  /**
   * Load JSON data from string
   */
  public loadFromString(jsonString: string): boolean {
    try {
      this.rawJson = jsonString;
      this.data = JSON.parse(jsonString);
      return this.validate();
    } catch (error) {
      return false;
    }
  }

  /**
   * Load JSON data from object
   */
  public loadFromObject(data: CritiqueResponse): void {
    this.data = data;
    this.rawJson = JSON.stringify(data, null, 2);
  }

  /**
   * Validate the loaded data structure
   */
  public validate(): boolean {
    if (!this.data) {
      return false;
    }

    if (
      !this.data.overall_summary ||
      typeof this.data.overall_summary !== 'string'
    ) {
      return false;
    }

    if (!Array.isArray(this.data.critique_points)) {
      return false;
    }

    // Validate each critique point
    for (let i = 0; i < this.data.critique_points.length; i++) {
      const point = this.data.critique_points[i];
      if (!point.category || !point.critique || !point.challenge_question) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the overall summary
   */
  public getOverallSummary(): string {
    return this.data?.overall_summary || '';
  }

  /**
   * Get all critique points
   */
  public getCritiquePoints(): CritiquePoint[] {
    return this.data?.critique_points || [];
  }

  /**
   * Get critique points by category
   */
  public getCritiquePointsByCategory(category: string): CritiquePoint[] {
    return this.getCritiquePoints().filter(point =>
      point.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  /**
   * Get unique categories
   */
  public getCategories(): string[] {
    const categories = this.getCritiquePoints().map(point => point.category);
    return [...new Set(categories)];
  }

  /**
   * Get analysis of the critique data
   */
  public getAnalysis(): CritiqueAnalysis {
    const points = this.getCritiquePoints();
    const categories = this.getCategories();

    return {
      totalPoints: points.length,
      categories: categories,
      summaryLength: this.getOverallSummary().length,
      hasChallengeQuestions: points.every(
        point => point.challenge_question.trim() !== ''
      ),
    };
  }

  /**
   * Search critique points by keyword
   */
  public searchCritiquePoints(keyword: string): CritiquePoint[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.getCritiquePoints().filter(
      point =>
        point.category.toLowerCase().includes(lowerKeyword) ||
        point.critique.toLowerCase().includes(lowerKeyword) ||
        point.challenge_question.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get critique points with high priority (containing specific keywords)
   */
  public getHighPriorityPoints(): CritiquePoint[] {
    const priorityKeywords = [
      'thiếu',
      'không có',
      'lỗ hổng',
      'vấn đề',
      'rủi ro',
      'critical',
    ];
    return this.getCritiquePoints().filter(point =>
      priorityKeywords.some(
        keyword =>
          point.critique.toLowerCase().includes(keyword.toLowerCase()) ||
          point.category.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * Export as formatted markdown
   */
  public exportAsMarkdown(): string {
    if (!this.data) return '';

    let markdown = `# Critique Analysis\n\n`;

    // Overall summary
    markdown += `## Overall Summary\n\n${this.data.overall_summary}\n\n`;

    // Analysis stats
    const analysis = this.getAnalysis();
    markdown += `## Analysis Overview\n\n`;
    markdown += `- **Total Critique Points:** ${analysis.totalPoints}\n`;
    markdown += `- **Categories:** ${analysis.categories.join(', ')}\n`;
    markdown += `- **Summary Length:** ${analysis.summaryLength} characters\n`;
    markdown += `- **All Points Have Challenge Questions:** ${analysis.hasChallengeQuestions ? 'Yes' : 'No'}\n\n`;

    // Critique points by category
    const categories = this.getCategories();
    for (const category of categories) {
      const points = this.getCritiquePointsByCategory(category);
      markdown += `## ${category}\n\n`;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        markdown += `### Point ${i + 1}\n\n`;
        markdown += `**Critique:** ${point.critique}\n\n`;
        markdown += `**Challenge Question:** ${point.challenge_question}\n\n`;
      }
    }

    // High priority points
    const highPriority = this.getHighPriorityPoints();
    if (highPriority.length > 0) {
      markdown += `## High Priority Issues\n\n`;
      for (let i = 0; i < highPriority.length; i++) {
        const point = highPriority[i];
        markdown += `### ${i + 1}. ${point.category}\n\n`;
        markdown += `${point.critique}\n\n`;
        markdown += `**Question:** ${point.challenge_question}\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Export as JSON
   */
  public exportAsJson(): string {
    return this.rawJson || JSON.stringify(this.data, null, 2);
  }

  /**
   * Export as structured text
   */
  public exportAsText(): string {
    if (!this.data) return '';

    let text = `CRITIQUE ANALYSIS\n`;
    text += `================\n\n`;

    text += `OVERALL SUMMARY\n`;
    text += `---------------\n`;
    text += `${this.data.overall_summary}\n\n`;

    text += `CRITIQUE POINTS\n`;
    text += `---------------\n`;

    this.data.critique_points.forEach((point, index) => {
      text += `${index + 1}. ${point.category}\n`;
      text += `   Critique: ${point.critique}\n`;
      text += `   Question: ${point.challenge_question}\n\n`;
    });

    return text;
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

  /**
   * Get the full data object
   */
  public getData(): CritiqueResponse | null {
    return this.data;
  }
}

// Export a singleton instance
export const critiqueResponseParser = new CritiqueResponseParser();
