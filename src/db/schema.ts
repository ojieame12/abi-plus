import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorId: text('visitor_id').notNull(), // Anonymous user tracking
  title: text('title').notNull(),
  category: text('category').notNull().default('general'), // suppliers, categories, risk, research, general
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  // Store AI response metadata as JSON
  metadata: jsonb('metadata'), // sources, widget data, insights, etc.
});

// TypeScript types inferred from schema
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
