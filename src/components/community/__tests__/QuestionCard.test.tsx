import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import { MOCK_QUESTIONS } from '../../../services/communityMockData';

// Mock framer-motion - filter out animation props to prevent DOM warnings
const filterMotionProps = <T extends Record<string, unknown>>(props: T): Partial<T> => {
  const motionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView',
    'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
    'layout', 'layoutId', 'onAnimationStart', 'onAnimationComplete',
  ];
  const filtered = { ...props };
  motionProps.forEach(prop => delete filtered[prop]);
  return filtered;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, style, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div onClick={onClick} className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button onClick={onClick} className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </button>
    ),
    span: ({ children, className, style, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => (
      <span className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
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
    // Component renders "{answerCount} Comments"
    expect(screen.getByText(`${mockQuestion.answerCount} Comments`)).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<QuestionCard question={mockQuestion} />);
    mockQuestion.tags.forEach(tag => {
      expect(screen.getByText(tag.name)).toBeInTheDocument();
    });
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<QuestionCard question={mockQuestion} onClick={onClick} />);
    // Get the main card div (motion.div is the root clickable element)
    const cardDiv = container.firstChild as HTMLElement;
    fireEvent.click(cardDiv);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('limits displayed tags to 4', () => {
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

    // First 4 tags should be visible (component uses slice(0, 4))
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag4')).toBeInTheDocument();

    // Tag 5 should not be visible
    expect(screen.queryByText('Tag5')).not.toBeInTheDocument();
  });
});
