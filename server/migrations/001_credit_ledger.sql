-- Migration: Credit Ledger System
-- Description: Core tables for credit accounting, holds, and team allocations
-- Author: Generated from POST_APRIL_PRODUCTION_PLAN.md

-- ============================================================================
-- CREDIT ACCOUNTS
-- One account per company, holds subscription and credit info
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,

  -- Subscription info
  subscription_tier VARCHAR(50) NOT NULL,
  subscription_start DATE NOT NULL,
  subscription_end DATE NOT NULL,

  -- INITIAL credit allocation (from subscription)
  -- This is the SOURCE OF TRUTH for subscription-granted credits.
  -- DO NOT also record initial allocation as a ledger entry - that would double-count.
  -- Ledger 'allocation' entries are ONLY for mid-cycle top-ups.
  total_credits INTEGER NOT NULL CHECK (total_credits >= 0),  -- Base credits from tier
  bonus_credits INTEGER NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),  -- Tier bonus

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One account per company
  CONSTRAINT uq_credit_accounts_company UNIQUE(company_id)
);

-- ============================================================================
-- LEDGER ENTRIES
-- Immutable, append-only double-entry style ledger
-- All balance changes are recorded here
-- ============================================================================

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE RESTRICT,

  -- Entry type: credit (add) or debit (subtract)
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('credit', 'debit')),

  -- Amount is always positive; entry_type determines direction
  amount INTEGER NOT NULL CHECK (amount > 0),

  -- Transaction classification
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'allocation',        -- Mid-cycle top-up ONLY (initial is in credit_accounts)
    'spend',             -- Direct spend (auto-approved)
    'hold_conversion',   -- Approved hold converted to spend
    'refund',            -- Credit returned to account
    'adjustment',        -- Manual admin adjustment
    'expiry',            -- Credits expired (if applicable)
    'rollover'           -- Credits rolled over to new period
  )),

  -- Reference to source entity
  reference_type VARCHAR(50),  -- 'request' | 'subscription' | 'admin' | 'system'
  reference_id UUID,

  -- Audit trail
  description TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),  -- NULL for system actions

  -- Idempotency: prevents duplicate entries from retries (scoped to account)
  idempotency_key VARCHAR(255),

  -- Timestamp (immutable - no updated_at)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate operations within same account
  CONSTRAINT uq_ledger_idempotency UNIQUE(account_id, idempotency_key)
);

-- ============================================================================
-- CREDIT HOLDS
-- Reservations for pending approval requests
-- Credits are held (not spent) until request is approved or denied
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE RESTRICT,

  -- Link to the approval request (created after approval_requests table)
  request_id UUID NOT NULL,  -- Will add FK after approval_requests exists

  -- Hold details
  amount INTEGER NOT NULL CHECK (amount > 0),

  -- Hold status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Hold is reserving credits
    'converted',   -- Approved: converted to ledger debit
    'released',    -- Denied/cancelled: credits returned
    'expired'      -- Timed out: credits returned
  )),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,    -- When released/expired
  converted_at TIMESTAMPTZ,   -- When converted to spend

  -- One hold per request
  CONSTRAINT uq_credit_holds_request UNIQUE(request_id)
);

-- ============================================================================
-- CREDIT ALLOCATIONS
-- Team-level budget allocations from company pool
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,

  -- Allocation amount for this period
  allocated_credits INTEGER NOT NULL CHECK (allocated_credits >= 0),

  -- Budget period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One allocation per team per period
  CONSTRAINT uq_allocations_team_period UNIQUE(account_id, team_id, period_start),

  -- Period must be valid
  CONSTRAINT chk_allocation_period CHECK (period_end > period_start)
);

-- ============================================================================
-- INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Credit accounts: lookup by company
CREATE INDEX IF NOT EXISTS idx_credit_accounts_company
  ON credit_accounts(company_id);

-- Ledger entries: time-series queries
CREATE INDEX IF NOT EXISTS idx_ledger_account_created
  ON ledger_entries(account_id, created_at DESC);

