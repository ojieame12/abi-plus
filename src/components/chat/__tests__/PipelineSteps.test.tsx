import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineSteps, PhaseList } from '../PipelineSteps';
import { initPhases } from '../../../types/deepResearch';
import type { CommandCenterStage, StagePhase } from '../../../types/deepResearch';

describe('PipelineSteps', () => {
  it('renders 4 step circles', () => {
    const { container } = render(
      <PipelineSteps
        currentStage="plan"
        completedStages={[]}
        phases={initPhases('plan')}
      />
    );
    const steps = container.querySelectorAll('[data-testid^="pipeline-step-"]');
    expect(steps).toHaveLength(4);
  });

  it('marks active stage with active test id', () => {
    const { container } = render(
      <PipelineSteps
        currentStage="research"
        completedStages={['plan']}
        phases={initPhases('research')}
      />
    );
    expect(container.querySelector('[data-testid="step-active-research"]')).toBeTruthy();
  });

  it('shows check icon for completed stages', () => {
    const { container } = render(
      <PipelineSteps
        currentStage="synthesis"
        completedStages={['plan', 'research']}
        phases={initPhases('synthesis')}
      />
    );
    expect(container.querySelector('[data-testid="step-complete-plan"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="step-complete-research"]')).toBeTruthy();
  });

  it('shows pending state for future stages', () => {
    const { container } = render(
      <PipelineSteps
        currentStage="plan"
        completedStages={[]}
        phases={initPhases('plan')}
      />
    );
    expect(container.querySelector('[data-testid="step-pending-research"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="step-pending-synthesis"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="step-pending-delivery"]')).toBeTruthy();
  });

  it('renders phase detail for active phase', () => {
    const phases: StagePhase[] = [
      { id: 'plan.decomposition', label: 'Query Decomposition', status: 'active', detail: '5 agents queued' },
      { id: 'plan.deduplication', label: 'Deduplication', status: 'pending' },
      { id: 'plan.assignment', label: 'Agent Assignment', status: 'pending' },
    ];
    render(
      <PipelineSteps
        currentStage="plan"
        completedStages={[]}
        phases={phases}
      />
    );
    expect(screen.getByText('5 agents queued')).toBeTruthy();
  });
});

describe('PhaseList', () => {
  it('renders nothing when phases are empty', () => {
    const { container } = render(<PhaseList phases={[]} />);
    expect(container.querySelector('[data-testid="phase-list"]')).toBeNull();
  });

  it('renders all phases', () => {
    const phases = initPhases('plan');
    render(<PhaseList phases={phases} />);
    expect(screen.getByText('Query Decomposition')).toBeTruthy();
    expect(screen.getByText('Deduplication')).toBeTruthy();
    expect(screen.getByText('Agent Assignment')).toBeTruthy();
  });

  it('shows detail text for active phases', () => {
    const phases: StagePhase[] = [
      { id: 'plan.decomposition', label: 'Query Decomposition', status: 'complete' },
      { id: 'plan.deduplication', label: 'Deduplication', status: 'active', detail: '5 agents after dedup' },
      { id: 'plan.assignment', label: 'Agent Assignment', status: 'pending' },
    ];
    render(<PhaseList phases={phases} />);
    expect(screen.getByText(/5 agents after dedup/)).toBeTruthy();
  });
});
