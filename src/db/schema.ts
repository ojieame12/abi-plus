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
  interests: jsonb('interests').$type<import('../types/interests').Interest[]>(), // Structured interest objects (backward compat with legacy string[])
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

// ══════════════════════════════════════════════════════════════════
// ORGANIZATION TABLES (Companies & Teams)
// ══════════════════════════════════════════════════════════════════

// Companies table - organization entity
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  industry: text('industry'),
  size: text('size'), // 'startup', 'smb', 'mid-market', 'enterprise'
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table - groups within a company
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('team_company_slug_unique').on(table.companyId, table.slug),
  index('teams_company_id_idx').on(table.companyId),
]);

// Team memberships - link users to teams
export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'member', 'approver', 'admin', 'owner'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('team_membership_unique').on(table.teamId, table.userId),
  index('team_memberships_user_id_idx').on(table.userId),
]);

// Organization types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMembership = typeof teamMemberships.$inferSelect;
export type NewTeamMembership = typeof teamMemberships.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// CREDIT LEDGER TABLES
// ══════════════════════════════════════════════════════════════════

// Entry types for the ledger
export type LedgerEntryType = 'credit' | 'debit';

export type LedgerTransactionType =
  | 'allocation'       // Mid-cycle top-up ONLY (initial is in credit_accounts)
  | 'spend'            // Direct spend (auto-approved)
  | 'hold_conversion'  // Approved hold converted to spend
  | 'refund'           // Credit returned to account
  | 'adjustment'       // Manual admin adjustment
  | 'expiry'           // Credits expired
  | 'rollover';        // Credits rolled over to new period

export type LedgerReferenceType = 'request' | 'subscription' | 'admin' | 'system';

export type CreditHoldStatus = 'active' | 'converted' | 'released' | 'expired';

// Credit accounts - one per company, holds subscription and credit info
// IMPORTANT: total_credits + bonus_credits = initial subscription allocation
// Ledger 'allocation' entries are ONLY for mid-cycle top-ups to avoid double-counting
export const creditAccounts = pgTable('credit_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'restrict' }),

  // Subscription info
  subscriptionTier: text('subscription_tier').notNull(),
  subscriptionStart: timestamp('subscription_start', { mode: 'date' }).notNull(),
  subscriptionEnd: timestamp('subscription_end', { mode: 'date' }).notNull(),

  // Initial credit allocation (from subscription)
  // This is the SOURCE OF TRUTH for subscription-granted credits
  totalCredits: integer('total_credits').notNull(), // Base credits from tier
  bonusCredits: integer('bonus_credits').notNull().default(0), // Tier bonus

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('credit_accounts_company_unique').on(table.companyId),
  index('credit_accounts_company_id_idx').on(table.companyId),
]);

// Ledger entries - immutable, append-only double-entry style ledger
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => creditAccounts.id, { onDelete: 'restrict' }),

  // Entry type: credit (add) or debit (subtract)
  entryType: text('entry_type').notNull().$type<LedgerEntryType>(), // 'credit' | 'debit'

  // Amount is always positive; entry_type determines direction
  amount: integer('amount').notNull(),

  // Transaction classification
  transactionType: text('transaction_type').notNull().$type<LedgerTransactionType>(),

  // Reference to source entity
  referenceType: text('reference_type').$type<LedgerReferenceType>(),
  referenceId: uuid('reference_id'),

  // Audit trail
  description: text('description').notNull(),
  performedBy: uuid('performed_by').references(() => users.id),

  // Idempotency: prevents duplicate entries from retries (scoped to account)
  idempotencyKey: text('idempotency_key'),

  // Timestamp (immutable - no updated_at)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('ledger_entries_idempotency_unique').on(table.accountId, table.idempotencyKey),
  index('ledger_entries_account_created_idx').on(table.accountId, table.createdAt),
  index('ledger_entries_account_type_idx').on(table.accountId, table.transactionType),
  index('ledger_entries_reference_idx').on(table.referenceType, table.referenceId),
]);

// Credit holds - reservations for pending approval requests
// NOTE: requestId references approvalRequests, but we can't add FK here due to circular reference
// The FK is enforced at application level and can be added via raw SQL migration
export const creditHolds = pgTable('credit_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => creditAccounts.id, { onDelete: 'restrict' }),
  requestId: uuid('request_id').notNull(), // References approval_requests.id

  // Hold details
  amount: integer('amount').notNull(),

  // Hold status
  status: text('status').notNull().default('active').$type<CreditHoldStatus>(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  releasedAt: timestamp('released_at'),
  convertedAt: timestamp('converted_at'),
}, (table) => [
  unique('credit_holds_request_unique').on(table.requestId),
  index('credit_holds_account_active_idx').on(table.accountId),
  index('credit_holds_created_active_idx').on(table.createdAt),
]);

