/**
 * Shared types for the Aether AI application
 * These types are derived from the Convex schema and used across the UI
 */

import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";

// Base types from Convex schema
export type MessageRole = "user" | "assistant";

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface Message {
  _id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  thinking?: string;
  thinkingDuration?: number;
  isComplete?: boolean;
  isCancelled?: boolean;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  createdAt: number;
}

// Message state interface for UI components
export interface MessageState {
  isComplete?: boolean;
  content?: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

// Upload-related types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  key: string;
}

// Tool call result types
export interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
  score?: number;
}

export interface WebSearchResult {
  results: SearchResult[];
  query: string;
  timestamp: number;
}

// Session and user types
export interface SessionItem {
  sessionToken: string;
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  createdAt?: number;
  expires: number;
}

// Model types
export interface ModelInfo {
  id: string;
  name: string;
  icon?: string;
  provider?: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
}

// Research and tool types
export interface ResearchAction {
  type: "search" | "read";
  toolCallId: string;
  thoughts: string;
  query?: string;
  url?: string;
  timestamp: number;
}

export interface ResearchSession {
  _id: string;
  userId: string;
  prompt: string;
  thoughts: string;
  status: "running" | "completed" | "failed";
  summary?: string;
  actions: ResearchAction[];
  createdAt: number;
  completedAt?: number;
}

// Chat types
export interface Chat {
  _id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  shareId?: string;
  isShared?: boolean;
  isGeneratingTitle?: boolean;
  isBranch?: boolean;
  isPinned?: boolean;
}

// User settings types
export type MainFont = "inter" | "system" | "serif" | "mono" | "roboto-slab";
export type CodeFont =
  | "fira-code"
  | "mono"
  | "consolas"
  | "jetbrains"
  | "source-code-pro";
export type SendBehavior = "enter" | "shiftEnter" | "button";

export interface UserSettings {
  userId: string;
  uploadthing_key?: string;
  tavily_key?: string;
  userName?: string;
  userRole?: string;
  userTraits?: string[];
  userAdditionalInfo?: string;
  promptTemplate?: string;
  mainFont?: MainFont;
  codeFont?: CodeFont;
  sendBehavior?: SendBehavior;
  autoSave?: boolean;
  showTimestamps?: boolean;
  disabledModels?: string[];
  mem0Enabled?: boolean;
  observations?: string[];
}

// API key types
export type ApiKeyService =
  | "gemini"
  | "groq"
  | "openrouter"
  | "moonshot"
  | "deepgram";

export interface ApiKey {
  _id: string;
  userId: string;
  service: ApiKeyService;
  name: string;
  key: string;
  is_default?: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface UseCompletionReturn {
  // Input management
  /** Current input text value */
  input: string;
  /** Function to update the input text */
  setInput: (value: string) => void;

  // Response management
  /** Current AI response text */
  response: string;
  /** Function to update the response text */
  setResponse: (value: string) => void;

  // Loading and error states
  /** Whether a completion request is currently in progress */
  isLoading: boolean;
  /** Current error message, null if no error */
  error: string | null;

  // File attachment management
  /** Array of currently attached files */
  attachedFiles: any[];
  /** Function to add a file to attachments */
  addFile: (file: File) => Promise<void>;
  /** Function to remove a file by its ID */
  removeFile: (fileId: string) => void;
  /** Function to clear all attached files */
  clearFiles: () => void;

  // Completion actions
  /** Function to submit the completion request, optionally with speech text */
  submit: (speechText?: string) => Promise<void>;
  /** Function to cancel the current completion request */
  cancel: () => void;
  /** Function to reset the completion state (clears input, response, error, files) */
  reset: () => void;

  // State management
  /** Direct state setter for advanced use cases */
  setState: Dispatch<SetStateAction<any>>;

  // Voice Activity Detection (VAD) and microphone
  /** Whether Voice Activity Detection is enabled */
  enableVAD: boolean;
  /** Function to toggle VAD state */
  setEnableVAD: Dispatch<SetStateAction<boolean>>;
  /** Whether microphone is currently open/active */
  micOpen: boolean;
  /** Function to control microphone state */
  setMicOpen: Dispatch<SetStateAction<boolean>>;

  // Conversation management
  /** ID of the currently active conversation, null for new conversation */
  currentConversationId: string | null;
  /** Array of messages in the current conversation */
  conversationHistory: any[];
  /** Function to load an existing conversation */
  loadConversation: (conversation: any) => void;
  /** Function to start a new conversation (clears current state) */
  startNewConversation: () => void;

  // UI state management
  /** Whether the message history modal/panel is open */
  messageHistoryOpen: boolean;
  /** Function to control message history panel visibility */
  setMessageHistoryOpen: Dispatch<SetStateAction<boolean>>;
  /** Whether keep engaged mode is active (keeps popover open for continuous conversation) */
  keepEngaged: boolean;
  /** Function to toggle keep engaged mode */
  setKeepEngaged: Dispatch<SetStateAction<boolean>>;

  // Screenshot functionality
  /** Current screenshot configuration settings */
  screenshotConfiguration: any;
  /** Function to update screenshot configuration */
  setScreenshotConfiguration: Dispatch<SetStateAction<any>>;
  /** Function to handle screenshot submission with optional prompt */
  handleScreenshotSubmit: (base64: string, prompt?: string) => Promise<void>;

  // File selection and keyboard handling
  /** Event handler for file input changes */
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Event handler for keyboard interactions (Enter to submit) */
  handleKeyPress: (e: KeyboardEvent) => void;
  /** Event handler for paste events to handle image pasting */
  handlePaste: (e: ClipboardEvent) => Promise<void>;

  // UI helpers and computed values
  /** Whether any popover/modal should be open (computed from loading/response/error state) */
  isPopoverOpen: boolean;
  /** Ref for the scroll area container (for auto-scrolling) */
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  /** Function to resize the application window based on UI state */
  resizeWindow: (expanded: boolean) => Promise<void>;

  // Files popover management
  /** Whether the files attachment popover is open */
  isFilesPopoverOpen: boolean;
  /** Function to control files popover visibility */
  setIsFilesPopoverOpen: Dispatch<SetStateAction<boolean>>;
  /** Function to remove all files and close the files popover */
  onRemoveAllFiles: () => void;

  /** Ref for the input element */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Function to capture a screenshot */
  captureScreenshot: () => Promise<void>;
  /** Whether a screenshot is currently loading */
  isScreenshotLoading: boolean;
}
