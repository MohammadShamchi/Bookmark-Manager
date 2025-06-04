# 🚀 Quick Start Guide - AI Bookmark Manager

## ⚡ **Immediate Setup (2 minutes)**

```bash
# 1. Navigate to project
cd /Users/am0hii/dev/Bookmark-Manager

# 2. Install dependencies (if needed)
npm install

# 3. Build extension
npm run build

# 4. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode" 
# - Click "Load unpacked"
# - Select the `dist/` folder
# - Pin extension to toolbar
```

## 🧪 **Test Extension Works**

```bash
# 1. Bookmark any website (Ctrl+D / Cmd+D)
# 2. Check it gets categorized automatically  
# 3. Look for AI-prefixed folders: 🛠️ AI-Tools, 💼 AI-Work, etc.
# 4. Open background console: chrome://extensions/ → "Inspect views: service worker"
# 5. Should see: "✅ Bookmark moved successfully"
```

## 🔧 **Development Commands**

```bash
# Build for development
npm run build

# Type checking
npm run type-check

# Start development with watch
npm run dev

# Clean build
rm -rf dist/ && npm run build
```

## 🐛 **Common Debug Commands**

Open background script console (chrome://extensions/ → "Inspect views: service worker"):

```javascript
// Check if extension is working
backgroundService

// Force reset if issues
chrome.runtime.sendMessage({ type: 'RESET_CATEGORIES' })

// Test categorization
chrome.runtime.sendMessage({
  type: 'CATEGORIZE_BOOKMARK',
  data: { title: 'GitHub', url: 'https://github.com' }
})

// Get current status
chrome.runtime.sendMessage({ type: 'GET_CATEGORIES' })
chrome.runtime.sendMessage({ type: 'GET_PROCESSING_STATUS' })
```

## 📁 **Key Files for Development**

### **Core Services:**
- `src/background/service-worker.ts` - Main extension logic
- `src/services/categories.ts` - Categorization logic
- `src/services/storage.ts` - Chrome storage wrapper

### **UI Components:**
- `src/popup/App.tsx` - Main React popup
- `src/popup/styles.css` - Tailwind styles

### **Configuration:**
- `src/utils/constants.ts` - Category definitions, AI prompts
- `src/types/index.ts` - TypeScript interfaces
- `public/manifest.json` - Chrome extension manifest

## 🎯 **Next Development Tasks (Phase 2)**

### **1. OpenAI Service Integration**
Create `src/services/openai.ts`:
```typescript
export class OpenAIService {
  async categorizeBookmark(title: string, url: string, content?: string): Promise<{
    category: string;
    confidence: number; 
    reasoning: string;
  }>;
}
```

### **2. Enhanced Content Extraction**
Upgrade `src/content/page-analyzer.ts`:
- Extract meta tags, structured data
- Get page summaries for AI analysis
- Handle different content types

### **3. API Key Management UI**
Create `src/popup/components/AISettings.tsx`:
- Secure API key input/storage
- Usage tracking display
- Cost monitoring

## 📚 **Documentation Quick Reference**

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup |
| `AI_DEVELOPMENT_GUIDE.md` | Complete development context |
| `IMPLEMENTATION_PLAN.md` | Detailed roadmap and phases |
| `TROUBLESHOOTING.md` | Issue resolution guide |
| `TESTING_GUIDE.md` | Testing procedures |
| `DEVELOPMENT_STATUS.md` | Current completion status |
| `CURSOR_PROMPT.md` | AI development prompt |

## 🔥 **Hot Reload Development**

```bash
# Terminal 1: Watch for changes
npm run dev

# Terminal 2: When files change
# 1. Go to chrome://extensions/
# 2. Click refresh ↻ on extension
# 3. Test changes immediately
```

## 🚨 **Troubleshooting Quick Fixes**

| Problem | Solution |
|---------|----------|
| Extension won't load | Check `npm run build` for errors |
| Bookmarks not categorizing | Check background console for errors |
| Empty folders | Run `chrome.runtime.sendMessage({ type: 'RESET_CATEGORIES' })` |
| Runtime errors | Reload extension in chrome://extensions/ |
| Memory issues | Check memory usage should be <50MB |

## 📊 **Phase 2 Success Checklist**

- [ ] OpenAI API integration working
- [ ] >90% categorization accuracy 
- [ ] <2 second processing time
- [ ] API key management UI
- [ ] Cost optimization (<$0.01 per bookmark)
- [ ] Graceful fallback when AI unavailable

---

## 🎯 **Development Workflow**

1. **Make changes** to `src/` files
2. **Run** `npm run build`  
3. **Reload** extension in Chrome
4. **Test** with bookmark creation
5. **Check** background console for logs
6. **Commit** when feature complete

---

**⚡ Ready to code! Start with OpenAI service integration for enhanced AI categorization.** 