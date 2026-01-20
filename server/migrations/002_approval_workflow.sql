-- Migration: Approval Workflow System
-- Description: Request management, approval routing, and audit trail
-- Author: Generated from POST_APRIL_PRODUCTION_PLAN.md
-- Dependencies: 001_credit_ledger.sql

-- ============================================================================
-- APPROVAL REQUESTS
-- Core request entity with state machine
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Request type (maps to credit transaction types)
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'report_upgrade',     -- L2b decision-grade upgrade
    'analyst_qa',         -- Analyst Q&A (async)
    'analyst_call',       -- Analyst call (30 min)
    'expert_consult',     -- Expert consultation (1 hr)
    'expert_deepdive',    -- Expert deep-dive (2-3 hr)
    'bespoke_project'     -- Bespoke research project
  )),

  -- State machine status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',              -- Not yet submitted
    'pending',            -- Awaiting approval
    'approved',           -- Approved, pending fulfillment
    'denied',             -- Denied by approver
    'cancelled',          -- Cancelled by requester
    'expired',            -- Timed out waiting for approval
    'fulfilled'           -- Completed/delivered
  )),

  -- Request details
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Context from the triggering action (report, category, query, etc.)
  context JSONB DEFAULT '{}',
  -- Example: {"reportId": "...", "reportTitle": "...", "categoryId": "...", "queryText": "..."}

  -- Credit information
  estimated_credits INTEGER NOT NULL CHECK (estimated_credits > 0),
  actual_credits INTEGER CHECK (actual_credits > 0),  -- Set on fulfillment

  -- Approval routing
  approval_level VARCHAR(20) CHECK (approval_level IN ('auto', 'approver', 'admin')),
  current_approver_id UUID REFERENCES users(id),
  escalation_count INTEGER NOT NULL DEFAULT 0,

  -- Decision details (populated on approve/deny)
  decision_reason TEXT,
  decided_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,         -- When moved from draft to pending
  decided_at TIMESTAMPTZ,           -- When approved/denied
  fulfilled_at TIMESTAMPTZ,         -- When work completed
  expires_at TIMESTAMPTZ,           -- SLA deadline for approval

  -- Constraints
  CONSTRAINT chk_actual_credits_on_fulfill CHECK (
    status != 'fulfilled' OR actual_credits IS NOT NULL
  )
);

-- ============================================================================
-- APPROVAL EVENTS
-- Immutable audit trail of all state changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE RESTRICT,

  -- Event type
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created',            -- Request created (draft)
    'submitted',          -- Submitted for approval
    'auto_approved',      -- Auto-approved (under threshold)
    'assigned',           -- Assigned to approver
    'approved',           -- Approved by user
    'denied',             -- Denied by user
    'escalated',          -- Escalated to next level
    'reassigned',         -- Reassigned to different approver
    'cancelled',          -- Cancelled by requester
    'expired',            -- Timed out
    'fulfilled',          -- Work completed
    'comment'             -- Comment added (no status change)
  )),

  -- Actor
  performed_by UUID REFERENCES users(id),  -- NULL for system actions
  performed_by_system BOOLEAN NOT NULL DEFAULT FALSE,

  -- State change
  from_status VARCHAR(20),
  to_status VARCHAR(20),

  -- Details
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  -- Example: {"escalatedFrom": "approver", "escalatedTo": "admin", "slaHours": 48}

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- APPROVAL RULES
-- Configurable routing rules per company
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Threshold range (credits)
  min_credits INTEGER NOT NULL CHECK (min_credits >= 0),
  max_credits INTEGER,  -- NULL = unlimited (no upper bound)

  -- Routing configuration
  approver_role VARCHAR(20) NOT NULL CHECK (approver_role IN (
    'auto',       -- Auto-approve, no human needed
    'approver',   -- Team approver (CPO/Director)
    'admin'       -- Company admin
  )),

  -- Escalation settings
  escalation_hours INTEGER,  -- NULL = no escalation
  escalate_to VARCHAR(20) CHECK (escalate_to IN ('approver', 'admin')),

  -- Rule priority (lower = evaluated first)
  priority INTEGER NOT NULL DEFAULT 0,

  -- Active flag for soft disable
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validate threshold range
  CONSTRAINT chk_threshold_range CHECK (
    max_credits IS NULL OR max_credits > min_credits
  ),
  -- Escalation requires hours
  CONSTRAINT chk_escalation_config CHECK (
    (escalation_hours IS NULL AND escalate_to IS NULL) OR
    (escalation_hours IS NOT NULL AND escalate_to IS NOT NULL)
  )
);

