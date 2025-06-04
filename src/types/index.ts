// Core Bookmark Types
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: Category;
  confidence: number;
  dateAdded: number;
  dateModified?: number;
  tags?: string[];
  parentId?: string;
  index?: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  folderId: string;
  description?: string;
  keywords?: string[];
}

// AI Service Types
export interface CategorizationRequest {
  title: string;
  url: string;
  content?: string;
}

export interface CategorizationResponse {
  category: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

export interface OpenAIRequest {
  model: 'gpt-3.5-turbo';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
}

// Storage Types
export interface StorageData {
  categories: Category[];
  settings: AppSettings;
  bookmarks: Record<string, Bookmark>;
  lastSync: number;
}

export interface AppSettings {
  aiEnabled: boolean;
  autoOrganize: boolean;
  soundEnabled: boolean;
  apiKey?: string;
  theme: 'light' | 'dark' | 'auto';
  confidenceThreshold: number;
  maxRetries: number;
}

// UI State Types
export interface PopupState {
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  bookmarks: Bookmark[];
  categories: Category[];
  error: string | null;
  view: 'bookmarks' | 'categories' | 'settings';
}

// Chrome API Extension Types
export interface ChromeBookmarkNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: ChromeBookmarkNode[];
}

export interface BookmarkCreateDetails {
  parentId?: string;
  index?: number;
  title?: string;
  url?: string;
}

// Page Analysis Types
export interface PageContent {
  title: string;
  description?: string;
  keywords?: string[];
  text: string;
  language?: string;
  domain: string;
}

// Notification Types
export interface NotificationData {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Event Types
export interface BookmarkEvent {
  type: 'created' | 'removed' | 'moved' | 'changed';
  bookmark: ChromeBookmarkNode;
  timestamp: number;
}

// Constants
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'work',
    name: 'Work',
    emoji: '💼',
    color: '#3b82f6',
    folderId: '',
    description: 'Professional tools, productivity, business',
    keywords: ['productivity', 'business', 'enterprise', 'work', 'professional']
  },
  {
    id: 'social',
    name: 'Social',
    emoji: '👥',
    color: '#10b981',
    folderId: '',
    description: 'Social media, communities, messaging',
    keywords: ['social', 'community', 'messaging', 'forum', 'chat']
  },
  {
    id: 'news',
    name: 'News',
    emoji: '📰',
    color: '#f59e0b',
    folderId: '',
    description: 'News sites, blogs, journalism',
    keywords: ['news', 'blog', 'journalism', 'article', 'current events']
  },
  {
    id: 'tools',
    name: 'Tools',
    emoji: '🛠️',
    color: '#8b5cf6',
    folderId: '',
    description: 'Development tools, utilities, software',
    keywords: ['tool', 'utility', 'development', 'software', 'technical']
  },
  {
    id: 'learning',
    name: 'Learning',
    emoji: '📚',
    color: '#ef4444',
    folderId: '',
    description: 'Education, tutorials, courses, documentation',
    keywords: ['education', 'tutorial', 'course', 'documentation', 'learning']
  },
  {
    id: 'shopping',
    name: 'Shopping',
    emoji: '🛒',
    color: '#06b6d4',
    folderId: '',
    description: 'E-commerce, products, reviews, deals',
    keywords: ['shopping', 'ecommerce', 'product', 'review', 'deal']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    emoji: '🎮',
    color: '#ec4899',
    folderId: '',
    description: 'Games, videos, movies, music, fun',
    keywords: ['game', 'video', 'movie', 'music', 'entertainment', 'fun']
  },
  {
    id: 'finance',
    name: 'Finance',
    emoji: '💰',
    color: '#059669',
    folderId: '',
    description: 'Banking, investing, cryptocurrency',
    keywords: ['finance', 'banking', 'investing', 'cryptocurrency', 'money']
  },
  {
    id: 'health',
    name: 'Health',
    emoji: '🏥',
    color: '#dc2626',
    folderId: '',
    description: 'Medical, fitness, wellness, healthcare',
    keywords: ['health', 'medical', 'fitness', 'wellness', 'healthcare']
  },
  {
    id: 'other',
    name: 'Other',
    emoji: '📂',
    color: '#6b7280',
    folderId: '',
    description: 'Everything else',
    keywords: []
  }
];

export const APP_CONSTANTS = {
  MAX_CONTENT_LENGTH: 2000,
  AI_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  CATEGORIZATION_CONFIDENCE_THRESHOLD: 0.7,
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
} as const; 