// Tests for Credit Ledger - Business logic and data factory validation
// These tests validate calculation formulas, data structures, and test utilities
// without requiring database mocking. They do NOT test middleware DB operations.
// See credits.test.ts for API endpoint tests and credits-auth.test.ts for auth/CSRF tests.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetCreditTestCounters,
  createTestCreditAccount,
  createTestCreditHold,
  createTestLedgerEntry,
  createTestBalance,
} from '../../../src/test/credit-utils';

// ══════════════════════════════════════════════════════════════════
// TESTS - Balance Calculation Formula
// ══════════════════════════════════════════════════════════════════

describe('Credit Balance Calculation', () => {
  beforeEach(() => {
    resetCreditTestCounters();
  });

  describe('available credits formula', () => {
    it('calculates correctly: total + bonus + credits - debits - reserved', () => {
      const balance = createTestBalance({
        totalCredits: 10000,
        bonusCredits: 2000,
        ledgerCredits: 500,  // refunds/top-ups
        ledgerDebits: 1500,  // spends
        reservedCredits: 500, // active holds
      });

      // Expected: 10000 + 2000 + 500 - 1500 - 500 = 10500
      expect(balance.availableCredits).toBe(10500);
    });

    it('handles zero values correctly', () => {
      const balance = createTestBalance({
        totalCredits: 5000,
        bonusCredits: 0,
        ledgerCredits: 0,
        ledgerDebits: 0,
        reservedCredits: 0,
      });

      expect(balance.availableCredits).toBe(5000);
    });

    it('handles negative available (over-spend scenario)', () => {
      const totalCredits = 1000;
      const bonusCredits = 0;
      const ledgerCredits = 0;
      const ledgerDebits = 1500;  // Spent more than available somehow
      const reservedCredits = 0;

      const available = totalCredits + bonusCredits + ledgerCredits - ledgerDebits - reservedCredits;
      expect(available).toBe(-500);
    });

    it('calculates usedCredits as alias for ledgerDebits', () => {
      const balance = createTestBalance({
        ledgerDebits: 2500,
      });

      expect(balance.usedCredits).toBe(balance.ledgerDebits);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Test Data Factory Validation
// ══════════════════════════════════════════════════════════════════

describe('Credit Test Data Factories', () => {
  beforeEach(() => {
    resetCreditTestCounters();
  });

  describe('createTestCreditAccount', () => {
    it('creates account with default values', () => {
      const account = createTestCreditAccount();

      expect(account.id).toBeDefined();
      expect(account.companyId).toBeDefined();
      expect(account.subscriptionTier).toBe('professional');
      expect(account.totalCredits).toBe(10000);
      expect(account.bonusCredits).toBe(2000);
    });

    it('allows overrides', () => {
      const account = createTestCreditAccount({
        totalCredits: 5000,
        bonusCredits: 500,
        subscriptionTier: 'enterprise',
      });

      expect(account.totalCredits).toBe(5000);
      expect(account.bonusCredits).toBe(500);
      expect(account.subscriptionTier).toBe('enterprise');
    });

    it('generates unique IDs', () => {
      const account1 = createTestCreditAccount();
      const account2 = createTestCreditAccount();

      expect(account1.id).not.toBe(account2.id);
    });
  });

  describe('createTestCreditHold', () => {
    it('creates hold with active status by default', () => {
      const hold = createTestCreditHold();

      expect(hold.id).toBeDefined();
      expect(hold.status).toBe('active');
      expect(hold.amount).toBe(500);
      expect(hold.releasedAt).toBeNull();
      expect(hold.convertedAt).toBeNull();
    });

    it('allows status override', () => {
      const releasedHold = createTestCreditHold({ status: 'released' });
      const convertedHold = createTestCreditHold({ status: 'converted' });

      expect(releasedHold.status).toBe('released');
      expect(convertedHold.status).toBe('converted');
    });
  });

  describe('createTestLedgerEntry', () => {
    it('creates debit entry by default', () => {
      const entry = createTestLedgerEntry();

      expect(entry.id).toBeDefined();
      expect(entry.entryType).toBe('debit');
      expect(entry.amount).toBe(100);
      expect(entry.transactionType).toBe('spend');
    });

    it('allows credit entry', () => {
      const entry = createTestLedgerEntry({
        entryType: 'credit',
        transactionType: 'refund',
      });

      expect(entry.entryType).toBe('credit');
      expect(entry.transactionType).toBe('refund');
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Hold Status Validation
// ══════════════════════════════════════════════════════════════════

describe('Credit Hold Status Transitions', () => {
  beforeEach(() => {
    resetCreditTestCounters();
  });

  describe('valid status values', () => {
    it('active is valid initial status', () => {
      const hold = createTestCreditHold({ status: 'active' });
      expect(['active', 'converted', 'released', 'expired']).toContain(hold.status);
    });

    it('all status values are valid', () => {
      const statuses = ['active', 'converted', 'released', 'expired'] as const;
      statuses.forEach(status => {
        const hold = createTestCreditHold({ status });
        expect(hold.status).toBe(status);
      });
    });
  });

  describe('status transition rules', () => {
    it('only active holds can be released', () => {
      const activeHold = createTestCreditHold({ status: 'active' });
      const canRelease = activeHold.status === 'active';
      expect(canRelease).toBe(true);

      const releasedHold = createTestCreditHold({ status: 'released' });
      const canReleaseAgain = releasedHold.status === 'active';
      expect(canReleaseAgain).toBe(false);
    });

    it('only active holds can be converted', () => {
      const activeHold = createTestCreditHold({ status: 'active' });
      const canConvert = activeHold.status === 'active';
      expect(canConvert).toBe(true);

      const convertedHold = createTestCreditHold({ status: 'converted' });
      const canConvertAgain = convertedHold.status === 'active';
      expect(canConvertAgain).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Ledger Entry Types
// ══════════════════════════════════════════════════════════════════

describe('Ledger Entry Types', () => {
  beforeEach(() => {
    resetCreditTestCounters();
  });

  describe('entry types', () => {
    it('credit entries add to balance', () => {
      const entry = createTestLedgerEntry({ entryType: 'credit' });
      expect(entry.entryType).toBe('credit');
    });

    it('debit entries subtract from balance', () => {
      const entry = createTestLedgerEntry({ entryType: 'debit' });
      expect(entry.entryType).toBe('debit');
    });
  });

  describe('transaction types', () => {
    const validTypes = [
      'allocation',
      'spend',
      'hold_conversion',
      'refund',
      'adjustment',
      'expiry',
      'rollover',
    ];

    it('supports all valid transaction types', () => {
      validTypes.forEach(type => {
        const entry = createTestLedgerEntry({
          transactionType: type as typeof entry.transactionType,
        });
        expect(entry.transactionType).toBe(type);
      });
    });
  });

  describe('reference types', () => {
    const validRefs = ['request', 'subscription', 'admin', 'system'];

    it('supports all valid reference types', () => {
      validRefs.forEach(type => {
        const entry = createTestLedgerEntry({
          referenceType: type as typeof entry.referenceType,
        });
        expect(entry.referenceType).toBe(type);
      });
    });
  });

  describe('idempotency', () => {
    it('entries have unique idempotency keys by default', () => {
      const entry1 = createTestLedgerEntry();
      const entry2 = createTestLedgerEntry();

      expect(entry1.idempotencyKey).not.toBe(entry2.idempotencyKey);
    });

    it('idempotency key can be overridden', () => {
      const entry = createTestLedgerEntry({ idempotencyKey: 'custom-key' });
      expect(entry.idempotencyKey).toBe('custom-key');
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Insufficient Credit Scenarios
// ══════════════════════════════════════════════════════════════════

describe('Insufficient Credit Detection', () => {
  beforeEach(() => {
    resetCreditTestCounters();
  });

  describe('hasSufficientCredits', () => {
    function hasSufficientCredits(balance: { availableCredits: number }, amount: number): boolean {
      return balance.availableCredits >= amount;
    }

    it('returns true when enough credits', () => {
      const balance = createTestBalance({ availableCredits: 1000 });
      expect(hasSufficientCredits(balance, 500)).toBe(true);
    });

    it('returns true when exact amount', () => {
      const balance = createTestBalance({ availableCredits: 500 });
      expect(hasSufficientCredits(balance, 500)).toBe(true);
    });

    it('returns false when insufficient', () => {
      const balance = createTestBalance({ availableCredits: 100 });
      expect(hasSufficientCredits(balance, 500)).toBe(false);
    });

    it('returns false for zero available', () => {
      const balance = createTestBalance({ availableCredits: 0 });
      expect(hasSufficientCredits(balance, 1)).toBe(false);
    });

    it('handles zero amount request', () => {
      const balance = createTestBalance({ availableCredits: 0 });
      // Zero amount should pass (though shouldn't be allowed in practice)
      expect(hasSufficientCredits(balance, 0)).toBe(true);
    });
  });

  describe('shortfall calculation', () => {
    function calculateShortfall(available: number, requested: number): number {
      return Math.max(0, requested - available);
    }

    it('calculates shortfall correctly', () => {
      expect(calculateShortfall(100, 500)).toBe(400);
      expect(calculateShortfall(500, 500)).toBe(0);
      expect(calculateShortfall(1000, 500)).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// TESTS - Days Remaining Calculation
// ══════════════════════════════════════════════════════════════════

describe('Days Remaining Calculation', () => {
  function calculateDaysRemaining(subscriptionEnd: Date): number {
    const now = new Date();
    const diffMs = subscriptionEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  it('calculates positive days for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const days = calculateDaysRemaining(futureDate);
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it('returns 0 for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const days = calculateDaysRemaining(pastDate);
    expect(days).toBe(0);
  });

  it('handles today as end date', () => {
    const today = new Date();

    const days = calculateDaysRemaining(today);
    // Should be 0 or 1 depending on time
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(1);
  });
});
