import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerCard } from '../AnswerCard';
import { MOCK_ANSWERS } from '../../../services/communityMockData';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('AnswerCard', () => {
  const mockAnswer = MOCK_ANSWERS[0];

  it('renders answer body content', () => {
    render(<AnswerCard answer={mockAnswer} />);
    // Check for part of the body text
    expect(screen.getByText(/Great question/i)).toBeInTheDocument();
  });

  it('displays vote score', () => {
    render(<AnswerCard answer={mockAnswer} />);
    // New format: "X votes"
    expect(screen.getByText(`${mockAnswer.score} votes`)).toBeInTheDocument();
  });

  it('shows "Accepted" badge when isAccepted is true', () => {
    const acceptedAnswer = { ...mockAnswer, isAccepted: true };
    render(<AnswerCard answer={acceptedAnswer} />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('does not show "Accepted" badge when isAccepted is false', () => {
    const notAcceptedAnswer = { ...mockAnswer, isAccepted: false };
    render(<AnswerCard answer={notAcceptedAnswer} />);
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
  });

  it('displays author name', () => {
    render(<AnswerCard answer={mockAnswer} />);
    expect(screen.getByText(mockAnswer.author!.displayName!)).toBeInTheDocument();
  });

  it('shows author reputation when showReputation is true in AuthorBadge', () => {
    render(<AnswerCard answer={mockAnswer} />);
    // AuthorBadge with showReputation=true should show the reputation
    expect(screen.getByText(`(${mockAnswer.author!.reputation.toLocaleString()})`)).toBeInTheDocument();
  });

  it('applies left border for accepted answers', () => {
    const acceptedAnswer = { ...mockAnswer, isAccepted: true };
    const { container } = render(<AnswerCard answer={acceptedAnswer} />);
    const card = container.firstChild;
    expect(card).toHaveClass('border-l-2');
    expect(card).toHaveClass('border-l-emerald-500');
  });

  it('applies default styling for non-accepted answers', () => {
    const notAcceptedAnswer = { ...mockAnswer, isAccepted: false };
    const { container } = render(<AnswerCard answer={notAcceptedAnswer} />);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white/80');
  });

  it('handles negative scores', () => {
    const negativeScoreAnswer = { ...mockAnswer, score: -5, upvotes: 2, downvotes: 7 };
    render(<AnswerCard answer={negativeScoreAnswer} />);
    expect(screen.getByText('-5 votes')).toBeInTheDocument();
  });

  it('handles zero scores', () => {
    const zeroScoreAnswer = { ...mockAnswer, score: 0, upvotes: 5, downvotes: 5 };
    render(<AnswerCard answer={zeroScoreAnswer} />);
    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });
});
