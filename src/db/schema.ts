import { pgTable, text, timestamp, boolean, jsonb, uuid, integer, unique, index, primaryKey } from 'drizzle-orm/pg-core';
import type { BadgeCriteria } from '../types/community.js';

// ══════════════════════════════════════════════════════════════════
// AUTH TABLES
// ══════════════════════════════════════════════════════════════════

// Users table - core authentication
// IMPORTANT: Email must ALWAYS be normalized to lowercase before insert
// Use validateEmail() from auth.ts to ensure normalization
//
// MIGRATION REQUIRED: Run this SQL to enforce case-insensitivity at DB level:
// DROP INDEX IF EXISTS users_email_key;
// CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(), // Always store lowercase via validateEmail()
  passwordHash: text('password_hash'), // null if OAuth only
  emailVerifiedAt: timestamp('email_verified_at'),
  invitedBy: uuid('invited_by'), // references users.id (self-referential)
  inviteId: uuid('invite_id'), // references invites.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Profiles table - extended user info
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  company: text('company'),
  jobTitle: text('job_title'),
  bio: text('bio'),
  industry: text('industry'),
  certifications: jsonb('certifications').$type<string[]>(), // ["CPSM", "CSCP"]
  interests: jsonb('interests').$type<string[]>(), // ["risk", "sourcing"]
  reputation: integer('reputation').default(0).notNull(),
  inviteSlots: integer('invite_slots').default(0).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  anonymousDefault: boolean('anonymous_default').default(false).notNull(),
  onboardingStep: text('onboarding_step').default('profile'), // profile, interests, complete
  // Streak tracking
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table - database-backed sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invites table - invite codes for registration
export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  type: text('type').notNull(), // 'direct', 'link', 'company'
  email: text('email'), // null for link invites
  invitedBy: uuid('invited_by').references(() => users.id),
  maxUses: integer('max_uses').default(1).notNull(),
  useCount: integer('use_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata'), // { company_id, role, notes }
});

// Invite uses - track who used each invite
export const inviteUses = pgTable('invite_uses', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviteId: uuid('invite_id').notNull().references(() => invites.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  usedAt: timestamp('used_at').defaultNow().notNull(),
}, (table) => [
  // Prevent same user from using same invite twice
  unique('invite_user_unique').on(table.inviteId, table.userId),
]);

// Waitlist table - pre-registration queue
export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  company: text('company'),
  jobTitle: text('job_title'),
  reason: text('reason'), // "Why do you want to join?"
  referralSource: text('referral_source'), // "How did you hear about us?"
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  inviteId: uuid('invite_id').references(() => invites.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
});

// Verification tokens - email verification, password reset
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(), // email
  tokenHash: text('token_hash').notNull(),
  type: text('type').notNull(), // 'email_verify' | 'password_reset' (see VerificationTokenType)
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  // Index for efficient lookups
  index('verification_tokens_identifier_type_idx').on(table.identifier, table.type),
]);

// Visitor claims - link anonymous visitors to users
export const visitorClaims = pgTable('visitor_claims', {
  visitorId: text('visitor_id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  claimedAt: timestamp('claimed_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════
// EXISTING TABLES (with auth extension)
// ══════════════════════════════════════════════════════════════════

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorId: text('visitor_id').notNull(), // Anonymous user tracking (kept for backwards compat)
  userId: uuid('user_id').references(() => users.id), // Linked user (nullable for migration)
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

// ══════════════════════════════════════════════════════════════════
// TypeScript types inferred from schema
// ══════════════════════════════════════════════════════════════════

// Auth types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type InviteUse = typeof inviteUses.$inferSelect;
export type NewInviteUse = typeof inviteUses.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type VisitorClaim = typeof visitorClaims.$inferSelect;
export type NewVisitorClaim = typeof visitorClaims.$inferInsert;

// Existing types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// COMMUNITY Q&A TABLES
// ══════════════════════════════════════════════════════════════════

// Tags for categorizing questions
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  questionCount: integer('question_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Questions
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  aiContextSummary: text('ai_context_summary'),
  score: integer('score').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  answerCount: integer('answer_count').default(0).notNull(),
  acceptedAnswerId: uuid('accepted_answer_id'),
  status: text('status').default('open').notNull(), // 'open' | 'answered' | 'closed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('questions_user_id_idx').on(table.userId),
  index('questions_status_idx').on(table.status),
  index('questions_created_at_idx').on(table.createdAt),
]);

// Question-Tag junction table
export const questionTags = pgTable('question_tags', {
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.questionId, table.tagId] }),
]);

// Answers
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  score: integer('score').default(0).notNull(),
  isAccepted: boolean('is_accepted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('answers_question_id_idx').on(table.questionId),
  index('answers_user_id_idx').on(table.userId),
]);

// Votes (polymorphic for questions and answers)
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  targetType: text('target_type').notNull(), // 'question' | 'answer'
  targetId: uuid('target_id').notNull(),
  value: integer('value').notNull(), // +1 or -1
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('votes_user_target_unique').on(table.userId, table.targetType, table.targetId),
  index('votes_target_idx').on(table.targetType, table.targetId),
]);

