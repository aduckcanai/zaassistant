/**
 * Assessment Response Parser Class
 *
 * This class provides functionality to parse, validate, and access
 * assessment response JSON data with proper TypeScript types.
 */

// Type definitions for the assessment response structure
export interface AssessmentScores {
  strategic_alignment: number;
  authenticity_and_evidence: number;
  clarity_and_specificity: number;
  risk_awareness: number;
}

export interface AssessmentRationale {
  strategic_alignment: string;
  authenticity_and_evidence: string;
  clarity_and_specificity: string;
  risk_awareness: string;
}

export interface AssessmentResponse {
  scores: AssessmentScores;
  overall_score: number;
  rationale: AssessmentRationale;
}

export interface AssessmentAnalysis {
  totalScore: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreRanking: Array<{ category: string; score: number }>;
  grade: string;
}

export class AssessmentResponseParser {
  private data: AssessmentResponse | null = null;
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
  public loadFromObject(data: AssessmentResponse): void {
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

    if (!this.data.scores || typeof this.data.scores !== 'object') {
      return false;
    }

    if (typeof this.data.overall_score !== 'number') {
      console.error('Missing or invalid overall_score');
      return false;
    }

    if (!this.data.rationale || typeof this.data.rationale !== 'object') {
      return false;
    }

    // Validate scores structure
    const requiredScores = [
      'strategic_alignment',
      'authenticity_and_evidence',
      'clarity_and_specificity',
      'risk_awareness',
    ];

    for (const scoreKey of requiredScores) {
      if (
        typeof this.data.scores[scoreKey as keyof AssessmentScores] !== 'number'
      ) {
        return false;
      }
    }

    // Validate rationale structure
    for (const rationaleKey of requiredScores) {
      if (
        typeof this.data.rationale[
          rationaleKey as keyof AssessmentRationale
        ] !== 'string'
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the overall score
   */
  public getOverallScore(): number {
    return this.data?.overall_score || 0;
  }

  /**
   * Get all scores
   */
  public getScores(): AssessmentScores | null {
    return this.data?.scores || null;
  }

  /**
   * Get score for a specific category
   */
  public getScore(category: keyof AssessmentScores): number {
    return this.data?.scores[category] || 0;
  }

  /**
   * Get all rationale
   */
  public getRationale(): AssessmentRationale | null {
    return this.data?.rationale || null;
  }

  /**
   * Get rationale for a specific category
   */
  public getRationaleForCategory(category: keyof AssessmentRationale): string {
    return this.data?.rationale[category] || '';
  }

  /**
   * Get analysis of the assessment data
   */
  public getAnalysis(): AssessmentAnalysis {
    if (!this.data) {
      return {
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreRanking: [],
        grade: 'F',
      };
    }

    const scores = this.data.scores;
    const scoreValues = Object.values(scores);
    const scoreEntries = Object.entries(scores);

    const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / scoreValues.length;
    const highestScore = Math.max(...scoreValues);
    const lowestScore = Math.min(...scoreValues);

    // Create ranking
    const scoreRanking = scoreEntries
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);

    // Determine grade
    const grade = this.calculateGrade(averageScore);

    return {
      totalScore,
      averageScore,
      highestScore,
      lowestScore,
      scoreRanking,
      grade,
    };
  }

  /**
   * Calculate grade based on average score
   */
  private calculateGrade(averageScore: number): string {
    if (averageScore >= 90) return 'A+';
    if (averageScore >= 85) return 'A';
    if (averageScore >= 80) return 'A-';
    if (averageScore >= 75) return 'B+';
    if (averageScore >= 70) return 'B';
    if (averageScore >= 65) return 'B-';
    if (averageScore >= 60) return 'C+';
    if (averageScore >= 55) return 'C';
    if (averageScore >= 50) return 'C-';
    if (averageScore >= 45) return 'D+';
    if (averageScore >= 40) return 'D';
    if (averageScore >= 35) return 'D-';
    return 'F';
  }



  /**
   * Get score ranking (highest to lowest)
   */
  public getScoreRanking(): Array<{ category: string; score: number }> {
    if (!this.data) return [];

    return Object.entries(this.data.scores)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get categories that need improvement (score < 60)
   */
  public getCategoriesNeedingImprovement(): Array<{
    category: string;
    score: number;
  }> {
    if (!this.data) return [];

    return Object.entries(this.data.scores)
      .filter(([_, score]) => score < 60)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => a.score - b.score);
  }

  /**
   * Get the best performing category
   */
  public getBestCategory(): { category: string; score: number } | null {
    const ranking = this.getScoreRanking();
    return ranking.length > 0 ? ranking[0] : null;
  }

  /**
   * Get the worst performing category
   */
  public getWorstCategory(): { category: string; score: number } | null {
    const ranking = this.getScoreRanking();
    return ranking.length > 0 ? ranking[ranking.length - 1] : null;
  }

  /**
   * Export as formatted markdown
   */
  public exportAsMarkdown(): string {
    if (!this.data) return '';

    const analysis = this.getAnalysis();

    let markdown = `# Assessment Analysis\n\n`;

    // Overall score and grade
    markdown += `## Overall Assessment\n\n`;
    markdown += `**Overall Score:** ${this.data.overall_score}/100\n`;
    markdown += `**Grade:** ${analysis.grade}\n`;
    markdown += `**Average Score:** ${analysis.averageScore.toFixed(1)}/100\n\n`;

    // Score breakdown
    markdown += `## Score Breakdown\n\n`;
    analysis.scoreRanking.forEach((item, index) => {
      const emoji = item.score >= 80 ? '🟢' : item.score >= 60 ? '🟡' : '🔴';
      markdown += `${index + 1}. **${item.category.replace(/_/g, ' ').toUpperCase()}** ${emoji} ${item.score}/100\n`;
    });

    markdown += `\n## Detailed Rationale\n\n`;

    // Rationale for each category
    Object.entries(this.data.rationale).forEach(([category, rationale]) => {
      const score = this.data!.scores[category as keyof AssessmentScores];
      const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';

      markdown += `### ${category.replace(/_/g, ' ').toUpperCase()} ${emoji} ${score}/100\n\n`;
      markdown += `${rationale}\n\n`;
    });



    // Areas needing improvement
    const needsImprovement = this.getCategoriesNeedingImprovement();
    if (needsImprovement.length > 0) {
      markdown += `## Areas Needing Improvement\n\n`;
      needsImprovement.forEach(item => {
        markdown += `- **${item.category.replace(/_/g, ' ').toUpperCase()}** (${item.score}/100)\n`;
      });
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

    const analysis = this.getAnalysis();

    let text = `ASSESSMENT ANALYSIS\n`;
    text += `==================\n\n`;

    text += `OVERALL SCORE: ${this.data.overall_score}/100 (Grade: ${analysis.grade})\n`;
    text += `AVERAGE SCORE: ${analysis.averageScore.toFixed(1)}/100\n\n`;

    text += `SCORE BREAKDOWN\n`;
    text += `---------------\n`;
    analysis.scoreRanking.forEach((item, index) => {
      text += `${index + 1}. ${item.category.toUpperCase()}: ${item.score}/100\n`;
    });

    text += `\nDETAILED RATIONALE\n`;
    text += `-----------------\n`;
    Object.entries(this.data.rationale).forEach(([category, rationale]) => {
      const score = this.data!.scores[category as keyof AssessmentScores];
      text += `${category.toUpperCase()} (${score}/100):\n`;
      text += `${rationale}\n\n`;
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
  public getData(): AssessmentResponse | null {
    return this.data;
  }
}

// Export a singleton instance
export const assessmentResponseParser = new AssessmentResponseParser();
