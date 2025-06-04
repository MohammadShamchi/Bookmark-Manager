### 3. **PROJECT_STRUCTURE.md**
```markdown
# Project Structure

## Directory Layout


bookmark-ai-extension/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── sounds/
├── src/
│   ├── background/
│   │   ├── service-worker.ts
│   │   ├── ai-service.ts
│   │   └── bookmark-handler.ts
│   ├── content/
│   │   ├── page-analyzer.ts
│   │   └── notification.ts
│   ├── popup/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   ├── services/
│   │   ├── storage.ts
│   │   ├── categories.ts
│   │   └── openai.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── webpack.config.js


## Technology Stack
- **Language**: TypeScript
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **Build**: Webpack
- **AI**: OpenAI API
- **Testing**: Jest + React Testing Library