-- ============================================================================
-- APPROVER ASSIGNMENTS
-- Maps approvers to teams (who can approve for which team)
-- ============================================================================

CREATE TABLE IF NOT EXISTS approver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Approver level
  approver_level VARCHAR(20) NOT NULL CHECK (approver_level IN (
    'approver',   -- Team-level approver
    'admin'       -- Company admin (can approve anything)
  )),

  -- Approval limit (max credits this user can approve)
  approval_limit INTEGER,  -- NULL = unlimited

  -- Delegation (for PTO coverage)
  delegated_to UUID REFERENCES users(id),
  delegation_start DATE,
  delegation_end DATE,

  -- Active flag
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One assignment per user per team
  CONSTRAINT uq_approver_team UNIQUE(team_id, user_id),

  -- Delegation requires all fields and valid date range
  CONSTRAINT chk_delegation_dates CHECK (
    (delegated_to IS NULL AND delegation_start IS NULL AND delegation_end IS NULL) OR
    (delegated_to IS NOT NULL AND delegation_start IS NOT NULL AND delegation_end IS NOT NULL
      AND delegation_end >= delegation_start)
  )
);

-- ============================================================================
-- ADD FOREIGN KEY TO CREDIT_HOLDS
-- Now that approval_requests exists
-- ============================================================================

ALTER TABLE credit_holds
  ADD CONSTRAINT fk_credit_holds_request
  FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE RESTRICT;

-- ============================================================================
-- INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Requests: company queue (all pending for a company)
CREATE INDEX IF NOT EXISTS idx_requests_company_status
  ON approval_requests(company_id, status);

-- Requests: approver queue (pending requests assigned to user)
CREATE INDEX IF NOT EXISTS idx_requests_approver_pending
  ON approval_requests(current_approver_id, status)
  WHERE status = 'pending';

-- Requests: requester history
CREATE INDEX IF NOT EXISTS idx_requests_requester
  ON approval_requests(requester_id, created_at DESC);

