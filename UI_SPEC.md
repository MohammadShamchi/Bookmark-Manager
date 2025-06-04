### 5. **UI_SPEC.md** (UI/UX Specification)
```markdown
# UI/UX Specification

## Design System

### Colors
```css
--primary: #3B82F6;     /* Blue */
--secondary: #8B5CF6;   /* Purple */
--success: #10B981;     /* Green */
--warning: #F59E0B;     /* Orange */
--error: #EF4444;       /* Red */
--surface: #FFFFFF;     /* White */
--background: #F8FAFC;  /* Light Gray */



Typography

Font: Inter, system-ui
Heading: 24px, 20px, 18px, 16px
Body: 14px, 12px
Weight: 400, 500, 600, 700

Animation Guidelines

Duration: 200ms (fast), 300ms (normal), 500ms (slow)
Easing: ease-out for entrances, ease-in for exits
Hover: Scale 1.02, opacity 0.8
Success: Bounce animation + green checkmark

Component Specifications
Notification Toast
typescriptinterface NotificationProps {
  category: string;
  emoji: string;
  title: string;
  duration?: number; // default 3000ms
  position?: 'top-right' | 'bottom-right'; // default top-right
}
Category Card
typescriptinterface CategoryCardProps {
  category: Category;
  bookmarkCount: number;
  onClick: () => void;
  isSelected?: boolean;
}
Bookmark Item
typescriptinterface BookmarkItemProps {
  bookmark: Bookmark;
  showCategory?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}
User Flows
Primary Flow: Auto-Categorization

User bookmarks page (Ctrl+D)
Loading spinner appears (200ms delay)
Success notification slides in from top-right
Notification shows: "✨ Saved to 📚 Learning"
Gentle success sound plays
Notification auto-hides after 3s

Secondary Flow: Manual Management

User clicks extension icon
Popup opens with smooth fade-in (300ms)
Categories display in grid with hover animations
User can search, filter, drag-drop bookmarks
All changes auto-save with visual feedback