import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeView } from '../HomeView';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { animate, initial, exit, transition, layoutId, className, ...rest } = props;
      return <div className={className as string} {...rest}>{children as React.ReactNode}</div>;
    },
    h1: ({ children, ...props }: Record<string, unknown>) => {
      const { animate, initial, transition, className, ...rest } = props;
      return <h1 className={className as string} {...rest}>{children as React.ReactNode}</h1>;
    },
    button: ({ children, onClick, className, ...props }: Record<string, unknown>) => {
      const { animate, transition, layoutId, ...rest } = props;
      return <button onClick={onClick as () => void} className={className as string} {...rest}>{children as React.ReactNode}</button>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('HomeView personalization', () => {
  const defaultProps = {
    onOpenArtifact: vi.fn(),
    onStartChat: vi.fn(),
  };

  describe('With interests', () => {
    it('"Recommended" tab shows personalized text containing interest', () => {
      render(
        <HomeView
          {...defaultProps}
          userInterests={['Steel - HRC - Europe', 'Aluminum Pricing']}
        />
      );

      // The recommended tab cards should contain interest text
      const steelTexts = screen.getAllByText(/Steel - HRC - Europe/);
      expect(steelTexts.length).toBeGreaterThan(0);
    });

    it('personalized suggestions include interest keywords', () => {
      render(
        <HomeView
          {...defaultProps}
          userInterests={['Copper - Americas']}
        />
      );

      // Should see "Copper - Americas" in suggestion cards
      const copperTexts = screen.getAllByText(/Copper - Americas/);
      expect(copperTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Without interests', () => {
    it('falls back to static TAB_SUGGESTIONS', () => {
      render(
        <HomeView
          {...defaultProps}
          userInterests={[]}
        />
      );

      // Should see default static suggestions
      expect(screen.queryByText('What is the price trend for Corrugated Boxes in Europe?')).toBeInTheDocument();
    });

    it('shows defaults when userInterests is undefined', () => {
      render(
        <HomeView
          {...defaultProps}
        />
      );

      expect(screen.queryByText('What is the price trend for Corrugated Boxes in Europe?')).toBeInTheDocument();
    });
  });
});
