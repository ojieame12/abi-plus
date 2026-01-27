import { describe, it, expect } from 'vitest';
import {
  normalizeStage,
  initPhases,
  STAGE_PHASES,
  createInitialProgress,
} from '../deepResearch';
import type { CommandCenterStage, CommandCenterStageAll } from '../deepResearch';

describe('normalizeStage', () => {
  it('maps "decomposing" → "plan"', () => {
    expect(normalizeStage('decomposing')).toBe('plan');
  });

  it('maps "researching" → "research"', () => {
    expect(normalizeStage('researching')).toBe('research');
  });

  it('maps "synthesizing" → "synthesis"', () => {
    expect(normalizeStage('synthesizing')).toBe('synthesis');
  });

  it('passes through canonical names unchanged', () => {
    const canonical: CommandCenterStage[] = ['plan', 'research', 'synthesis', 'delivery', 'complete'];
    for (const stage of canonical) {
      expect(normalizeStage(stage)).toBe(stage);
    }
  });
});

describe('STAGE_PHASES', () => {
  it('has 3 phases for each active stage', () => {
    const activeStages: CommandCenterStage[] = ['plan', 'research', 'synthesis', 'delivery'];
    for (const stage of activeStages) {
      expect(STAGE_PHASES[stage]).toHaveLength(3);
    }
  });

  it('has 0 phases for the complete stage', () => {
    expect(STAGE_PHASES.complete).toHaveLength(0);
  });

  it('each phase has id and label', () => {
    for (const [stage, phases] of Object.entries(STAGE_PHASES)) {
      for (const phase of phases) {
        expect(phase.id).toBeTruthy();
        expect(phase.label).toBeTruthy();
        expect(phase.id).toContain(`${stage}.`);
      }
    }
  });
});

describe('initPhases', () => {
  it('returns correct phase count per stage', () => {
    expect(initPhases('plan')).toHaveLength(3);
    expect(initPhases('research')).toHaveLength(3);
    expect(initPhases('synthesis')).toHaveLength(3);
    expect(initPhases('delivery')).toHaveLength(3);
    expect(initPhases('complete')).toHaveLength(0);
  });

  it('initializes all phases with pending status', () => {
    const phases = initPhases('plan');
    for (const phase of phases) {
      expect(phase.status).toBe('pending');
      expect(phase.startedAt).toBeUndefined();
      expect(phase.completedAt).toBeUndefined();
    }
  });

  it('preserves id and label from STAGE_PHASES', () => {
    const phases = initPhases('research');
    expect(phases[0].id).toBe('research.internal');
    expect(phases[0].label).toBe('Internal Intelligence');
    expect(phases[1].id).toBe('research.web');
    expect(phases[2].id).toBe('research.consolidation');
  });
});

describe('createInitialProgress', () => {
  it('returns a valid structure', () => {
    const progress = createInitialProgress();
    expect(progress.stage).toBe('plan');
    expect(progress.agents).toEqual([]);
    expect(progress.activeAgentId).toBeNull();
    expect(progress.totalSources).toBe(0);
    expect(progress.totalSourcesRaw).toBe(0);
    expect(typeof progress.startedAt).toBe('number');
    expect(progress.insightStream).toEqual([]);
    expect(progress.tags).toEqual([]);
  });

  it('includes phases initialized for plan stage', () => {
    const progress = createInitialProgress();
    expect(progress.phases).toHaveLength(3);
    expect(progress.phases[0].id).toBe('plan.decomposition');
    expect(progress.phases.every(p => p.status === 'pending')).toBe(true);
  });

  it('includes empty completedStages array', () => {
    const progress = createInitialProgress();
    expect(progress.completedStages).toEqual([]);
  });
});
