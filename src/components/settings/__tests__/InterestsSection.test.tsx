import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterestsSection } from '../InterestsSection';
import type { Interest } from '../../../types/interests';

// Mock the useUserInterests hook
const mockAddInterest = vi.fn();
const mockRemoveInterest = vi.fn();
const mockUpdateInterest = vi.fn();
const mockHasInterest = vi.fn();

const MOCK_INTERESTS: Interest[] = [
  {
    id: 'test_1',
    text: 'Steel',
    canonicalKey: 'europe|hrc|steel',
    source: 'manual',
    region: 'Europe',
    grade: 'HRC',
    coverage: { level: 'decision_grade' },
    savedAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'test_2',
    text: 'Aluminum Pricing',
    canonicalKey: 'aluminum|pricing',
    source: 'chat_inferred',
    coverage: { level: 'web_only', gapReason: 'No Beroe coverage; using web sources' },
    savedAt: '2025-01-20T14:30:00.000Z',
  },
];

const MOCK_WITH_AVAILABLE: Interest[] = [
  ...MOCK_INTERESTS,
  {
    id: 'test_3',
    text: 'Landscaping',
    canonicalKey: 'landscaping',
    source: 'manual',
    coverage: {
      level: 'available',
      gapReason: 'Landscaping is available in the Beroe catalog but not activated',
      matchedCategory: {
        categoryId: 'landscaping',
        categoryName: 'Landscaping',
        domain: 'Facilities',
        isActivated: false,
        hasMarketReport: true,
        hasPriceIndex: false,
        hasSupplierData: true,
        hasNewsAlerts: true,
        hasCostModel: false,
        analystName: 'Nina Patel',
        updateFrequency: 'monthly',
      },
    },
    savedAt: '2025-02-10T12:00:00.000Z',
  },
];

let mockHookReturn = {
  interests: MOCK_INTERESTS,
  isLoading: false,
  error: null as string | null,
  addInterest: mockAddInterest,
  removeInterest: mockRemoveInterest,
  updateInterest: mockUpdateInterest,
  hasInterest: mockHasInterest,
  interestTexts: MOCK_INTERESTS.map(i => i.text),
};

vi.mock('../../../hooks/useUserInterests', () => ({
  useUserInterests: () => mockHookReturn,
}));

