import { Category, DEFAULT_CATEGORIES } from '@/types';
import { CATEGORY_FOLDERS } from '@/utils/constants';
import { categorizeByUrl, getCategoryByName, findCategoryById, extractKeywords } from '@/utils/helpers';
import { storageService } from './storage';

export class CategoriesService {
  private static instance: CategoriesService;
  private categories: Category[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): CategoriesService {
    if (!CategoriesService.instance) {
      CategoriesService.instance = new CategoriesService();
    }
    return CategoriesService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load existing categories or use defaults
      const storedCategories = await storageService.getCategories();
      
      if (storedCategories.length === 0) {
        // First time setup - create default categories
        await this.setupDefaultCategories();
      } else {
        this.categories = storedCategories;
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize categories:', error);
      this.categories = DEFAULT_CATEGORIES;
      this.initialized = true;
    }
  }

  private async setupDefaultCategories(): Promise<void> {
    try {
      // Create folder structure in Chrome bookmarks
      const chrome = (globalThis as any).chrome;
      if (!chrome?.bookmarks) {
        throw new Error('Chrome bookmarks API not available');
      }

      const categoriesWithFolders: Category[] = [];

      for (const category of DEFAULT_CATEGORIES) {
        // Create bookmark folder for each category
        const folderName = CATEGORY_FOLDERS[category.id as keyof typeof CATEGORY_FOLDERS] || category.name;
        
        try {
          const folder = await chrome.bookmarks.create({
            parentId: '1', // Bookmarks bar
            title: folderName
          });

          categoriesWithFolders.push({
            ...category,
            folderId: folder.id
          });
        } catch (error) {
          console.warn(`Failed to create folder for ${category.name}:`, error);
          categoriesWithFolders.push(category);
        }
      }

      this.categories = categoriesWithFolders;
      await storageService.saveCategories(this.categories);
    } catch (error) {
      console.error('Failed to setup default categories:', error);
      this.categories = DEFAULT_CATEGORIES;
    }
  }

