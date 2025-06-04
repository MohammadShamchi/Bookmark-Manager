import { Category } from '@/types';

// AI Categorization Prompt
export const CATEGORIZATION_PROMPT = `
You are a bookmark categorization AI. Analyze the following bookmark and categorize it into ONE of these categories:

Categories:
- Work: Professional tools, productivity, business, enterprise software
- Social: Social media, forums, communities, messaging
- News: News sites, blogs, journalism, current events  
- Tools: Development tools, utilities, software, technical resources
- Learning: Education, tutorials, courses, documentation, research
- Shopping: E-commerce, products, reviews, deals
- Entertainment: Games, videos, movies, music, fun content
- Finance: Banking, investing, cryptocurrency, financial tools
- Health: Medical, fitness, wellness, healthcare
- Other: Everything else

Respond with ONLY the category name.

Bookmark:
Title: {title}
URL: {url}
Content: {content}
`;

// Folder Names for Categories
export const CATEGORY_FOLDERS = {
  work: '💼 Work',
  social: '👥 Social', 
  news: '📰 News',
  tools: '🛠️ Tools',
  learning: '📚 Learning',
  shopping: '🛒 Shopping',
  entertainment: '🎮 Entertainment',
  finance: '💰 Finance',
  health: '🏥 Health',
  other: '📂 Other'
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'ai_bookmark_settings',
  CATEGORIES: 'ai_bookmark_categories',
  BOOKMARKS: 'ai_bookmark_data',
  LAST_SYNC: 'ai_bookmark_last_sync'
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  aiEnabled: true,
  autoOrganize: true,
  soundEnabled: true,
  theme: 'light' as const,
  confidenceThreshold: 0.7,
  maxRetries: 3
};

// OpenAI Configuration
export const OPENAI_CONFIG = {
  model: 'gpt-3.5-turbo' as const,
  maxTokens: 10,
  temperature: 0.1,
  timeout: 10000
};

// Extension URLs - will be set at runtime
export const getExtensionUrls = () => ({
  popup: (globalThis as any).chrome?.runtime?.getURL?.('popup/popup.html') || '',
  options: (globalThis as any).chrome?.runtime?.getURL?.('options/options.html') || ''
});

// Audio Files
export const SOUNDS = {
  success: 'sounds/success.mp3',
  error: 'sounds/error.mp3',
  notification: 'sounds/notification.mp3'
} as const;

// Regular Expressions for URL Analysis
export const URL_PATTERNS = {
  social: /^https?:\/\/(www\.)?(facebook|twitter|instagram|linkedin|reddit|discord|slack|telegram)\.com/i,
  shopping: /^https?:\/\/(www\.)?(amazon|ebay|shopify|etsy|alibaba|walmart|target)\.com/i,
  news: /^https?:\/\/(www\.)?(cnn|bbc|reuters|nytimes|guardian|techcrunch|hackernews)\.com/i,
  tools: /^https?:\/\/(www\.)?(github|stackoverflow|npmjs|docker|aws|google\.dev|microsoft\.com\/docs)/i,
  learning: /^https?:\/\/(www\.)?(udemy|coursera|edx|khan|youtube\.com\/watch|medium\.com)/i,
  finance: /^https?:\/\/(www\.)?(paypal|stripe|coinbase|binance|robinhood|fidelity)\.com/i
};

// Error Messages
export const ERROR_MESSAGES = {
  AI_TIMEOUT: 'AI categorization timed out',
  AI_QUOTA_EXCEEDED: 'AI quota exceeded for today',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_API_KEY: 'Invalid OpenAI API key',
  BOOKMARK_ACCESS_DENIED: 'Bookmark access denied',
  STORAGE_FULL: 'Storage quota exceeded',
  UNKNOWN_ERROR: 'An unknown error occurred'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKMARK_ORGANIZED: 'Bookmark successfully organized!',
  SETTINGS_SAVED: 'Settings saved successfully',
  CATEGORIES_UPDATED: 'Categories updated',
  AI_CONNECTED: 'AI service connected'
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  short: 200,
  medium: 300,
  long: 500,
  notification: 3000
} as const; 