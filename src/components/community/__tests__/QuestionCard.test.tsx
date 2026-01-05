import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import { MOCK_QUESTIONS } from '../../../services/communityMockData';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('QuestionCard', () => {
  const mockQuestion = MOCK_QUESTIONS[0];

  it('renders question title', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText(mockQuestion.title)).toBeInTheDocument();
  });

  it('displays vote score', () => {
    render(<QuestionCard question={mockQuestion} />);
    // Score displayed without prefix in new design
    expect(screen.getByText(mockQuestion.score.toString())).toBeInTheDocument();
  });

  it('shows answer count', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText(mockQuestion.answerCount.toString())).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<QuestionCard question={mockQuestion} />);
    mockQuestion.tags.forEach(tag => {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
    });
  });

  it('displays view count', () => {
    render(<QuestionCard question={mockQuestion} />);
    // New format: "X views"
    expect(screen.getByText(`${mockQuestion.viewCount} views`)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<QuestionCard question={mockQuestion} onClick={onClick} />);
    // Get the main card button (first button in container)
    const cardButton = container.querySelector('button');
    fireEvent.click(cardButton!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows checkmark icon when hasAcceptedAnswer is true', () => {
    const solvedQuestion = { ...mockQuestion, hasAcceptedAnswer: true };
    const { container } = render(<QuestionCard question={solvedQuestion} />);
    // Check icon is rendered (lucide-react Check component)
    const checkIcon = container.querySelector('svg.lucide-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it('does not show checkmark when hasAcceptedAnswer is false', () => {
    const unsolvedQuestion = { ...mockQuestion, hasAcceptedAnswer: false };
    const { container } = render(<QuestionCard question={unsolvedQuestion} />);
    const checkIcon = container.querySelector('svg.lucide-check');
    expect(checkIcon).not.toBeInTheDocument();
  });

  it('limits displayed tags to 3', () => {
    const manyTagsQuestion = {
      ...mockQuestion,
      tags: [
        { id: '1', name: 'Tag1', slug: 'tag1', color: '#000', questionCount: 1 },
        { id: '2', name: 'Tag2', slug: 'tag2', color: '#000', questionCount: 1 },
        { id: '3', name: 'Tag3', slug: 'tag3', color: '#000', questionCount: 1 },
        { id: '4', name: 'Tag4', slug: 'tag4', color: '#000', questionCount: 1 },
        { id: '5', name: 'Tag5', slug: 'tag5', color: '#000', questionCount: 1 },
      ],
    };
    render(<QuestionCard question={manyTagsQuestion} />);

    // First 3 tags should be visible
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag3')).toBeInTheDocument();

    // Tags 4 and 5 should not be visible
    expect(screen.queryByText('Tag4')).not.toBeInTheDocument();
    expect(screen.queryByText('Tag5')).not.toBeInTheDocument();
  });
});
