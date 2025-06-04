# API Specification

## OpenAI Integration

### Categorization Prompt
```typescript
const CATEGORIZATION_PROMPT = `
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


Request Format
typescriptinterface CategorizationRequest {
  model: "gpt-3.5-turbo";
  messages: [
    { role: "system", content: string },
    { role: "user", content: string }
  ];
  max_tokens: 10;
  temperature: 0.1;
}
Response Handling
typescriptinterface CategorizationResponse {
  category: string;
  confidence: number;
  processingTime: number;
  error?: string;
}