-- Requests: expiration job (find expiring requests)
CREATE INDEX IF NOT EXISTS idx_requests_expires
  ON approval_requests(expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;

-- Requests: team view
CREATE INDEX IF NOT EXISTS idx_requests_team
  ON approval_requests(team_id, status);

-- Events: request history
CREATE INDEX IF NOT EXISTS idx_events_request
  ON approval_events(request_id, created_at);

-- Rules: company lookup (active rules by priority)
CREATE INDEX IF NOT EXISTS idx_rules_company_active
  ON approval_rules(company_id, priority)
  WHERE is_active = TRUE;

-- Approver assignments: team lookup
CREATE INDEX IF NOT EXISTS idx_approvers_team
  ON approver_assignments(team_id)
  WHERE is_active = TRUE;

-- Approver assignments: user lookup
CREATE INDEX IF NOT EXISTS idx_approvers_user
  ON approver_assignments(user_id)
  WHERE is_active = TRUE;

-- ============================================================================
-- FUNCTIONS
-- Helper functions for approval routing
-- ============================================================================

-- Find the appropriate approval rule for a request
CREATE OR REPLACE FUNCTION get_approval_rule(
  p_company_id UUID,
  p_credits INTEGER
)
RETURNS TABLE (
  rule_id UUID,
  approver_role VARCHAR(20),
  escalation_hours INTEGER,
  escalate_to VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.approver_role,
    ar.escalation_hours,
    ar.escalate_to
  FROM approval_rules ar
  WHERE ar.company_id = p_company_id
    AND ar.is_active = TRUE
    AND ar.min_credits <= p_credits
    AND (ar.max_credits IS NULL OR ar.max_credits >= p_credits)
  ORDER BY ar.priority ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Find available approvers for a team at a given level
CREATE OR REPLACE FUNCTION get_available_approvers(
  p_team_id UUID,
  p_level VARCHAR(20),
  p_credits INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  effective_user_id UUID,  -- Delegated user if applicable
  approval_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.user_id,
    COALESCE(
      CASE
        WHEN aa.delegated_to IS NOT NULL
          AND CURRENT_DATE BETWEEN aa.delegation_start AND aa.delegation_end
        THEN aa.delegated_to
        ELSE NULL
      END,
      aa.user_id
    ) AS effective_user_id,
    aa.approval_limit
  FROM approver_assignments aa
  WHERE aa.team_id = p_team_id
    AND aa.is_active = TRUE
    AND (
      aa.approver_level = p_level
      OR (p_level = 'approver' AND aa.approver_level = 'admin')  -- Admins can approve approver-level
    )
    AND (
      p_credits IS NULL
      OR aa.approval_limit IS NULL
      OR aa.approval_limit >= p_credits
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- Automatic timestamp updates
-- ============================================================================

-- Update updated_at on approval_requests
CREATE OR REPLACE FUNCTION update_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_requests_updated
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

-- Update updated_at on approval_rules
CREATE TRIGGER trg_rules_updated
  BEFORE UPDATE ON approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

-- Update updated_at on approver_assignments
CREATE TRIGGER trg_approvers_updated
  BEFORE UPDATE ON approver_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_request_timestamp();

-- Auto-create event on request INSERT (created)
CREATE OR REPLACE FUNCTION log_request_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO approval_events (
    request_id,
    event_type,
    to_status,
    performed_by,
    performed_by_system
  ) VALUES (
    NEW.id,
    'created',
    NEW.status,
    NEW.requester_id,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_request_created
  AFTER INSERT ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_created();

-- Auto-create event on request status change
-- Uses correct actor based on transition type
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_is_system BOOLEAN;
  v_event_type VARCHAR(50);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine event type
    -- Special case: auto_approved when going to approved with approval_level='auto'
    IF NEW.status = 'approved' AND NEW.approval_level = 'auto' THEN
      v_event_type := 'auto_approved';
    ELSE
      v_event_type := CASE NEW.status
        WHEN 'pending' THEN 'submitted'
        WHEN 'approved' THEN 'approved'
        WHEN 'denied' THEN 'denied'
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'expired' THEN 'expired'
        WHEN 'fulfilled' THEN 'fulfilled'
        ELSE 'submitted'
      END;
    END IF;

    -- Determine actor based on event type
    CASE v_event_type
      WHEN 'submitted' THEN
        -- Requester submits
        v_actor := NEW.requester_id;
        v_is_system := FALSE;
      WHEN 'auto_approved' THEN
        -- System auto-approves
        v_actor := NULL;
        v_is_system := TRUE;
      WHEN 'approved', 'denied' THEN
        -- Approver decides
        v_actor := NEW.decided_by;
        v_is_system := (NEW.decided_by IS NULL);
      WHEN 'cancelled' THEN
        -- Requester cancels (could also be admin, but typically requester)
        v_actor := NEW.requester_id;
        v_is_system := FALSE;
      WHEN 'expired' THEN
        -- System expires
        v_actor := NULL;
        v_is_system := TRUE;
      WHEN 'fulfilled' THEN
        -- Could be system or fulfiller
        v_actor := NEW.decided_by;
        v_is_system := (NEW.decided_by IS NULL);
      ELSE
        v_actor := NULL;
        v_is_system := TRUE;
    END CASE;

    INSERT INTO approval_events (
      request_id,
      event_type,
      from_status,
      to_status,
      performed_by,
      performed_by_system
    ) VALUES (
      NEW.id,
      v_event_type,
      OLD.status,
      NEW.status,
      v_actor,
      v_is_system
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_request_status_change
  AFTER UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_status_change();

-- ============================================================================
-- SEED DATA: Default Approval Rules
-- Applied when a new company is created
-- ============================================================================

-- Function to seed default rules for a company
CREATE OR REPLACE FUNCTION seed_default_approval_rules(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO approval_rules (company_id, min_credits, max_credits, approver_role, escalation_hours, escalate_to, priority)
  VALUES
    -- Auto-approve under $500
    (p_company_id, 0, 499, 'auto', NULL, NULL, 0),
    -- Approver for $500-$2000
    (p_company_id, 500, 2000, 'approver', 48, 'admin', 1),
    -- Admin for over $2000
    (p_company_id, 2001, NULL, 'admin', 24, NULL, 2)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- Documentation for schema
-- ============================================================================

COMMENT ON TABLE approval_requests IS 'Upgrade/service requests with approval workflow';
COMMENT ON TABLE approval_events IS 'Immutable audit trail of request state changes';
COMMENT ON TABLE approval_rules IS 'Configurable approval routing rules per company';
COMMENT ON TABLE approver_assignments IS 'Maps users to teams as approvers with optional delegation';

COMMENT ON FUNCTION get_approval_rule IS 'Find matching approval rule for a request amount';
COMMENT ON FUNCTION get_available_approvers IS 'Find approvers for a team at given level';
COMMENT ON FUNCTION seed_default_approval_rules IS 'Initialize default approval thresholds for new company';