-- Ledger entries: reference lookups (e.g., "all entries for request X")
CREATE INDEX IF NOT EXISTS idx_ledger_reference
  ON ledger_entries(reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- Ledger entries: transaction type filtering
CREATE INDEX IF NOT EXISTS idx_ledger_account_type
  ON ledger_entries(account_id, transaction_type);

-- Credit holds: active holds for balance calculation
CREATE INDEX IF NOT EXISTS idx_holds_account_active
  ON credit_holds(account_id)
  WHERE status = 'active';

-- Credit holds: cleanup job (find expired)
CREATE INDEX IF NOT EXISTS idx_holds_created_active
  ON credit_holds(created_at)
  WHERE status = 'active';

-- Allocations: team budget lookup
CREATE INDEX IF NOT EXISTS idx_allocations_team
  ON credit_allocations(team_id, period_start DESC);

-- ============================================================================
-- FUNCTIONS
-- Helper functions for balance calculations
-- ============================================================================

-- Calculate available balance for an account
-- Uses separate subqueries to avoid join multiplication
-- Net balance = total + bonus + credits - debits - reserved
CREATE OR REPLACE FUNCTION get_account_balance(p_account_id UUID)
RETURNS TABLE (
  total_credits INTEGER,
  bonus_credits INTEGER,
  ledger_credits BIGINT,    -- Sum of credit entries (refunds, top-ups, adjustments)
  ledger_debits BIGINT,     -- Sum of debit entries (spends)
  reserved_credits BIGINT,  -- Active holds
  available_credits BIGINT  -- What can be spent now
) AS $$
DECLARE
  v_total INTEGER;
  v_bonus INTEGER;
  v_credits BIGINT;
  v_debits BIGINT;
  v_reserved BIGINT;
BEGIN
  -- Get account base values
  SELECT ca.total_credits, ca.bonus_credits
  INTO v_total, v_bonus
  FROM credit_accounts ca
  WHERE ca.id = p_account_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Sum ledger credits (separate query to avoid join multiplication)
  SELECT COALESCE(SUM(le.amount), 0)
  INTO v_credits
  FROM ledger_entries le
  WHERE le.account_id = p_account_id
    AND le.entry_type = 'credit';

  -- Sum ledger debits (separate query)
  SELECT COALESCE(SUM(le.amount), 0)
  INTO v_debits
  FROM ledger_entries le
  WHERE le.account_id = p_account_id
    AND le.entry_type = 'debit';

  -- Sum active holds (separate query)
  SELECT COALESCE(SUM(ch.amount), 0)
  INTO v_reserved
  FROM credit_holds ch
  WHERE ch.account_id = p_account_id
    AND ch.status = 'active';

  -- Return computed values
  -- Available = base + bonus + credits - debits - reserved
  RETURN QUERY SELECT
    v_total,
    v_bonus,
    v_credits,
    v_debits,
    v_reserved,
    (v_total + v_bonus + v_credits - v_debits - v_reserved)::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================================

-- Update updated_at on credit_accounts
CREATE OR REPLACE FUNCTION update_credit_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_credit_accounts_updated
  BEFORE UPDATE ON credit_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_account_timestamp();

-- Update updated_at on credit_allocations
CREATE TRIGGER trg_credit_allocations_updated
  BEFORE UPDATE ON credit_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_account_timestamp();

-- ============================================================================
-- COMMENTS
-- Documentation for schema
-- ============================================================================

COMMENT ON TABLE credit_accounts IS 'Company credit accounts linked to subscriptions';
COMMENT ON TABLE ledger_entries IS 'Immutable ledger of all credit transactions (double-entry style)';
COMMENT ON TABLE credit_holds IS 'Credit reservations for pending approval requests';
COMMENT ON TABLE credit_allocations IS 'Team-level budget allocations from company pool';

COMMENT ON FUNCTION get_account_balance IS 'Calculate available balance: total + bonus - used - reserved';