// Credit allocations - team-level budget allocations from company pool
export const creditAllocations = pgTable('credit_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => creditAccounts.id, { onDelete: 'restrict' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),

  // Allocation amount for this period
  allocatedCredits: integer('allocated_credits').notNull(),

  // Budget period
  periodStart: timestamp('period_start', { mode: 'date' }).notNull(),
  periodEnd: timestamp('period_end', { mode: 'date' }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('credit_allocations_team_period_unique').on(table.accountId, table.teamId, table.periodStart),
  index('credit_allocations_team_idx').on(table.teamId, table.periodStart),
]);

// Credit Ledger types
export type CreditAccount = typeof creditAccounts.$inferSelect;
export type NewCreditAccount = typeof creditAccounts.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type CreditHold = typeof creditHolds.$inferSelect;
export type NewCreditHold = typeof creditHolds.$inferInsert;
export type CreditAllocation = typeof creditAllocations.$inferSelect;
export type NewCreditAllocation = typeof creditAllocations.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// APPROVAL WORKFLOW TABLES
// ══════════════════════════════════════════════════════════════════

// Approval request types
export type ApprovalRequestType =
  | 'report_upgrade'
  | 'analyst_qa'
  | 'analyst_call'
  | 'expert_consult'
  | 'expert_deepdive'
  | 'bespoke_project';

// Approval request status (state machine)
export type ApprovalRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'cancelled'
  | 'expired'
  | 'fulfilled';

// Approval level (routing)
export type ApprovalLevel = 'auto' | 'approver' | 'admin';

// Approval event types
export type ApprovalEventType =
  | 'created'
  | 'submitted'
  | 'auto_approved'    // Request auto-approved (under threshold)
  | 'approved'
  | 'denied'
  | 'escalated'
  | 'reassigned'
  | 'cancelled'
  | 'expired'
  | 'fulfilled';

// Request context JSON structure
export interface ApprovalRequestContext {
  reportId?: string;
  reportTitle?: string;
  category?: string;
  queryText?: string;
  sourceConversationId?: string;
  [key: string]: unknown;
}

// Approval requests - the core state machine
export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'restrict' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'restrict' }),

  // Request type and status
  requestType: text('request_type').notNull().$type<ApprovalRequestType>(),
  status: text('status').notNull().default('draft').$type<ApprovalRequestStatus>(),

  // Request details
  title: text('title').notNull(),
  description: text('description'),
  context: jsonb('context').$type<ApprovalRequestContext>(),

  // Credit information
  estimatedCredits: integer('estimated_credits').notNull(),
  actualCredits: integer('actual_credits'), // Set on fulfillment if different

  // Approval routing
  currentApproverId: uuid('current_approver_id').references(() => users.id),
  approvalLevel: text('approval_level').$type<ApprovalLevel>(),
  escalationCount: integer('escalation_count').notNull().default(0),

  // Decision tracking
  decisionReason: text('decision_reason'),
  decidedBy: uuid('decided_by').references(() => users.id),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  decidedAt: timestamp('decided_at'),
  fulfilledAt: timestamp('fulfilled_at'),
  expiresAt: timestamp('expires_at'),
}, (table) => [
  index('approval_requests_company_status_idx').on(table.companyId, table.status),
  index('approval_requests_approver_status_idx').on(table.currentApproverId, table.status),
  index('approval_requests_requester_idx').on(table.requesterId),
  index('approval_requests_expires_idx').on(table.expiresAt),
  index('approval_requests_team_idx').on(table.teamId),
]);

// Approval events - audit trail for all state transitions
export const approvalEvents = pgTable('approval_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => approvalRequests.id, { onDelete: 'cascade' }),

  // Event details
  eventType: text('event_type').notNull().$type<ApprovalEventType>(),

  // Actor
  performedBy: uuid('performed_by').references(() => users.id),
  performedBySystem: boolean('performed_by_system').notNull().default(false),

  // State transition
  fromStatus: text('from_status').$type<ApprovalRequestStatus>(),
  toStatus: text('to_status').$type<ApprovalRequestStatus>(),

  // Additional context
  reason: text('reason'),
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('approval_events_request_idx').on(table.requestId),
  index('approval_events_created_idx').on(table.createdAt),
]);

// Approval rules - configurable thresholds per company
export const approvalRules = pgTable('approval_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),

  // Threshold range
  minCredits: integer('min_credits').notNull(),
  maxCredits: integer('max_credits'), // NULL = unlimited

  // Routing configuration
  approverRole: text('approver_role').notNull().$type<ApprovalLevel>(),
  escalationHours: integer('escalation_hours'), // NULL = no escalation

  // Priority for rule matching (lower = first)
  priority: integer('priority').notNull().default(0),

  // Status
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('approval_rules_company_active_idx').on(table.companyId, table.isActive),
]);

