// Tests for VoteButtons component
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoteButtons } from '../VoteButtons';

// Mock AnimatedNumber since it might have animation logic
vi.mock('../../ui/AnimatedNumber', () => ({
  AnimatedNumber: ({ value, className }: { value: number; className: string }) => (
    <span data-testid="score" className={className}>{value}</span>
  ),
}));

describe('VoteButtons', () => {
  const defaultProps = {
    score: 5,
    userVote: null as (1 | -1 | null),
    onVote: vi.fn(),
    canUpvote: true,
    canDownvote: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders upvote and downvote buttons', () => {
      render(<VoteButtons {...defaultProps} />);

      expect(screen.getByTitle('Upvote')).toBeInTheDocument();
      expect(screen.getByTitle('Downvote')).toBeInTheDocument();
    });

    it('shows current score', () => {
      render(<VoteButtons {...defaultProps} score={42} />);

      expect(screen.getByTestId('score')).toHaveTextContent('42');
    });

    it('shows negative score', () => {
      render(<VoteButtons {...defaultProps} score={-3} />);

      expect(screen.getByTestId('score')).toHaveTextContent('-3');
    });
  });

  describe('vote states', () => {
    it('highlights upvote when active', () => {
      render(<VoteButtons {...defaultProps} userVote={1} />);

      const upvoteButton = screen.getByTitle('Upvote');
      expect(upvoteButton.className).toContain('text-violet-600');
    });

    it('highlights downvote when active', () => {
      render(<VoteButtons {...defaultProps} userVote={-1} />);

      const downvoteButton = screen.getByTitle('Downvote');
      expect(downvoteButton.className).toContain('text-red-500');
    });

    it('shows neutral state when no vote', () => {
      render(<VoteButtons {...defaultProps} userVote={null} />);

      const upvoteButton = screen.getByTitle('Upvote');
      const downvoteButton = screen.getByTitle('Downvote');

      expect(upvoteButton.className).toContain('text-slate-400');
      expect(downvoteButton.className).toContain('text-slate-400');
    });
  });

  describe('permissions', () => {
    it('disables upvote when canUpvote is false', () => {
      render(<VoteButtons {...defaultProps} canUpvote={false} />);

      const upvoteButton = screen.getByTitle('Need 50 reputation to upvote');
      expect(upvoteButton).toBeDisabled();
      expect(upvoteButton.className).toContain('cursor-not-allowed');
    });

    it('disables downvote when canDownvote is false', () => {
      render(<VoteButtons {...defaultProps} canDownvote={false} />);

      const downvoteButton = screen.getByTitle('Need 250 reputation to downvote');
      expect(downvoteButton).toBeDisabled();
      expect(downvoteButton.className).toContain('cursor-not-allowed');
    });

    it('shows tooltip for disabled upvote', () => {
      render(<VoteButtons {...defaultProps} canUpvote={false} />);

      expect(screen.getByTitle('Need 50 reputation to upvote')).toBeInTheDocument();
    });

    it('shows tooltip for disabled downvote', () => {
      render(<VoteButtons {...defaultProps} canDownvote={false} />);

      expect(screen.getByTitle('Need 250 reputation to downvote')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onVote with 1 when upvoting', () => {
      const onVote = vi.fn();
      render(<VoteButtons {...defaultProps} onVote={onVote} />);

      fireEvent.click(screen.getByTitle('Upvote'));

      expect(onVote).toHaveBeenCalledWith(1);
    });

    it('calls onVote with -1 when downvoting', () => {
      const onVote = vi.fn();
      render(<VoteButtons {...defaultProps} onVote={onVote} />);

      fireEvent.click(screen.getByTitle('Downvote'));

      expect(onVote).toHaveBeenCalledWith(-1);
    });

    it('does not call onVote when upvote is disabled', () => {
      const onVote = vi.fn();
      render(<VoteButtons {...defaultProps} onVote={onVote} canUpvote={false} />);

      fireEvent.click(screen.getByTitle('Need 50 reputation to upvote'));

      expect(onVote).not.toHaveBeenCalled();
    });

    it('does not call onVote when downvote is disabled', () => {
      const onVote = vi.fn();
      render(<VoteButtons {...defaultProps} onVote={onVote} canDownvote={false} />);

      fireEvent.click(screen.getByTitle('Need 250 reputation to downvote'));

      expect(onVote).not.toHaveBeenCalled();
    });

    it('does not call onVote when loading', () => {
      const onVote = vi.fn();
      render(<VoteButtons {...defaultProps} onVote={onVote} isLoading={true} />);

      fireEvent.click(screen.getByTitle('Upvote'));
      fireEvent.click(screen.getByTitle('Downvote'));

      expect(onVote).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('reduces opacity when loading', () => {
      render(<VoteButtons {...defaultProps} isLoading={true} />);

      const upvoteButton = screen.getByTitle('Upvote');
      expect(upvoteButton.className).toContain('opacity-50');
    });

    it('disables buttons when loading', () => {
      render(<VoteButtons {...defaultProps} isLoading={true} />);

      expect(screen.getByTitle('Upvote')).toBeDisabled();
      expect(screen.getByTitle('Downvote')).toBeDisabled();
    });
  });

  describe('size variants', () => {
    it('renders with small size', () => {
      render(<VoteButtons {...defaultProps} size="sm" />);

      // Component should render without errors
      expect(screen.getByTestId('score')).toBeInTheDocument();
    });

    it('renders with medium size (default)', () => {
      render(<VoteButtons {...defaultProps} size="md" />);

      expect(screen.getByTestId('score')).toBeInTheDocument();
    });
  });

  describe('orientation variants', () => {
    it('renders in vertical orientation (default)', () => {
      const { container } = render(<VoteButtons {...defaultProps} orientation="vertical" />);

      expect(container.firstChild).toHaveClass('flex-col');
    });

    it('renders in horizontal orientation', () => {
      const { container } = render(<VoteButtons {...defaultProps} orientation="horizontal" />);

      expect(container.firstChild).not.toHaveClass('flex-col');
    });
  });
});
