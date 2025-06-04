import { ChromeBookmarkNode, BookmarkEvent, AppSettings } from '@/types';
import { storageService } from '@/services/storage';
import { categoriesService } from '@/services/categories';
import { handleError, isValidUrl } from '@/utils/helpers';

class BackgroundService {
  private isProcessing = false;
  private processingQueue: ChromeBookmarkNode[] = [];
  private settings: AppSettings | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🚀 AI Bookmark Manager starting up...');
      
      // Initialize services
      await categoriesService.initialize();
      this.settings = await storageService.getSettings();
      
      // Set up event listeners
      this.setupBookmarkListeners();
      this.setupStorageListeners();
      this.setupMessageListeners();
      
      console.log('✅ AI Bookmark Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background service:', handleError(error));
    }
  }

  private setupBookmarkListeners(): void {
    // Listen for bookmark creation
    if (chrome.bookmarks?.onCreated) {
      chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
        console.log('📖 Bookmark created:', bookmark);
        await this.handleBookmarkCreated(bookmark);
      });
    }

    // Listen for bookmark changes
    if (chrome.bookmarks?.onChanged) {
      chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
        console.log('📝 Bookmark changed:', id, changeInfo);
        if (changeInfo.title || changeInfo.url) {
          try {
            const bookmarks = await chrome.bookmarks.get(id);
            if (bookmarks.length > 0) {
              await this.handleBookmarkCreated(bookmarks[0]);
            }
          } catch (error) {
            console.error('Failed to handle bookmark change:', error);
          }
        }
      });
    }

    // Listen for bookmark removal
    if (chrome.bookmarks?.onRemoved) {
      chrome.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
        console.log('🗑️ Bookmark removed:', id);
        try {
          await storageService.removeBookmark(id);
        } catch (error) {
          console.error('Failed to clean up removed bookmark:', error);
        }
      });
    }
  }

  private setupStorageListeners(): void {
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.ai_bookmark_settings) {
          this.loadSettings();
        }
      });
    }
  }

  private setupMessageListeners(): void {
    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await storageService.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async handleMessage(message: any, sender: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      switch (message.type) {
        case 'GET_CATEGORIES':
          const categories = await categoriesService.getCategories();
          sendResponse({ success: true, data: categories });
          break;

        case 'CATEGORIZE_BOOKMARK':
          const result = await this.categorizeBookmark(
            message.data.title,
            message.data.url,
            message.data.content
          );
          sendResponse({ success: true, data: result });
          break;

        case 'GET_PROCESSING_STATUS':
          sendResponse({ 
            success: true, 
            data: { 
              isProcessing: this.isProcessing,
              queueLength: this.processingQueue.length
            }
          });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: handleError(error) });
    }
  }

  private async handleBookmarkCreated(bookmark: ChromeBookmarkNode): Promise<void> {
    if (!bookmark.url || !isValidUrl(bookmark.url)) {
      return;
    }

    if (!this.settings?.autoOrganize) {
      console.log('⏸️ Auto-organize disabled, skipping bookmark');
      return;
    }

    this.processingQueue.push(bookmark);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`📊 Processing ${this.processingQueue.length} bookmarks...`);

    try {
      while (this.processingQueue.length > 0) {
        const bookmark = this.processingQueue.shift();
        if (bookmark) {
          await this.processBookmark(bookmark);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error processing queue:', handleError(error));
    } finally {
      this.isProcessing = false;
      console.log('✅ Queue processing completed');
    }
  }

  private async processBookmark(bookmark: ChromeBookmarkNode): Promise<void> {
    try {
      console.log(`🔍 Processing bookmark: ${bookmark.title}`);

      const categorizationResult = await this.categorizeBookmark(
        bookmark.title,
        bookmark.url!
      );

      console.log(`📂 Categorized as: ${categorizationResult.category.name} (${Math.round(categorizationResult.confidence * 100)}%)`);

      if (categorizationResult.confidence >= (this.settings?.confidenceThreshold || 0.7)) {
        await this.moveBookmarkToCategory(bookmark, categorizationResult.category);
      }

      await this.saveBookmarkData(bookmark, categorizationResult);

    } catch (error) {
      console.error(`Failed to process bookmark ${bookmark.title}:`, handleError(error));
    }
  }

  private async categorizeBookmark(title: string, url: string, content?: string) {
    return await categoriesService.categorizeBookmark(title, url, content);
  }

  private async moveBookmarkToCategory(bookmark: ChromeBookmarkNode, category: any): Promise<void> {
    try {
      const folderId = await categoriesService.ensureCategoryFolder(category);
      
      if (folderId && bookmark.parentId !== folderId) {
        console.log(`📁 Moving bookmark to ${category.name} folder`);
        
        await chrome.bookmarks.move(bookmark.id, {
          parentId: folderId
        });
        
        console.log(`✅ Bookmark moved successfully`);
      }
    } catch (error) {
      console.error('Failed to move bookmark to category folder:', error);
    }
  }

  private async saveBookmarkData(bookmark: ChromeBookmarkNode, categorizationResult: any): Promise<void> {
    try {
      const bookmarkData = {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url!,
        category: categorizationResult.category,
        confidence: categorizationResult.confidence,
        dateAdded: bookmark.dateAdded || Date.now(),
        dateModified: Date.now(),
        parentId: bookmark.parentId
      };

      await storageService.addBookmark(bookmarkData);
    } catch (error) {
      console.error('Failed to save bookmark data:', error);
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService(); 