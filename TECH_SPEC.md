# Technical Specification - AI Bookmark Manager

## Architecture Overview




## Core Components

### Background Service Worker
- **File**: `background/service-worker.ts`
- **Purpose**: Listen for bookmark events, trigger AI analysis
- **APIs**: chrome.bookmarks, chrome.storage, OpenAI API

### AI Service
- **File**: `services/ai-categorizer.ts`
- **Purpose**: Categorize bookmarks using OpenAI
- **Input**: Bookmark title, URL, page content
- **Output**: Category + confidence score

### Content Scripts
- **File**: `content/page-analyzer.ts`
- **Purpose**: Extract page metadata and content
- **Injection**: On bookmark creation only

### Popup UI
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand for state management

## Data Models

### Bookmark
```typescript
interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: Category;
  confidence: number;
  dateAdded: number;
  tags?: string[];
}





Category


interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  folderId: string;
}




API Integration

Provider: OpenAI GPT-3.5-turbo
Cost: ~$0.01 per categorization
Fallback: Local keyword-based categorization
Rate Limiting: 10 requests/minute

Performance Requirements

Categorization: <2 seconds
UI Load: <500ms
Memory Usage: <50MB
API Calls: Batched when possible