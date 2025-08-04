// src/lib/cache.ts

export interface AppCache {
  activeTab: 'analysis' | 'ui';
  uiInput: string;
  hasContent: boolean;
  solutionArchitectMarkdown: string;
  solutionArchitectData: any;
  showHistory: boolean;
  currentHistoryId: string | null;
  analysisData: any;
  analysisFormData: any;
  lastUpdated: number;
}

const CACHE_KEY = 'ai-featurelab-state';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class CacheManager {
  /**
   * Save application state to localStorage
   */
  static saveState(state: Partial<AppCache>): void {
    try {
      const existingCache = this.loadState();
      const updatedCache: AppCache = {
        ...existingCache,
        ...state,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));
      console.log('State cached successfully:', updatedCache);
    } catch (error) {
      console.error('Failed to save state to cache:', error);
    }
  }

  /**
   * Load application state from localStorage
   */
  static loadState(): AppCache {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return this.getDefaultState();
      }

      const parsedCache: AppCache = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - parsedCache.lastUpdated > CACHE_EXPIRY) {
        console.log('Cache expired, clearing...');
        this.clearCache();
        return this.getDefaultState();
      }

      console.log('State loaded from cache:', parsedCache);
      return parsedCache;
    } catch (error) {
      console.error('Failed to load state from cache:', error);
      return this.getDefaultState();
    }
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get default state when no cache exists
   */
  private static getDefaultState(): AppCache {
    return {
      activeTab: 'analysis',
      uiInput: '',
      hasContent: false,
      solutionArchitectMarkdown: '',
      solutionArchitectData: null,
      showHistory: false,
      currentHistoryId: null,
      analysisData: null,
      analysisFormData: null,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Check if cache exists and is valid
   */
  static hasValidCache(): boolean {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const parsedCache: AppCache = JSON.parse(cached);
      return Date.now() - parsedCache.lastUpdated <= CACHE_EXPIRY;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache age in minutes
   */
  static getCacheAge(): number {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return 0;

      const parsedCache: AppCache = JSON.parse(cached);
      return Math.floor((Date.now() - parsedCache.lastUpdated) / (1000 * 60));
    } catch (error) {
      return 0;
    }
  }
} 