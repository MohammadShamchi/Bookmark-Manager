import { PageContent } from '@/types';
import { extractKeywords, sanitizeText, extractDomain } from '@/utils/helpers';
import { APP_CONSTANTS } from '@/types';

class PageAnalyzer {
  private isAnalyzing = false;
  private analysisCache = new Map<string, PageContent>();

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ANALYZE_PAGE') {
          this.analyzePage()
            .then(content => {
              sendResponse({ success: true, data: content });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          return true; // Keep the message channel open
        }
      });
    }
  }

  public async analyzePage(): Promise<PageContent> {
    if (this.isAnalyzing) {
      throw new Error('Page analysis already in progress');
    }

    const url = window.location.href;
    
    // Check cache first
    if (this.analysisCache.has(url)) {
      return this.analysisCache.get(url)!;
    }

    this.isAnalyzing = true;

    try {
      const content: PageContent = {
        title: this.extractTitle(),
        description: this.extractDescription(),
        keywords: this.extractKeywordsFromMeta(),
        text: this.extractMainContent(),
        language: this.detectLanguage(),
        domain: extractDomain(url || window.location.href)
      };

      // Cache the result
      this.analysisCache.set(url, content);
      
      // Limit cache size
      if (this.analysisCache.size > 10) {
        const firstKey = this.analysisCache.keys().next().value;
        if (firstKey) {
          this.analysisCache.delete(firstKey);
        }
      }

      return content;
    } finally {
      this.isAnalyzing = false;
    }
  }

  private extractTitle(): string {
    // Try multiple sources for title
    const sources = [
      () => document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      () => document.querySelector('h1')?.textContent,
      () => document.title,
      () => document.querySelector('title')?.textContent
    ];

    for (const source of sources) {
      try {
        const title = source();
        if (title && title.trim()) {
          return sanitizeText(title.trim());
        }
      } catch (error) {
        console.warn('Error extracting title from source:', error);
      }
    }

    return 'Untitled Page';
  }

  private extractDescription(): string {
    // Try multiple sources for description
    const sources = [
      () => document.querySelector('meta[name="description"]')?.getAttribute('content'),
      () => document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
      () => document.querySelector('meta[itemprop="description"]')?.getAttribute('content'),
      () => this.extractFirstParagraph()
    ];

    for (const source of sources) {
      try {
        const description = source();
        if (description && description.trim()) {
          return sanitizeText(description.trim());
        }
      } catch (error) {
        console.warn('Error extracting description from source:', error);
      }
    }

    return '';
  }

  private extractFirstParagraph(): string {
    const paragraphs = document.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text && text.length > 50) {
        return text.slice(0, 200);
      }
    }
    return '';
  }

  private extractKeywordsFromMeta(): string[] {
    const keywords: string[] = [];

    // Extract from meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (metaKeywords) {
      keywords.push(...metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0));
    }

    // Extract from meta tags
    const tags = document.querySelector('meta[property="article:tag"]')?.getAttribute('content');
    if (tags) {
      keywords.push(...tags.split(',').map(k => k.trim()).filter(k => k.length > 0));
    }

    // Extract from heading tags
    const headings = document.querySelectorAll('h1, h2, h3');
    for (const heading of headings) {
      const text = heading.textContent?.trim();
      if (text) {
        keywords.push(...extractKeywords(text, 3));
      }
    }

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, 10);
  }

  private extractMainContent(): string {
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      'article',
      '.container'
    ];

    let mainContent = '';

    // Try to find main content area
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = this.extractTextFromElement(element);
        if (mainContent.length > 100) {
          break;
        }
      }
    }

    // Fallback to body content if main content not found
    if (mainContent.length < 100) {
      mainContent = this.extractTextFromElement(document.body);
    }

    // Clean and limit content
    return sanitizeText(mainContent).slice(0, APP_CONSTANTS.MAX_CONTENT_LENGTH);
  }

  private extractTextFromElement(element: Element): string {
    if (!element) return '';

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as Element;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.navigation',
      '.menu',
      '.sidebar',
      '.comments',
      '[role="navigation"]',
      '[role="complementary"]'
    ];

    for (const selector of unwantedSelectors) {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    }

    // Extract text content
    const text = clone.textContent || '';
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  private detectLanguage(): string {
    // Try multiple sources for language detection
    const sources = [
      () => document.documentElement.lang,
      () => document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="language"]')?.getAttribute('content'),
      () => document.querySelector('html')?.getAttribute('lang')
    ];

    for (const source of sources) {
      try {
        const lang = source();
        if (lang && lang.trim()) {
          return lang.trim().toLowerCase();
        }
      } catch (error) {
        console.warn('Error detecting language from source:', error);
      }
    }

    // Simple language detection based on content
    return this.simpleLanguageDetection();
  }

  private simpleLanguageDetection(): string {
    const text = document.body.textContent?.toLowerCase() || '';
    
    // Common English words
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    const englishMatches = englishWords.filter(word => text.includes(word)).length;

    // Common Spanish words
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const spanishMatches = spanishWords.filter(word => text.includes(word)).length;

    // Common French words
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
    const frenchMatches = frenchWords.filter(word => text.includes(word)).length;

    if (englishMatches >= spanishMatches && englishMatches >= frenchMatches) {
      return 'en';
    } else if (spanishMatches >= frenchMatches) {
      return 'es';
    } else if (frenchMatches > 0) {
      return 'fr';
    }

    return 'en'; // Default to English
  }

  // Utility method to get structured page data
  public getStructuredData(): any {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const structuredData: any[] = [];

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        structuredData.push(data);
      } catch (error) {
        console.warn('Error parsing structured data:', error);
      }
    }

    return structuredData;
  }

  // Utility method to extract social media information
  public getSocialMetadata(): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
    
    for (const tag of metaTags) {
      const property = tag.getAttribute('property') || tag.getAttribute('name');
      const content = tag.getAttribute('content');
      
      if (property && content) {
        metadata[property] = content;
      }
    }
    
    return metadata;
  }

  // Method to extract article-specific information
  public getArticleMetadata(): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    // Article published time
    const publishedTime = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                         document.querySelector('time[datetime]')?.getAttribute('datetime') ||
                         document.querySelector('[itemprop="datePublished"]')?.getAttribute('content');
    
    if (publishedTime) {
      metadata.publishedTime = publishedTime;
    }

    // Article author
    const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                  document.querySelector('[rel="author"]')?.textContent ||
                  document.querySelector('[itemprop="author"]')?.textContent;
    
    if (author) {
      metadata.author = author.trim();
    }

    // Article section/category
    const section = document.querySelector('meta[property="article:section"]')?.getAttribute('content');
    if (section) {
      metadata.section = section;
    }

    return metadata;
  }
}

// Initialize the page analyzer
const pageAnalyzer = new PageAnalyzer();

// Export for potential direct usage
if (typeof window !== 'undefined') {
  (window as any).pageAnalyzer = pageAnalyzer;
} 