// Badges
export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  tier: text('tier').notNull(), // 'bronze' | 'silver' | 'gold'
  icon: text('icon').notNull(), // Lucide icon name
  criteria: jsonb('criteria').$type<BadgeCriteria>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Badges (awarded badges)
export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  badgeId: uuid('badge_id').notNull().references(() => badges.id),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
}, (table) => [
  unique('user_badges_unique').on(table.userId, table.badgeId),
  index('user_badges_user_id_idx').on(table.userId),
]);

// Reputation Log (audit trail)
export const reputationLog = pgTable('reputation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  change: integer('change').notNull(),
  reason: text('reason').notNull(), // 'question_upvoted', 'answer_accepted', etc.
  sourceType: text('source_type'), // 'question' | 'answer' | 'vote'
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('reputation_log_user_id_idx').on(table.userId),
]);

// Community types
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type DbQuestion = typeof questions.$inferSelect;
export type NewDbQuestion = typeof questions.$inferInsert;
export type QuestionTag = typeof questionTags.$inferSelect;
export type NewQuestionTag = typeof questionTags.$inferInsert;
export type DbAnswer = typeof answers.$inferSelect;
export type NewDbAnswer = typeof answers.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type ReputationLogEntry = typeof reputationLog.$inferSelect;
export type NewReputationLogEntry = typeof reputationLog.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// SUPPLIER & PORTFOLIO TABLES
// ══════════════════════════════════════════════════════════════════

// Risk factor scores stored as JSON
export interface RiskFactorScore {
  id: string;
  name: string;
  tier: 'freely-displayable' | 'conditionally-displayable' | 'restricted';
  weight: number;
  score?: number;
  rating?: string;
}

// Suppliers table - core supplier data
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  duns: text('duns').unique(),
  category: text('category').notNull(),
  industry: text('industry'),
  city: text('city'),
  country: text('country').notNull(),
  region: text('region').notNull(), // 'North America', 'Europe', 'Asia Pacific', 'Latin America'
  spend: integer('spend').default(0).notNull(), // in cents/minor units
  spendFormatted: text('spend_formatted'),
  criticality: text('criticality').default('medium').notNull(), // 'low', 'medium', 'high'
  revenue: text('revenue'), // e.g., "$394B Revenue"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('suppliers_category_idx').on(table.category),
  index('suppliers_region_idx').on(table.region),
  index('suppliers_country_idx').on(table.country),
]);

// Supplier Risk Scores - current and historical
export const supplierRiskScores = pgTable('supplier_risk_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  score: integer('score').default(0).notNull(), // 0-100
  level: text('level').notNull(), // 'low', 'medium', 'medium-high', 'high', 'unrated'
  trend: text('trend').default('stable').notNull(), // 'improving', 'stable', 'worsening'
  previousScore: integer('previous_score'),
  factors: jsonb('factors').$type<RiskFactorScore[]>().default([]),
  scoreHistory: jsonb('score_history').$type<number[]>().default([]), // Last 9 data points
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('supplier_risk_scores_supplier_id_idx').on(table.supplierId),
  index('supplier_risk_scores_level_idx').on(table.level),
  unique('supplier_risk_scores_supplier_unique').on(table.supplierId),
]);

// User Portfolios - which suppliers a user follows
export const userPortfolios = pgTable('user_portfolios', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  notes: text('notes'),
  alertsEnabled: boolean('alerts_enabled').default(true).notNull(),
}, (table) => [
  unique('user_portfolio_unique').on(table.userId, table.supplierId),
  index('user_portfolios_user_id_idx').on(table.userId),
]);

// Risk Changes - track significant risk score changes
export const riskChanges = pgTable('risk_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  previousScore: integer('previous_score').notNull(),
  previousLevel: text('previous_level').notNull(),
  currentScore: integer('current_score').notNull(),
  currentLevel: text('current_level').notNull(),
  direction: text('direction').notNull(), // 'improved', 'worsened', 'stable'
  changeReason: text('change_reason'), // Optional explanation
  changeDate: timestamp('change_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('risk_changes_supplier_id_idx').on(table.supplierId),
  index('risk_changes_date_idx').on(table.changeDate),
  index('risk_changes_direction_idx').on(table.direction),
]);

// Supplier types
export type DbSupplier = typeof suppliers.$inferSelect;
export type NewDbSupplier = typeof suppliers.$inferInsert;
export type DbSupplierRiskScore = typeof supplierRiskScores.$inferSelect;
export type NewDbSupplierRiskScore = typeof supplierRiskScores.$inferInsert;
export type DbUserPortfolio = typeof userPortfolios.$inferSelect;
export type NewDbUserPortfolio = typeof userPortfolios.$inferInsert;
export type DbRiskChange = typeof riskChanges.$inferSelect;
export type NewDbRiskChange = typeof riskChanges.$inferInsert;
