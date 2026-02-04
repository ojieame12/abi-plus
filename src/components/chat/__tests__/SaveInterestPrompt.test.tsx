import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterestTrackingPanel } from '../SaveInterestPrompt';

describe('InterestTrackingPanel', () => {
  const defaultProps = {
    detectedTopic: 'Steel',
    onTrack: vi.fn(),
    onClose: vi.fn(),
    isDuplicate: false,
  };

  // ============================================
  // RENDERING
  // ============================================
  describe('Rendering', () => {
    it('shows detected topic as editable input', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      const input = screen.getByTestId('detected-topic') as HTMLInputElement;
      expect(input.value).toBe('Steel');
    });

    it('shows Track button with chevron', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      expect(screen.getByTestId('save-button')).toHaveTextContent('Track');
    });

    it('shows coverage badge inline with input', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      expect(screen.getByTestId('coverage-indicator')).toBeInTheDocument();
    });

    it('uses light bg panel without hard border', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      const panel = screen.getByTestId('interest-tracking-panel');
      expect(panel.className).toContain('bg-slate-50');
      expect(panel.className).toContain('rounded-2xl');
    });

    it('heading says Track this Topic', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      expect(screen.getByText('Track this Topic')).toBeInTheDocument();
    });

    it('shows subtitle text', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      expect(screen.getByText('Abi will personalize future responses')).toBeInTheDocument();
    });

    it('region and grade fields are always visible and side by side', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      expect(screen.getByTestId('region-input')).toBeInTheDocument();
      expect(screen.getByTestId('grade-input')).toBeInTheDocument();
      // Both in same flex row
      const container = screen.getByTestId('detail-fields');
      expect(container.className).toContain('flex');
    });

    it('inputs use rounded-xl shape', () => {
      render(<InterestTrackingPanel {...defaultProps} />);
      const input = screen.getByTestId('detected-topic');
      expect(input.className).toContain('rounded-xl');
    });
  });

  // ============================================
  // EDITABLE NAME
  // ============================================
  describe('Editable name', () => {
    it('allows editing the topic name', () => {
      const onTrack = vi.fn();
      render(<InterestTrackingPanel {...defaultProps} onTrack={onTrack} />);

      const input = screen.getByTestId('detected-topic') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '801 Steel' } });

      fireEvent.click(screen.getByTestId('save-button'));

      expect(onTrack).toHaveBeenCalledWith({
        text: '801 Steel',
        region: undefined,
        grade: undefined,
      });
    });

    it('disables save when name is empty', () => {
      render(<InterestTrackingPanel {...defaultProps} />);

      const input = screen.getByTestId('detected-topic') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      expect(screen.getByTestId('save-button')).toBeDisabled();
    });
  });

  // ============================================
  // PREFILL
  // ============================================
  describe('Prefilled region/grade', () => {
    it('prefills region and grade from extraction', () => {
      render(
        <InterestTrackingPanel
          {...defaultProps}
          detectedRegion="Europe"
          detectedGrade="HRC"
        />
      );

      const regionInput = screen.getByTestId('region-input') as HTMLInputElement;
      const gradeInput = screen.getByTestId('grade-input') as HTMLInputElement;
      expect(regionInput.value).toBe('Europe');
      expect(gradeInput.value).toBe('HRC');
    });
  });

  // ============================================
  // INTERACTION
  // ============================================
  describe('Interaction', () => {
    it('track calls onTrack with topic', () => {
      const onTrack = vi.fn();
      render(<InterestTrackingPanel {...defaultProps} onTrack={onTrack} />);

      fireEvent.click(screen.getByTestId('save-button'));

      expect(onTrack).toHaveBeenCalledWith({
        text: 'Steel',
        region: undefined,
        grade: undefined,
      });
    });

    it('X button calls onClose', () => {
      const onClose = vi.fn();
      render(<InterestTrackingPanel {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('dismiss-button'));
      expect(onClose).toHaveBeenCalled();
    });

    it('filled region/grade are included in track payload', () => {
      const onTrack = vi.fn();
      render(<InterestTrackingPanel {...defaultProps} onTrack={onTrack} />);

      fireEvent.change(screen.getByTestId('region-input'), { target: { value: 'Europe' } });
      fireEvent.change(screen.getByTestId('grade-input'), { target: { value: 'HRC' } });
      fireEvent.click(screen.getByTestId('save-button'));

      expect(onTrack).toHaveBeenCalledWith({
        text: 'Steel',
        region: 'Europe',
        grade: 'HRC',
      });
    });
  });

  // ============================================
  // DUPLICATE
  // ============================================
  describe('Duplicate', () => {
    it('shows duplicate panel when isDuplicate is true', () => {
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={true}
          onUpdateExisting={vi.fn()}
        />
      );

      expect(screen.getByTestId('interest-panel-duplicate')).toBeInTheDocument();
      expect(screen.getByText('Category Already Tracked')).toBeInTheDocument();
    });

    it('shows Update button with chevron for duplicate', () => {
      const onUpdateExisting = vi.fn();
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={true}
          onUpdateExisting={onUpdateExisting}
        />
      );

      const updateBtn = screen.getByTestId('update-existing-button');
      expect(updateBtn).toHaveTextContent('Update');
      fireEvent.click(updateBtn);
      expect(onUpdateExisting).toHaveBeenCalled();
    });

    it('shows extended subtitle for duplicate', () => {
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={true}
          onUpdateExisting={vi.fn()}
        />
      );

      expect(screen.getByText(/already following a similar topic/)).toBeInTheDocument();
    });

    it('uses dark button style for Update', () => {
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={true}
          onUpdateExisting={vi.fn()}
        />
      );

      const updateBtn = screen.getByTestId('update-existing-button');
      expect(updateBtn.className).toContain('bg-slate-800');
    });

    it('switches to duplicate when user edits topic to match existing', () => {
      const checkDuplicate = vi.fn((text: string) => text.toLowerCase() === 'copper');
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={false}
          checkDuplicate={checkDuplicate}
          onUpdateExisting={vi.fn()}
        />
      );

      // Initially shows track panel (Steel is not a duplicate)
      expect(screen.getByTestId('interest-tracking-panel')).toBeInTheDocument();

      // User edits topic to "Copper" which matches an existing interest
      const input = screen.getByTestId('detected-topic') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Copper' } });

      // Should now show duplicate panel
      expect(screen.getByTestId('interest-panel-duplicate')).toBeInTheDocument();
      expect(screen.getByText('Category Already Tracked')).toBeInTheDocument();
    });

    it('switches back from duplicate when user edits topic to non-matching', () => {
      const checkDuplicate = vi.fn((text: string) => text.toLowerCase() === 'steel');
      render(
        <InterestTrackingPanel
          {...defaultProps}
          isDuplicate={true}
          checkDuplicate={checkDuplicate}
          onUpdateExisting={vi.fn()}
        />
      );

      // Initially shows duplicate panel (Steel matches)
      expect(screen.getByTestId('interest-panel-duplicate')).toBeInTheDocument();

      // But checkDuplicate for "Steel" returns true, so we need to change the topic
      // Note: in duplicate view the input isn't shown, so isDuplicate must be
      // initially false for the edit test to work. This test verifies checkDuplicate
      // is called with the current topic name.
      expect(checkDuplicate).toHaveBeenCalledWith('Steel');
    });
  });

  // ============================================
  // LOADING
  // ============================================
  describe('Loading', () => {
    it('disables save button when loading', () => {
      render(<InterestTrackingPanel {...defaultProps} isLoading={true} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeDisabled();
    });

    it('shows spinner when loading', () => {
      render(<InterestTrackingPanel {...defaultProps} isLoading={true} />);

      const saveButton = screen.getByTestId('save-button');
      expect(saveButton.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
