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
      
      // Check for duplicate folders issue and clean up if needed
      await this.cleanupDuplicateFolders();
      
      // Set up event listeners
      this.setupBookmarkListeners();
      this.setupStorageListeners();
      this.setupMessageListeners();
      
      console.log('✅ AI Bookmark Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background service:', handleError(error));
    }
  }

  private async cleanupDuplicateFolders(): Promise<void> {
    try {
      // Check if we have the old "Tools" folder issue
      const toolsFolders = await chrome.bookmarks.search('🛠️ Tools');
      const aiToolsFolders = await chrome.bookmarks.search('🛠️ AI-Tools');
      
      console.log(`🔍 Found ${toolsFolders.length} "🛠️ Tools" folders and ${aiToolsFolders.length} "🛠️ AI-Tools" folders`);
      
      // If we have old folders but no AI folders, reset categories
      if (toolsFolders.length > 0 && aiToolsFolders.length === 0) {
        console.log('🧹 Cleaning up old folders and creating new unique ones...');
        await categoriesService.resetToDefaults();
      }
    } catch (error) {
      console.warn('Failed to cleanup duplicate folders:', error);
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
        // Handle message asynchronously
        this.handleMessage(message, sender, sendResponse)
          .catch(error => {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: handleError(error) });
          });
        
        // Return true to indicate we will respond asynchronously
        return true;
      });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await storageService.getSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings if loading fails
      this.settings = {
        autoOrganize: true,
        confidenceThreshold: 0.7,
        aiEnabled: false,
        apiKey: '',
        soundEnabled: true,
        theme: 'auto',
        maxRetries: 3
      };
    }
  }

  private async handleMessage(message: any, sender: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      // Validate message structure
      if (!message || typeof message.type !== 'string') {
        sendResponse({ success: false, error: 'Invalid message format' });
        return;
      }

      console.log(`📨 Received message: ${message.type}`);

      switch (message.type) {
        case 'GET_CATEGORIES':
          try {
            const categories = await categoriesService.getCategories();
            sendResponse({ success: true, data: categories });
          } catch (error) {
            console.error('Failed to get categories:', error);
            // Fallback to default categories
            sendResponse({ 
              success: true, 
              data: [
                { id: 'work', name: 'Work', emoji: '💼', description: 'Professional tools, business, productivity' },
                { id: 'social', name: 'Social', emoji: '👥', description: 'Social media, forums, communities' },
                { id: 'news', name: 'News', emoji: '📰', description: 'News sites, blogs, journalism' },
                { id: 'tools', name: 'Tools', emoji: '🛠️', description: 'Development tools, utilities' },
                { id: 'learning', name: 'Learning', emoji: '📚', description: 'Education, tutorials, courses' },
                { id: 'shopping', name: 'Shopping', emoji: '🛒', description: 'E-commerce, products, deals' },
                { id: 'entertainment', name: 'Entertainment', emoji: '🎮', description: 'Games, videos, music' },
                { id: 'finance', name: 'Finance', emoji: '💰', description: 'Banking, investing, crypto' },
                { id: 'health', name: 'Health', emoji: '🏥', description: 'Medical, fitness, wellness' },
                { id: 'other', name: 'Other', emoji: '📂', description: 'Everything else' }
              ]
            });
          }
          break;

        case 'CATEGORIZE_BOOKMARK':
          if (!message.data || !message.data.title || !message.data.url) {
            sendResponse({ success: false, error: 'Missing bookmark data' });
            return;
          }
          
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

        case 'RESET_CATEGORIES':
          try {
            console.log('🔄 Forcing categories reset...');
            await categoriesService.resetToDefaults();
            console.log('✅ Categories reset completed');
            sendResponse({ success: true, message: 'Categories reset successfully' });
          } catch (error) {
            console.error('Failed to reset categories:', error);
            sendResponse({ success: false, error: handleError(error) });
          }
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
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
      console.log(`🔍 Debug: Moving bookmark "${bookmark.title}" to category "${category.name}"`);
      console.log(`🔍 Debug: Bookmark current parentId: ${bookmark.parentId}`);
      console.log(`🔍 Debug: Category object:`, category);
      
      const folderId = await categoriesService.ensureCategoryFolder(category);
      console.log(`🔍 Debug: Folder ID obtained: ${folderId}`);
      
      if (folderId && bookmark.parentId !== folderId) {
        console.log(`📁 Moving bookmark to ${category.name} folder (ID: ${folderId})`);
        
        // Get bookmark details before moving
        const beforeMove = await chrome.bookmarks.get(bookmark.id);
        console.log(`🔍 Debug: Bookmark before move:`, beforeMove[0]);
        
        const moveResult = await chrome.bookmarks.move(bookmark.id, {
          parentId: folderId
        });
        console.log(`🔍 Debug: Move result:`, moveResult);
        
        // Verify the move worked
        const afterMove = await chrome.bookmarks.get(bookmark.id);
        console.log(`🔍 Debug: Bookmark after move:`, afterMove[0]);
        
        // Double-check folder contents
        const folderContents = await chrome.bookmarks.getChildren(folderId);
        console.log(`🔍 Debug: Folder "${category.name}" now contains ${folderContents.length} items:`, folderContents.map(b => b.title));
        
        console.log(`✅ Bookmark moved successfully`);
      } else if (!folderId) {
        console.error(`❌ Failed to get folder ID for category: ${category.name}`);
      } else {
        console.log(`ℹ️ Bookmark already in correct folder (${category.name})`);
      }
    } catch (error) {
      console.error('Failed to move bookmark to category folder:', error);
      // Also log the full error details
      console.error('Error details:', {
        bookmarkId: bookmark.id,
        bookmarkTitle: bookmark.title,
        categoryName: category.name,
        categoryId: category.id,
        error: error
      });
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