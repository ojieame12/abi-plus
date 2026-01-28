// Centralized progress computation for deep research pipeline
// Used by both ResearchCommandCenter and DeepResearchProgressArtifact

import type { CommandCenterProgress } from '../types/deepResearch';
import { normalizeStage } from '../types/deepResearch';

/**
 * Compute overall progress percentage (0–100) from CommandCenterProgress.
 * Normalizes legacy stage names and guards against zero-division.
 *
 * Ranges:
 *   plan:      0–10%  (based on phase completion)
 *   research:  10–60% (based on agent completion)
 *   synthesis: 60–90% (based on section completion)
 *   delivery:  90–100% (based on phase completion)
 *   complete:  100%
 */
export const computeProgress = (progress: CommandCenterProgress): number => {
  const stage = normalizeStage(progress.stage);
  const { agents, synthesis, phases } = progress;

  switch (stage) {
    case 'plan': {
      if (!phases || phases.length === 0) return 5;
      const done = phases.filter(p => p.status === 'complete').length;
      return Math.round((done / phases.length) * 10);
    }
    case 'research': {
      const total = Math.max(agents.length, 1);
      const done = agents.filter(a => a.status === 'complete' || a.status === 'error').length;
      return Math.round(10 + (done / total) * 50);
    }
    case 'synthesis': {
      // 60–85%: section writing, 85–90%: visuals/quality
      const visualsPhase = phases?.find(p => p.id === 'synthesis.visuals');
      const visualsDone = visualsPhase?.status === 'complete';
      const visualsActive = visualsPhase?.status === 'active';

      if (visualsDone) return 90;
      if (visualsActive) return 87;

      if (!synthesis) return 60;
      const totalSections = Math.max(synthesis.totalSections, 1);
      const pct = (synthesis.sectionsComplete / totalSections) * 100;
      return Math.round(60 + pct * 0.25); // Caps at ~85
    }
    case 'delivery': {
      if (!phases || phases.length === 0) return 92;
      const done = phases.filter(p => p.status === 'complete').length;
      return Math.round(90 + (done / phases.length) * 10);
    }
    case 'complete':
      return 100;
    default:
      return 0;
  }
};