describe('InterestsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddInterest.mockResolvedValue(undefined);
    mockRemoveInterest.mockResolvedValue(undefined);
    mockHookReturn = {
      interests: MOCK_INTERESTS,
      isLoading: false,
      error: null,
      addInterest: mockAddInterest,
      removeInterest: mockRemoveInterest,
      updateInterest: mockUpdateInterest,
      hasInterest: mockHasInterest,
      interestTexts: MOCK_INTERESTS.map(i => i.text),
    };
  });

  // ============================================
  // RENDERING
  // ============================================
  describe('Rendering', () => {
    it('shows interest list', () => {
      render(<InterestsSection />);
      expect(screen.getByTestId('interest-list')).toBeInTheDocument();
      expect(screen.getByText('Steel')).toBeInTheDocument();
      expect(screen.getByText('Aluminum Pricing')).toBeInTheDocument();
    });

    it('shows coverage badges', () => {
      render(<InterestsSection />);
      const badges = screen.getAllByTestId('coverage-badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('Decision Grade');
      expect(badges[1]).toHaveTextContent('Web Only');
    });

    it('shows source badges', () => {
      render(<InterestsSection />);
      const badges = screen.getAllByTestId('source-badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('Manual');
      expect(badges[1]).toHaveTextContent('From chat');
    });

    it('shows region and grade when present', () => {
      render(<InterestsSection />);
      expect(screen.getByTestId('region-pill')).toHaveTextContent('Europe');
      expect(screen.getByTestId('grade-pill')).toHaveTextContent('HRC');
    });

    it('interest cards use rounded-2xl with cursor-pointer', () => {
      render(<InterestsSection />);
      const card = screen.getByTestId('interest-card-test_1');
      expect(card.className).toContain('rounded-2xl');
      expect(card.className).toContain('cursor-pointer');
    });

    it('heading uses text-xl font-normal', () => {
      render(<InterestsSection />);
      expect(screen.getByText('My Interests').className).toContain('text-xl');
      expect(screen.getByText('My Interests').className).toContain('font-normal');
    });

    it('shows subtitle text', () => {
      render(<InterestsSection />);
      expect(screen.getByText('Abi uses these to personalize your experience')).toBeInTheDocument();
    });

    it('shows Available badge with blue styling', () => {
      mockHookReturn = {
        ...mockHookReturn,
        interests: MOCK_WITH_AVAILABLE,
        interestTexts: MOCK_WITH_AVAILABLE.map(i => i.text),
      };
      render(<InterestsSection />);
      const badges = screen.getAllByTestId('coverage-badge');
      const availableBadge = badges.find(b => b.textContent?.includes('Available'));
      expect(availableBadge).toBeDefined();
      expect(availableBadge!.className).toContain('bg-blue-50');
      expect(availableBadge!.className).toContain('text-blue-600');
      expect(availableBadge!.className).toContain('border-blue-100');
    });
  });

  // ============================================
  // EMPTY STATE
  // ============================================
  describe('Empty', () => {
    it('shows empty message when no interests', () => {
      mockHookReturn = {
        ...mockHookReturn,
        interests: [],
        interestTexts: [],
      };
      render(<InterestsSection />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No interests yet')).toBeInTheDocument();
    });
  });

  // ============================================
  // ADD
  // ============================================
  describe('Add', () => {
    it('"Add Interest" button uses solid pill style', () => {
      render(<InterestsSection />);
      const btn = screen.getByTestId('add-interest-button');
      expect(btn.className).toContain('rounded-full');
      expect(btn.className).toContain('bg-slate-100');
    });

    it('"Add Interest" shows form', () => {
      render(<InterestsSection />);

      fireEvent.click(screen.getByTestId('add-interest-button'));

      expect(screen.getByTestId('add-form')).toBeInTheDocument();
      expect(screen.getByTestId('interest-text-input')).toBeInTheDocument();
    });

    it('add form uses bg-slate-50 rounded-2xl', () => {
      render(<InterestsSection />);
      fireEvent.click(screen.getByTestId('add-interest-button'));

      const form = screen.getByTestId('add-form');
      expect(form.className).toContain('bg-slate-50');
      expect(form.className).toContain('rounded-2xl');
    });

    it('add form inputs use rounded-xl shape', () => {
      render(<InterestsSection />);
      fireEvent.click(screen.getByTestId('add-interest-button'));

      const textInput = screen.getByTestId('interest-text-input');
      expect(textInput.className).toContain('rounded-xl');
    });

    it('add form has heading and subtitle', () => {
      render(<InterestsSection />);
      fireEvent.click(screen.getByTestId('add-interest-button'));

      expect(screen.getByText('Add Interest')).toBeInTheDocument();
      expect(screen.getByText('Abi will personalize future responses')).toBeInTheDocument();
    });

    it('submit calls addInterest', async () => {
      render(<InterestsSection />);

      // Open form
      fireEvent.click(screen.getByTestId('add-interest-button'));

      // Fill text
      fireEvent.change(screen.getByTestId('interest-text-input'), {
        target: { value: 'Copper - Asia' },
      });

      // Submit
      fireEvent.click(screen.getByTestId('save-interest-button'));

      await waitFor(() => {
        expect(mockAddInterest).toHaveBeenCalledWith('Copper - Asia', 'manual', {
          region: undefined,
          grade: undefined,
        });
      });
    });

    it('X button hides form', () => {
      render(<InterestsSection />);

      fireEvent.click(screen.getByTestId('add-interest-button'));
      expect(screen.getByTestId('add-form')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('cancel-button'));
      expect(screen.queryByTestId('add-form')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // DELETE
  // ============================================
  describe('Delete', () => {
    it('delete button calls removeInterest with correct id', async () => {
      render(<InterestsSection />);

      fireEvent.click(screen.getByTestId('delete-button-test_1'));

      await waitFor(() => {
        expect(mockRemoveInterest).toHaveBeenCalledWith('test_1');
      });
    });
  });

  // ============================================
  // LOADING
  // ============================================
  describe('Loading', () => {
    it('shows skeleton during initial load', () => {
      mockHookReturn = {
        ...mockHookReturn,
        isLoading: true,
        interests: [],
      };
      render(<InterestsSection />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
  });

  // ============================================
  // CARD SELECTION + DRAWER
  // ============================================
  describe('Card selection', () => {
    it('clicking card highlights it with ring', () => {
      render(<InterestsSection />);
      const card = screen.getByTestId('interest-card-test_1');
      fireEvent.click(card);
      expect(card.className).toContain('ring-2');
      expect(card.className).toContain('bg-white');
    });

    it('clicking card opens detail drawer', () => {
      render(<InterestsSection />);
      fireEvent.click(screen.getByTestId('interest-card-test_1'));
      expect(screen.getByTestId('interest-detail-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Steel');
    });

    it('clicking a different card switches selection', () => {
      render(<InterestsSection />);
      fireEvent.click(screen.getByTestId('interest-card-test_1'));
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Steel');

      fireEvent.click(screen.getByTestId('interest-card-test_2'));
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Aluminum Pricing');

      const card1 = screen.getByTestId('interest-card-test_1');
      expect(card1.className).toContain('bg-slate-50');
      expect(card1.className).not.toContain('ring-2');
    });

    it('clicking same card again deselects it', async () => {
      render(<InterestsSection />);
      const card = screen.getByTestId('interest-card-test_1');

      fireEvent.click(card);
      expect(card.className).toContain('ring-2');
      expect(screen.getByTestId('interest-detail-drawer')).toBeInTheDocument();

      fireEvent.click(card);
      expect(card.className).not.toContain('ring-2');
      await waitFor(() => {
        expect(screen.queryByTestId('interest-detail-drawer')).not.toBeInTheDocument();
      });
    });
  });
});
