import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

// Existing tables...
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const conversation = pgTable("conversation", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  thinking: text("thinking"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const attachment = pgTable("attachment", {
  id: serial("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => message.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  mediaType: text("media_type"),
  filename: text("filename"),
  size: text("size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NEW: Conversation Summary Table
export const conversationSummary = pgTable("conversation_summary", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .unique()
    .references(() => conversation.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // AI-generated title
  summary: text("summary").notNull(), // Overall conversation summary
  keyPoints: jsonb("key_points").$type<string[]>(), // Main discussion points
  topics: jsonb("topics").$type<string[]>(), // Main topics discussed
  sentiment: text("sentiment"), // "positive" | "neutral" | "negative" | "mixed"
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// NEW: Tags Table (for categorization)
export const tag = pgTable("tag", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category"), // e.g., "technical", "personal", "work"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NEW: Conversation Tags (many-to-many relationship)
export const conversationTag = pgTable("conversation_tag", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tag.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NEW: Conversation Insights (optional detailed analytics)
export const conversationInsight = pgTable("conversation_insight", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  insightType: text("insight_type").notNull(), // "question", "solution", "decision", "action_item"
  content: text("content").notNull(),
  messageId: text("message_id").references(() => message.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
