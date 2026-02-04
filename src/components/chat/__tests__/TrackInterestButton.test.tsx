import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackInterestButton } from '../TrackInterestButton';

describe('TrackInterestButton', () => {
  // ============================================
  // VISUAL STATES
  // ============================================
  describe('Visual states', () => {
    it('renders default state (not tracked, not expanded)', () => {
      render(
        <TrackInterestButton isTracked={false} isExpanded={false} onClick={vi.fn()} />
      );

      const button = screen.getByTestId('track-interest-button');
      expect(button).toHaveTextContent('Track');
      expect(button.className).toContain('text-slate-500');
      expect(button.className).toContain('border-slate-200');
    });

    it('renders active state (not tracked, expanded)', () => {
      render(
        <TrackInterestButton isTracked={false} isExpanded={true} onClick={vi.fn()} />
      );

      const button = screen.getByTestId('track-interest-button');
      expect(button).toHaveTextContent('Track');
      expect(button.className).toContain('bg-slate-800');
      expect(button.className).toContain('text-white');
    });

    it('renders tracked state (tracked)', () => {
      render(
        <TrackInterestButton isTracked={true} isExpanded={false} onClick={vi.fn()} />
      );

      const button = screen.getByTestId('track-interest-button');
      expect(button).toHaveTextContent('Tracked');
      expect(button.className).toContain('bg-violet-600');
      expect(button.className).toContain('text-white');
    });
  });

  // ============================================
  // INTERACTION
  // ============================================
  describe('Interaction', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(
        <TrackInterestButton isTracked={false} isExpanded={false} onClick={onClick} />
      );

      fireEvent.click(screen.getByTestId('track-interest-button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // LABELS
  // ============================================
  describe('Labels', () => {
    it('shows "Track" when not tracked', () => {
      render(
        <TrackInterestButton isTracked={false} isExpanded={false} onClick={vi.fn()} />
      );
      expect(screen.getByTestId('track-interest-button')).toHaveTextContent('Track');
    });

    it('shows "Tracked" when tracked', () => {
      render(
        <TrackInterestButton isTracked={true} isExpanded={false} onClick={vi.fn()} />
      );
      expect(screen.getByTestId('track-interest-button')).toHaveTextContent('Tracked');
    });
  });
});