// Approval Workflow types
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;
export type ApprovalEvent = typeof approvalEvents.$inferSelect;
export type NewApprovalEvent = typeof approvalEvents.$inferInsert;
export type ApprovalRule = typeof approvalRules.$inferSelect;
export type NewApprovalRule = typeof approvalRules.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// EXPERT NETWORK TABLES
// ══════════════════════════════════════════════════════════════════

// Expert availability status
export type ExpertAvailability = 'online' | 'busy' | 'offline';

// Engagement types
export type ExpertEngagementType = 'consultation' | 'deep_dive' | 'bespoke_project';

// Engagement status
export type ExpertEngagementStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Experts table - industry experts available for consultations
export const experts = pgTable('experts', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Link to user account (if expert has logged in)
  userId: uuid('user_id').unique().references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  photo: text('photo'),
  formerCompany: text('former_company').notNull(),
  formerTitle: text('former_title').notNull(),
  yearsExperience: integer('years_experience').notNull(),
  specialties: jsonb('specialties').$type<string[]>().notNull(),
  industries: jsonb('industries').$type<string[]>().notNull(),
  regions: jsonb('regions').$type<string[]>().notNull(),
  rating: integer('rating').default(0), // Stored as 10x (48 = 4.8)
  totalRatings: integer('total_ratings').default(0),
  totalEngagements: integer('total_engagements').default(0),
  availability: text('availability').default('offline').$type<ExpertAvailability>(),
  hourlyRate: integer('hourly_rate').notNull(),
  isTopVoice: boolean('is_top_voice').default(false),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('experts_availability_idx').on(table.availability),
  index('experts_is_top_voice_idx').on(table.isTopVoice),
  index('experts_user_id_idx').on(table.userId),
]);

// Expert engagements - track consultations and projects
export const expertEngagements = pgTable('expert_engagements', {
  id: uuid('id').primaryKey().defaultRandom(),
  expertId: uuid('expert_id').notNull().references(() => experts.id, { onDelete: 'restrict' }),
  requestId: uuid('request_id').references(() => approvalRequests.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  type: text('type').notNull().$type<ExpertEngagementType>(),
  title: text('title').notNull(),
  status: text('status').notNull().default('scheduled').$type<ExpertEngagementStatus>(),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  credits: integer('credits').notNull(),
  rating: integer('rating'), // 1-5, set after completion
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('expert_engagements_expert_idx').on(table.expertId),
  index('expert_engagements_client_idx').on(table.clientId),
  index('expert_engagements_status_idx').on(table.status),
]);

// Expert Network types
export type Expert = typeof experts.$inferSelect;
export type NewExpert = typeof experts.$inferInsert;
export type ExpertEngagement = typeof expertEngagements.$inferSelect;
export type NewExpertEngagement = typeof expertEngagements.$inferInsert;

// ══════════════════════════════════════════════════════════════════
// MANAGED CATEGORIES TABLES
// ══════════════════════════════════════════════════════════════════

// Category domains - high-level groupings
export const categoryDomains = pgTable('category_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  color: text('color'),
  categoryCount: integer('category_count').default(0),
});

// Managed categories - Beroe-managed intelligence categories
export const managedCategories = pgTable('managed_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domainId: uuid('domain_id').notNull().references(() => categoryDomains.id, { onDelete: 'restrict' }),
  subDomain: text('sub_domain'),
  description: text('description'),
  leadAnalystName: text('lead_analyst_name'),
  leadAnalystPhoto: text('lead_analyst_photo'),
  updateFrequency: text('update_frequency').notNull(), // 'daily', 'weekly', 'monthly'
  hasMarketReport: boolean('has_market_report').default(false),
  hasPriceIndex: boolean('has_price_index').default(false),
  hasSupplierData: boolean('has_supplier_data').default(false),
  responseTimeSla: text('response_time_sla').default('24 hours'),
  clientCount: integer('client_count').default(0),
  isPopular: boolean('is_popular').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('managed_categories_domain_idx').on(table.domainId),
  index('managed_categories_is_popular_idx').on(table.isPopular),
]);

// Activated categories - which categories a company has active
export const activatedCategories = pgTable('activated_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => managedCategories.id, { onDelete: 'restrict' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  activatedAt: timestamp('activated_at').defaultNow().notNull(),
  activatedBy: uuid('activated_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  queriesThisMonth: integer('queries_this_month').default(0),
  alertsEnabled: boolean('alerts_enabled').default(true),
}, (table) => [
  unique('activated_categories_unique').on(table.categoryId, table.companyId),
  index('activated_categories_company_idx').on(table.companyId),
]);

// Managed Categories types
export type CategoryDomain = typeof categoryDomains.$inferSelect;
export type NewCategoryDomain = typeof categoryDomains.$inferInsert;
export type ManagedCategory = typeof managedCategories.$inferSelect;
export type NewManagedCategory = typeof managedCategories.$inferInsert;
export type ActivatedCategory = typeof activatedCategories.$inferSelect;
export type NewActivatedCategory = typeof activatedCategories.$inferInsert;
