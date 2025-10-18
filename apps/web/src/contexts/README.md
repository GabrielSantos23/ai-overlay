# Chat Context

This directory contains the chat functionality that has been moved from the `/ai/$id` page to work with the floating menu (`ChatPanel2`).

## Files

- `ChatContext.tsx` - Main context provider that manages chat state, messages, and AI integration
- `useChatConversation.ts` - Hook for easy conversation management

## Features

### ChatContext

- **Message Management**: Handles both user and AI messages with proper transformation
- **Screenshot Integration**: Automatically captures screenshots when enabled
- **File Attachments**: Support for file uploads and paste operations
- **AI Integration**: Uses `@ai-sdk/react` for AI chat functionality
- **Conversation Management**: Generates unique conversation IDs and loads existing conversations
- **Settings**: Model selection, web search toggle, screenshot toggle

### Key Functions

- `sendMessage()` - Sends a message with attachments and screenshots
- `captureAndAddScreenshot()` - Captures screen and adds to attachments
- `startNewChat()` - Starts a new conversation
- `loadConversation(id)` - Loads an existing conversation by ID
- `handleFileSelect()` - Handles file selection
- `handlePaste()` - Handles paste operations for images
- `handleEdit()` - Edit message functionality
- `handleRegenerate()` - Regenerate AI response

## Usage

The context is automatically provided at the root level, so any component can use it:

```tsx
import { useChatContext } from "@/contexts/ChatContext";

function MyComponent() {
  const {
    messages,
    text,
    setText,
    sendMessage,
    // ... other properties
  } = useChatContext();

  // Use the chat functionality
}
```

## Integration with ChatPanel2

The `ChatPanel2` component now uses this context instead of managing its own state, providing:

- Real AI chat functionality
- Screenshot capture from Electron
- File attachment support
- Conversation persistence
- Proper message rendering with UserMessage and AIMessage components

## Screenshot Integration

Screenshots are automatically captured when:

1. Screenshot is enabled (toggle button in UI)
2. A message is sent
3. The Electron API is available (`window.electronAPI.captureScreenshot`)

The screenshot is added to the message attachments and sent to the AI along with the text.
