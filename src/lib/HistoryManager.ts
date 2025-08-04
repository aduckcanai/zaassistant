/**
 * History Manager Class
 *
 * Quản lý lịch sử các lần generate với localStorage
 */

export interface HistoryEntry {
  id: string;
  timestamp: string;
  type: 'analysis' | 'ui';
  prompt: string;
  title: string; // Tiêu đề ngắn gọn từ prompt
  status: 'success' | 'error' | 'pending';
  error?: string;
  // Add results storage
  results?: {
    analysisData?: any; // Store ProductAnalysisReader data
    uiResults?: any; // Store UI generation results
    solutionArchitectAnalysis?: string; // Store solution architect results
    solutionArchitectData?: any; // Store raw solution architect JSON data
    reviewResults?: string; // Store overall review/critique results
    uiState?: {
      // Store complete UI state for restoration
      analysisFormData?: any;
      overallReview?: string;
      solutionArchitectMarkdown?: string;
      solutionArchitectData?: any; // Store raw solution architect JSON data
      activeTab?: 'analysis' | 'ui';
      uiInput?: string;
      selectedApproach?: string; // Store selected UI generation approach
      generatedContent?: {
        html_content: string;
        response_id: string;
      }; // Store generated UI content
    };
  };
  metadata?: {
    responseSize?: number;
    processingTime?: number;
    hasFiles?: boolean;
    fileCount?: number;
  };
}

export interface HistoryData {
  entries: HistoryEntry[];
  lastUpdated: string;
}

export class HistoryManager {
  private static readonly STORAGE_KEY = 'ai_assistant_history';
  private static readonly MAX_ENTRIES = 100; // Giới hạn số lượng entries

  /**
   * Lấy tất cả lịch sử từ localStorage
   */
  static getHistory(): HistoryData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          entries: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      const parsed = JSON.parse(stored) as HistoryData;
      return {
        entries: parsed.entries || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error loading history:', error);
      return {
        entries: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Lưu lịch sử vào localStorage
   */
  private static saveHistory(data: HistoryData): void {
    try {
      // Giới hạn số lượng entries
      if (data.entries.length > this.MAX_ENTRIES) {
        data.entries = data.entries.slice(-this.MAX_ENTRIES);
      }

      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  /**
   * Tạo tiêu đề ngắn gọn từ prompt
   */
  private static generateTitle(prompt: string): string {
    // Lấy 50 ký tự đầu và thêm ... nếu cần
    const cleaned = prompt.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  }

  /**
   * Thêm entry mới vào lịch sử
   */
  static addEntry(
    type: 'analysis' | 'ui',
    prompt: string,
    hasFiles: boolean = false,
    fileCount: number = 0
  ): string {
    const history = this.getHistory();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const newEntry: HistoryEntry = {
      id,
      timestamp: new Date().toISOString(),
      type,
      prompt,
      title: this.generateTitle(prompt),
      status: 'pending',
      metadata: {
        hasFiles,
        fileCount,
      },
    };

    history.entries.push(newEntry);
    this.saveHistory(history);

    return id;
  }

  /**
   * Cập nhật trạng thái của entry
   */
  static updateEntryStatus(
    id: string,
    status: 'success' | 'error',
    error?: string,
    metadata?: {
      responseSize?: number;
      processingTime?: number;
    }
  ): void {
    const history = this.getHistory();
    const entryIndex = history.entries.findIndex(entry => entry.id === id);

    if (entryIndex !== -1) {
      history.entries[entryIndex].status = status;
      if (error) {
        history.entries[entryIndex].error = error;
      }
      if (metadata) {
        history.entries[entryIndex].metadata = {
          ...history.entries[entryIndex].metadata,
          ...metadata,
        };
      }

      this.saveHistory(history);
    }
  }

  /**
   * Update entry with results data
   */
  static updateEntryResults(
    id: string,
    results: {
      analysisData?: any;
      uiResults?: any;
      solutionArchitectAnalysis?: string;
      solutionArchitectData?: any;
      reviewResults?: string;
      uiState?: {
        analysisFormData?: any;
        overallReview?: string;
        solutionArchitectMarkdown?: string;
        solutionArchitectData?: any;
        activeTab?: 'analysis' | 'ui';
        uiInput?: string;
        selectedApproach?: string;
        generatedContent?: {
          html_content: string;
          response_id: string;
        };
      };
    }
  ): void {
    const history = this.getHistory();
    const entryIndex = history.entries.findIndex(entry => entry.id === id);

    if (entryIndex !== -1) {
      history.entries[entryIndex].results = {
        ...history.entries[entryIndex].results,
        ...results,
      };
      this.saveHistory(history);
    }
  }

  /**
   * Xóa một entry khỏi lịch sử
   */
  static deleteEntry(id: string): void {
    const history = this.getHistory();
    history.entries = history.entries.filter(entry => entry.id !== id);
    this.saveHistory(history);
  }

  /**
   * Xóa tất cả lịch sử
   */
  static clearHistory(): void {
    const emptyHistory: HistoryData = {
      entries: [],
      lastUpdated: new Date().toISOString(),
    };
    this.saveHistory(emptyHistory);
  }

  /**
   * Lấy lịch sử theo loại
   */
  static getHistoryByType(type: 'analysis' | 'ui'): HistoryEntry[] {
    const history = this.getHistory();
    return history.entries.filter(entry => entry.type === type);
  }

  /**
   * Tìm kiếm trong lịch sử
   */
  static searchHistory(query: string): HistoryEntry[] {
    const history = this.getHistory();
    const lowerQuery = query.toLowerCase();

    return history.entries.filter(
      entry =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.prompt.toLowerCase().includes(lowerQuery)
    );
  }
}