  // Category Management
  async getCategories(): Promise<Category[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.categories];
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const categories = await this.getCategories();
    return findCategoryById(id, categories);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const categories = await this.getCategories();
    return getCategoryByName(name, categories);
  }

  async addCategory(category: Category): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if category already exists
    const existingIndex = this.categories.findIndex(cat => cat.id === category.id);
    
    if (existingIndex >= 0) {
      this.categories[existingIndex] = category;
    } else {
      // Create bookmark folder if not exists
      if (!category.folderId) {
        try {
          const chrome = (globalThis as any).chrome;
          if (chrome?.bookmarks) {
            const folder = await chrome.bookmarks.create({
              parentId: '1',
              title: `${category.emoji} ${category.name}`
            });
            category.folderId = folder.id;
          }
        } catch (error) {
          console.warn('Failed to create bookmark folder:', error);
        }
      }
      
      this.categories.push(category);
    }

    await storageService.saveCategories(this.categories);
  }

  async removeCategory(categoryId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const categoryIndex = this.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex >= 0) {
      const category = this.categories[categoryIndex];
      
      // Remove bookmark folder if exists
      if (category.folderId) {
        try {
          const chrome = (globalThis as any).chrome;
          if (chrome?.bookmarks) {
            await chrome.bookmarks.removeTree(category.folderId);
          }
        } catch (error) {
          console.warn('Failed to remove bookmark folder:', error);
        }
      }
      
      this.categories.splice(categoryIndex, 1);
      await storageService.saveCategories(this.categories);
    }
  }

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const categoryIndex = this.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex >= 0) {
      this.categories[categoryIndex] = {
        ...this.categories[categoryIndex],
        ...updates
      };
      
      // Update folder name if name or emoji changed
      if ((updates.name || updates.emoji) && this.categories[categoryIndex].folderId) {
        try {
          const chrome = (globalThis as any).chrome;
          if (chrome?.bookmarks) {
            const category = this.categories[categoryIndex];
            await chrome.bookmarks.update(category.folderId, {
              title: `${category.emoji} ${category.name}`
            });
          }
        } catch (error) {
          console.warn('Failed to update bookmark folder:', error);
        }
      }
      
      await storageService.saveCategories(this.categories);
    }
  }

  // Categorization Logic
  async categorizeBookmark(title: string, url: string, content?: string): Promise<{
    category: Category;
    confidence: number;
    method: 'url' | 'keyword' | 'ai' | 'fallback';
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Method 1: URL-based categorization
    const urlCategory = categorizeByUrl(url);
    if (urlCategory) {
      const category = await this.getCategoryById(urlCategory);
      if (category) {
        return {
          category,
          confidence: 0.8,
          method: 'url'
        };
      }
    }

    // Method 2: Keyword-based categorization
    const keywordResult = await this.categorizeByKeywords(title, content);
    if (keywordResult.confidence > 0.6) {
      return {
        ...keywordResult,
        method: 'keyword'
      };
    }

    // Method 3: Fallback to "Other" category
    const otherCategory = await this.getCategoryById('other');
    if (otherCategory) {
      return {
        category: otherCategory,
        confidence: 0.3,
        method: 'fallback'
      };
    }

    // Final fallback - create default "Other" category
    const fallbackCategory: Category = {
      id: 'other',
      name: 'Other',
      emoji: '📂',
      color: '#6b7280',
      folderId: ''
    };

    return {
      category: fallbackCategory,
      confidence: 0.1,
      method: 'fallback'
    };
  }

  private async categorizeByKeywords(title: string, content?: string): Promise<{
    category: Category;
    confidence: number;
  }> {
    const text = `${title} ${content || ''}`.toLowerCase();
    const keywords = extractKeywords(text, 20);
    
    let bestMatch: { category: Category; score: number } | null = null;

    for (const category of this.categories) {
      if (!category.keywords || category.keywords.length === 0) continue;

      let score = 0;
      const categoryKeywords = category.keywords.map(k => k.toLowerCase());

      // Check title for keyword matches (higher weight)
      for (const keyword of categoryKeywords) {
        if (title.toLowerCase().includes(keyword)) {
          score += 0.3;
        }
      }

      // Check extracted keywords
      for (const keyword of keywords) {
        if (categoryKeywords.includes(keyword)) {
          score += 0.1;
        }
      }

      // Check for partial matches
      for (const keyword of categoryKeywords) {
        for (const extractedKeyword of keywords) {
          if (extractedKeyword.includes(keyword) || keyword.includes(extractedKeyword)) {
            score += 0.05;
          }
        }
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    if (bestMatch && bestMatch.score > 0) {
      return {
        category: bestMatch.category,
        confidence: Math.min(bestMatch.score, 1.0)
      };
    }

    // Return "Other" category as fallback
    const otherCategory = this.categories.find(cat => cat.id === 'other') || this.categories[0];
    return {
      category: otherCategory,
      confidence: 0.1
    };
  }

  // Folder Management
  async ensureCategoryFolder(category: Category): Promise<string> {
    if (category.folderId) {
      // Verify folder still exists
      try {
        const chrome = (globalThis as any).chrome;
        if (chrome?.bookmarks) {
          await chrome.bookmarks.get(category.folderId);
          return category.folderId;
        }
      } catch (error) {
        console.warn('Category folder no longer exists, creating new one');
      }
    }

    // Create new folder
    try {
      const chrome = (globalThis as any).chrome;
      if (chrome?.bookmarks) {
        const folderName = `${category.emoji} ${category.name}`;
        const folder = await chrome.bookmarks.create({
          parentId: '1', // Bookmarks bar
          title: folderName
        });

        // Update category with new folder ID
        await this.updateCategory(category.id, { folderId: folder.id });
        return folder.id;
      }
    } catch (error) {
      console.error('Failed to create category folder:', error);
    }

    return '';
  }

  // Statistics
  async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const chrome = (globalThis as any).chrome;
      if (!chrome?.bookmarks) {
        return {};
      }

      const stats: Record<string, number> = {};
      
      for (const category of this.categories) {
        if (category.folderId) {
          try {
            const children = await chrome.bookmarks.getChildren(category.folderId);
            stats[category.id] = children.length;
          } catch (error) {
            stats[category.id] = 0;
          }
        } else {
          stats[category.id] = 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get category stats:', error);
      return {};
    }
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    this.categories = [];
    this.initialized = false;
    await storageService.saveCategories([]);
    await this.initialize();
  }
}

// Export singleton instance
export const categoriesService = CategoriesService.getInstance(); 