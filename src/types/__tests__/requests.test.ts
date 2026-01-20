// Tests for Request types and state machine helpers
import { describe, it, expect } from 'vitest';
import {
  getApprovalLevel,
  isValidTransition,
  getAvailableActions,
  getRequestStatusDisplay,
  getRequestTypeDisplay,
  VALID_TRANSITIONS,
  APPROVAL_THRESHOLDS,
  type RequestStatus,
} from '../requests';

describe('Approval Level Calculation', () => {
  it('returns "auto" for credits below threshold', () => {
    expect(getApprovalLevel(0)).toBe('auto');
    expect(getApprovalLevel(100)).toBe('auto');
    expect(getApprovalLevel(499)).toBe('auto');
  });

  it('returns "approver" for credits in mid-range', () => {
    expect(getApprovalLevel(500)).toBe('approver');
    expect(getApprovalLevel(1000)).toBe('approver');
    expect(getApprovalLevel(2000)).toBe('approver');
  });

  it('returns "admin" for credits above high threshold', () => {
    expect(getApprovalLevel(2001)).toBe('admin');
    expect(getApprovalLevel(5000)).toBe('admin');
    expect(getApprovalLevel(10000)).toBe('admin');
  });

  it('uses correct thresholds', () => {
    expect(APPROVAL_THRESHOLDS.autoApprove).toBe(500);
    expect(APPROVAL_THRESHOLDS.approverLimit).toBe(2000);
    expect(APPROVAL_THRESHOLDS.adminRequired).toBe(2000);
  });
});

describe('State Machine - Valid Transitions', () => {
  describe('draft status', () => {
    it('can transition to pending', () => {
      expect(isValidTransition('draft', 'pending')).toBe(true);
    });

    it('can transition to cancelled', () => {
      expect(isValidTransition('draft', 'cancelled')).toBe(true);
    });

    it('cannot transition to approved directly', () => {
      expect(isValidTransition('draft', 'approved')).toBe(false);
    });

    it('cannot transition to denied', () => {
      expect(isValidTransition('draft', 'denied')).toBe(false);
    });
  });

  describe('pending status', () => {
    it('can transition to approved', () => {
      expect(isValidTransition('pending', 'approved')).toBe(true);
    });

    it('can transition to denied', () => {
      expect(isValidTransition('pending', 'denied')).toBe(true);
    });

    it('can transition to cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('can transition to expired', () => {
      expect(isValidTransition('pending', 'expired')).toBe(true);
    });

    it('cannot transition to fulfilled directly', () => {
      expect(isValidTransition('pending', 'fulfilled')).toBe(false);
    });
  });

  describe('approved status', () => {
    it('can transition to fulfilled', () => {
      expect(isValidTransition('approved', 'fulfilled')).toBe(true);
    });

    it('can transition to cancelled', () => {
      expect(isValidTransition('approved', 'cancelled')).toBe(true);
    });

    it('cannot transition back to pending', () => {
      expect(isValidTransition('approved', 'pending')).toBe(false);
    });
  });

  describe('terminal states', () => {
    const terminalStates: RequestStatus[] = ['denied', 'cancelled', 'expired', 'fulfilled'];

    terminalStates.forEach((state) => {
      it(`${state} cannot transition to any state`, () => {
        expect(VALID_TRANSITIONS[state]).toEqual([]);
        expect(isValidTransition(state, 'pending')).toBe(false);
        expect(isValidTransition(state, 'approved')).toBe(false);
        expect(isValidTransition(state, 'cancelled')).toBe(false);
      });
    });
  });
});

describe('Available Actions', () => {
  describe('draft status', () => {
    it('requester can submit and cancel', () => {
      const actions = getAvailableActions('draft', true, false);
      expect(actions).toContain('submit');
      expect(actions).toContain('cancel');
    });

    it('approver has no actions', () => {
      const actions = getAvailableActions('draft', false, true);
      expect(actions).toEqual([]);
    });
  });

  describe('pending status', () => {
    it('approver can approve and deny', () => {
      const actions = getAvailableActions('pending', false, true);
      expect(actions).toContain('approve');
      expect(actions).toContain('deny');
      expect(actions).not.toContain('cancel');
    });

    it('requester can cancel', () => {
      const actions = getAvailableActions('pending', true, false);
      expect(actions).toContain('cancel');
      expect(actions).not.toContain('approve');
    });

    it('user who is both requester and approver gets all actions', () => {
      const actions = getAvailableActions('pending', true, true);
      expect(actions).toContain('approve');
      expect(actions).toContain('deny');
      expect(actions).toContain('cancel');
    });
  });

  describe('approved status', () => {
    it('requester can cancel', () => {
      const actions = getAvailableActions('approved', true, false);
      expect(actions).toContain('cancel');
    });

    it('approver has no actions', () => {
      const actions = getAvailableActions('approved', false, true);
      expect(actions).toEqual([]);
    });
  });

  describe('terminal statuses', () => {
    const terminalStates: RequestStatus[] = ['denied', 'cancelled', 'expired', 'fulfilled'];

    terminalStates.forEach((state) => {
      it(`${state} has no available actions`, () => {
        expect(getAvailableActions(state, true, false)).toEqual([]);
        expect(getAvailableActions(state, false, true)).toEqual([]);
        expect(getAvailableActions(state, true, true)).toEqual([]);
      });
    });
  });
});

describe('Request Status Display', () => {
  it('returns correct display info for all statuses', () => {
    const statuses: RequestStatus[] = [
      'draft', 'pending', 'approved', 'denied', 'cancelled', 'expired', 'fulfilled',
    ];

    statuses.forEach((status) => {
      const display = getRequestStatusDisplay(status);
      expect(display).toHaveProperty('label');
      expect(display).toHaveProperty('color');
      expect(display).toHaveProperty('bgColor');
      expect(display).toHaveProperty('icon');
      expect(display.label.length).toBeGreaterThan(0);
    });
  });

  it('uses semantic colors', () => {
    expect(getRequestStatusDisplay('approved').color).toContain('emerald');
    expect(getRequestStatusDisplay('denied').color).toContain('red');
    expect(getRequestStatusDisplay('pending').color).toContain('amber');
    expect(getRequestStatusDisplay('cancelled').color).toContain('slate');
  });
});

describe('Request Type Display', () => {
  const requestTypes = [
    'analyst_qa',
    'analyst_call',
    'report_upgrade',
    'expert_consult',
    'expert_deepdive',
    'bespoke_project',
  ] as const;

  requestTypes.forEach((type) => {
    it(`returns label and description for ${type}`, () => {
      const display = getRequestTypeDisplay(type);
      expect(display).toHaveProperty('label');
      expect(display).toHaveProperty('description');
      expect(display.label.length).toBeGreaterThan(0);
      expect(display.description.length).toBeGreaterThan(0);
    });
  });
});
