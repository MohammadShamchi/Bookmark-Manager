import { StorageData, AppSettings, Category, Bookmark } from '@/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/utils/constants';
import { safeJsonParse, safeJsonStringify, handleError } from '@/utils/helpers';

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Settings Management
  async getSettings(): Promise<AppSettings> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        return DEFAULT_SETTINGS;
      }

      const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to get settings:', handleError(error));
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage not available');
      }

      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: updatedSettings
      });
    } catch (error) {
      throw new Error(`Failed to save settings: ${handleError(error)}`);
    }
  }

  // Categories Management
  async getCategories(): Promise<Category[]> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        return [];
      }

      const result = await chrome.storage.sync.get(STORAGE_KEYS.CATEGORIES);
      return result[STORAGE_KEYS.CATEGORIES] || [];
    } catch (error) {
      console.error('Failed to get categories:', handleError(error));
      return [];
    }
  }

  async saveCategories(categories: Category[]): Promise<void> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage not available');
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.CATEGORIES]: categories
      });
    } catch (error) {
      throw new Error(`Failed to save categories: ${handleError(error)}`);
    }
  }

  async addCategory(category: Category): Promise<void> {
    const categories = await this.getCategories();
    const existingIndex = categories.findIndex(cat => cat.id === category.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }
    
    await this.saveCategories(categories);
  }

  async removeCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const filtered = categories.filter(cat => cat.id !== categoryId);
    await this.saveCategories(filtered);
  }

  // Bookmarks Management
  async getBookmarks(): Promise<Record<string, Bookmark>> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        return {};
      }

      const result = await chrome.storage.sync.get(STORAGE_KEYS.BOOKMARKS);
      return result[STORAGE_KEYS.BOOKMARKS] || {};
    } catch (error) {
      console.error('Failed to get bookmarks:', handleError(error));
      return {};
    }
  }

  async saveBookmarks(bookmarks: Record<string, Bookmark>): Promise<void> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage not available');
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.BOOKMARKS]: bookmarks
      });
    } catch (error) {
      throw new Error(`Failed to save bookmarks: ${handleError(error)}`);
    }
  }

  async addBookmark(bookmark: Bookmark): Promise<void> {
    const bookmarks = await this.getBookmarks();
    bookmarks[bookmark.id] = bookmark;
    await this.saveBookmarks(bookmarks);
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    const bookmarks = await this.getBookmarks();
    delete bookmarks[bookmarkId];
    await this.saveBookmarks(bookmarks);
  }

  async updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): Promise<void> {
    const bookmarks = await this.getBookmarks();
    if (bookmarks[bookmarkId]) {
      bookmarks[bookmarkId] = { ...bookmarks[bookmarkId], ...updates };
      await this.saveBookmarks(bookmarks);
    }
  }

  // Sync Management
  async getLastSync(): Promise<number> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        return 0;
      }

      const result = await chrome.storage.sync.get(STORAGE_KEYS.LAST_SYNC);
      return result[STORAGE_KEYS.LAST_SYNC] || 0;
    } catch (error) {
      console.error('Failed to get last sync:', handleError(error));
      return 0;
    }
  }

  async updateLastSync(): Promise<void> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage not available');
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.LAST_SYNC]: Date.now()
      });
    } catch (error) {
      throw new Error(`Failed to update last sync: ${handleError(error)}`);
    }
  }

  // Bulk Operations
  async getAllData(): Promise<StorageData> {
    const [categories, settings, bookmarks, lastSync] = await Promise.all([
      this.getCategories(),
      this.getSettings(),
      this.getBookmarks(),
      this.getLastSync()
    ]);

    return {
      categories,
      settings,
      bookmarks,
      lastSync
    };
  }

  async saveAllData(data: Partial<StorageData>): Promise<void> {
    const promises: Promise<void>[] = [];

    if (data.categories) {
      promises.push(this.saveCategories(data.categories));
    }
    if (data.settings) {
      promises.push(this.saveSettings(data.settings));
    }
    if (data.bookmarks) {
      promises.push(this.saveBookmarks(data.bookmarks));
    }

    await Promise.all(promises);
    
    if (promises.length > 0) {
      await this.updateLastSync();
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage not available');
      }

      await chrome.storage.sync.clear();
    } catch (error) {
      throw new Error(`Failed to clear data: ${handleError(error)}`);
    }
  }

  // Storage usage statistics
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.storage?.sync) {
        return { used: 0, quota: 0, percentage: 0 };
      }

      const bytesInUse = await chrome.storage.sync.getBytesInUse();
      const quota = chrome.storage.sync.QUOTA_BYTES || 102400; // 100KB default
      const percentage = (bytesInUse / quota) * 100;

      return {
        used: bytesInUse,
        quota,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get storage usage:', handleError(error));
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  // Listen for storage changes
  onStorageChanged(callback: (changes: any, areaName: string) => void): void {
    try {
      const chrome = (globalThis as any).chrome;
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.addListener(callback);
      }
    } catch (error) {
      console.error('Failed to listen for storage changes:', handleError(error));
    }
  }

  removeStorageListener(callback: (changes: any, areaName: string) => void): void {
    try {
      const chrome = (globalThis as any).chrome;
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(callback);
      }
    } catch (error) {
      console.error('Failed to remove storage listener:', handleError(error));
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance(); 