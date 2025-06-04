import { Category, PageContent, DEFAULT_CATEGORIES } from '@/types';
import { URL_PATTERNS } from './constants';

// URL Analysis Helpers
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const categorizeByUrl = (url: string): string | null => {
  for (const [category, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) {
      return category;
    }
  }
  return null;
};

// Text Processing Helpers
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractKeywords = (text: string, maxWords: number = 10): string[] => {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
    'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, maxWords);
};

// Error Handling
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Category Management
export const findCategoryById = (categoryId: string, categories: Category[] = DEFAULT_CATEGORIES): Category | undefined => {
  return categories.find(cat => cat.id === categoryId);
};

export const getCategoryByName = (name: string, categories: Category[] = DEFAULT_CATEGORIES): Category | undefined => {
  return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

// Storage Helpers
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
};

// Date/Time Helpers
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return formatDate(timestamp);
  }
};

// Validation Helpers
export const isValidApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-') && apiKey.length > 20;
};

export const validateBookmarkData = (data: any): boolean => {
  return (
    data &&
    typeof data.title === 'string' &&
    typeof data.url === 'string' &&
    isValidUrl(data.url)
  );
};

// Performance Helpers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Sound Helpers
export const playSound = async (soundFile: string, volume: number = 0.5): Promise<void> => {
  try {
    const audio = new Audio(soundFile);
    audio.volume = volume;
    await audio.play();
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// Chrome Extension Helpers
export const isExtensionContext = (): boolean => {
  return typeof (globalThis as any).chrome !== 'undefined' && 
         (globalThis as any).chrome.runtime !== undefined;
};

export const getCurrentTab = async (): Promise<any> => {
  if (!isExtensionContext()) return null;
  
  try {
    const chrome = (globalThis as any).chrome;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  } catch {
    return null;
  }
};

// Confidence Score Helpers
export const calculateConfidence = (
  urlMatch: boolean,
  keywordMatches: number,
  titleRelevance: number
): number => {
  let confidence = 0;
  
  if (urlMatch) confidence += 0.4;
  confidence += Math.min(keywordMatches * 0.1, 0.3);
  confidence += titleRelevance * 0.3;
  
  return Math.min(confidence, 1.0);
};

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}; 