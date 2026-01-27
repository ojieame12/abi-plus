import { describe, it, expect } from 'vitest';
import { computeProgress } from '../../utils/deepResearchProgress';
import { createInitialProgress, initPhases } from '../../types/deepResearch';
import type { CommandCenterProgress, CommandCenterStage } from '../../types/deepResearch';

/** Create a progress object at a specific stage for testing */
const makeProgress = (overrides: Partial<CommandCenterProgress> = {}): CommandCenterProgress => ({
  ...createInitialProgress(),
  ...overrides,
});

describe('computeProgress', () => {
  describe('plan stage', () => {
    it('returns 0 when no phases are complete', () => {
      const p = makeProgress({ stage: 'plan', phases: initPhases('plan') });
      expect(computeProgress(p)).toBe(0);
    });

    it('returns proportional value as phases complete', () => {
      const phases = initPhases('plan');
      phases[0].status = 'complete';
      const p = makeProgress({ stage: 'plan', phases });
      // 1/3 * 10 = 3.33 → rounded to 3
      expect(computeProgress(p)).toBe(3);
    });

    it('returns 10 when all plan phases complete', () => {
      const phases = initPhases('plan');
      phases.forEach(ph => { ph.status = 'complete'; });
      const p = makeProgress({ stage: 'plan', phases });
      expect(computeProgress(p)).toBe(10);
    });

    it('returns 5 when phases array is empty', () => {
      const p = makeProgress({ stage: 'plan', phases: [] });
      expect(computeProgress(p)).toBe(5);
    });
  });

  describe('research stage', () => {
    it('returns 10 with 0 agents completed', () => {
      const p = makeProgress({
        stage: 'research',
        agents: [
          { id: '1', name: 'A', query: '', category: 'general', status: 'queued', sourcesFound: 0, uniqueSourcesFound: 0, insights: [], sources: [], findings: '' },
        ],
      });
      expect(computeProgress(p)).toBe(10);
    });

    it('returns 60 with all agents completed', () => {
      const p = makeProgress({
        stage: 'research',
        agents: [
          { id: '1', name: 'A', query: '', category: 'general', status: 'complete', sourcesFound: 5, uniqueSourcesFound: 5, insights: [], sources: [], findings: '' },
          { id: '2', name: 'B', query: '', category: 'general', status: 'complete', sourcesFound: 3, uniqueSourcesFound: 3, insights: [], sources: [], findings: '' },
        ],
      });
      expect(computeProgress(p)).toBe(60);
    });

    it('counts errored agents as done', () => {
      const p = makeProgress({
        stage: 'research',
        agents: [
          { id: '1', name: 'A', query: '', category: 'general', status: 'error', sourcesFound: 0, uniqueSourcesFound: 0, insights: [], sources: [], findings: '', error: 'fail' },
        ],
      });
      expect(computeProgress(p)).toBe(60);
    });

    it('handles zero agents without NaN', () => {
      const p = makeProgress({ stage: 'research', agents: [] });
      // Math.max(0, 1) = 1, so 0/1 * 50 = 0, total = 10
      expect(computeProgress(p)).toBe(10);
      expect(Number.isFinite(computeProgress(p))).toBe(true);
    });
  });

  describe('synthesis stage', () => {
    it('returns 60 with no synthesis data', () => {
      const p = makeProgress({ stage: 'synthesis' });
      expect(computeProgress(p)).toBe(60);
    });

    it('returns progress based on section completion', () => {
      const p = makeProgress({
        stage: 'synthesis',
        synthesis: { currentSection: 'exec', currentSectionTitle: 'Executive Summary', sectionsComplete: 3, totalSections: 6 },
      });
      // 60 + (50 * 0.3) = 75
      expect(computeProgress(p)).toBe(75);
    });

    it('returns 90 when all sections complete', () => {
      const p = makeProgress({
        stage: 'synthesis',
        synthesis: { currentSection: 'done', currentSectionTitle: 'Done', sectionsComplete: 6, totalSections: 6 },
      });
      expect(computeProgress(p)).toBe(90);
    });

    it('handles zero totalSections without NaN', () => {
      const p = makeProgress({
        stage: 'synthesis',
        synthesis: { currentSection: '', currentSectionTitle: '', sectionsComplete: 0, totalSections: 0 },
      });
      expect(Number.isFinite(computeProgress(p))).toBe(true);
    });
  });

  describe('delivery stage', () => {
    it('returns 92 with no phases', () => {
      const p = makeProgress({ stage: 'delivery', phases: [] });
      expect(computeProgress(p)).toBe(92);
    });

    it('returns 100 when all delivery phases complete', () => {
      const phases = initPhases('delivery');
      phases.forEach(ph => { ph.status = 'complete'; });
      const p = makeProgress({ stage: 'delivery', phases });
      expect(computeProgress(p)).toBe(100);
    });
  });

  describe('complete stage', () => {
    it('always returns 100', () => {
      const p = makeProgress({ stage: 'complete' });
      expect(computeProgress(p)).toBe(100);
    });
  });

  describe('legacy stage names', () => {
    it('"decomposing" produces same range as "plan"', () => {
      const legacy = makeProgress({ stage: 'decomposing', phases: initPhases('plan') });
      const canonical = makeProgress({ stage: 'plan', phases: initPhases('plan') });
      expect(computeProgress(legacy)).toBe(computeProgress(canonical));
    });

    it('"researching" produces same range as "research"', () => {
      const agents = [
        { id: '1', name: 'A', query: '', category: 'general' as const, status: 'complete' as const, sourcesFound: 3, uniqueSourcesFound: 3, insights: [] as string[], sources: [], findings: '' },
      ];
      const legacy = makeProgress({ stage: 'researching', agents });
      const canonical = makeProgress({ stage: 'research', agents });
      expect(computeProgress(legacy)).toBe(computeProgress(canonical));
    });

    it('"synthesizing" produces same range as "synthesis"', () => {
      const legacy = makeProgress({ stage: 'synthesizing' });
      const canonical = makeProgress({ stage: 'synthesis' });
      expect(computeProgress(legacy)).toBe(computeProgress(canonical));
    });
  });

  describe('monotonicity', () => {
    it('progress increases through stages', () => {
      const planP = computeProgress(makeProgress({ stage: 'plan', phases: initPhases('plan') }));
      const researchP = computeProgress(makeProgress({ stage: 'research', agents: [] }));
      const synthesisP = computeProgress(makeProgress({ stage: 'synthesis' }));
      const deliveryP = computeProgress(makeProgress({ stage: 'delivery', phases: [] }));
      const completeP = computeProgress(makeProgress({ stage: 'complete' }));

      expect(planP).toBeLessThanOrEqual(researchP);
      expect(researchP).toBeLessThanOrEqual(synthesisP);
      expect(synthesisP).toBeLessThanOrEqual(deliveryP);
      expect(deliveryP).toBeLessThanOrEqual(completeP);
    });
  });
});
