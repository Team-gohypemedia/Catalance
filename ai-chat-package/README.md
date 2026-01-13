# AI Chat Integration Package

A ready-to-use AI chat system with service questionnaire and proposal generation.

## 📁 Package Contents

```
ai-chat-package/
├── backend/
│   ├── routes/
│   │   └── ai.js              # Express routes for AI chat
│   ├── services/
│   │   └── aiService.js       # AI service with OpenRouter
│   └── data/
│       └── servicesComplete.json  # Service questions data
├── frontend/
│   ├── AIChat.jsx             # React chat component
│   └── AIChat.css             # Chat styling
└── README.md                  # This file
```

## 🚀 Quick Setup

### Step 1: Backend Setup

1. **Copy the backend folder** to your server's `src/` directory

2. **Install dependencies** (if not already installed):
   ```bash
   npm install express
   ```

3. **Add environment variable** to your `.env`:
   ```env
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. **Register routes** in your main server file:
   ```javascript
   import aiRoutes from './routes/ai.js';
   app.use('/api/ai', aiRoutes);
   ```

### Step 2: Frontend Setup

1. **Copy the frontend folder** contents to your components directory

2. **Import and use** the chat component:
   ```jsx
   import AIChat from './components/AIChat';
   
   function App() {
     return <AIChat />;
   }
   ```

3. **Update the API URL** in `AIChat.jsx` if needed:
   ```javascript
   const API_URL = 'http://your-server-url/api';
   ```

## ⚙️ Customization

### Change Services/Questions
Edit `servicesComplete.json` to add your own services and questions.

### Modify AI Behavior
Edit `aiService.js` - update the `buildSystemPrompt()` function.

### Style the Chat
Edit `AIChat.css` to match your brand colors and design.

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Send message to AI |
| `/api/ai/services` | GET | Get all services |
| `/api/ai/services/:id` | GET | Get specific service |

### Chat Request Example:
```javascript
fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "I need a website",
    conversationHistory: []
  })
})
```

## 🔑 Get Your API Key

Get an OpenRouter API key at: https://openrouter.ai/keys
