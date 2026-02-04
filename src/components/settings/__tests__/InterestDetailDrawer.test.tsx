import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterestDetailDrawer } from '../InterestDetailDrawer';
import type { Interest } from '../../../types/interests';

const MOCK_INTEREST: Interest = {
  id: 'test_1',
  text: 'Steel',
  canonicalKey: 'europe|hrc|steel',
  source: 'chat_inferred',
  region: 'Europe',
  grade: 'HRC',
  coverage: { level: 'decision_grade' },
  savedAt: '2025-01-15T10:00:00.000Z',
  conversationId: 'conv_123',
  searchContext: 'What is the price of HRC steel in Europe?',
};

const MOCK_MINIMAL: Interest = {
  id: 'test_2',
  text: 'Copper',
  canonicalKey: 'copper',
  source: 'manual',
  savedAt: '2025-02-01T08:00:00.000Z',
};

const MOCK_AVAILABLE: Interest = {
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
      subDomain: 'Grounds',
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
};

const MOCK_WITH_CAPABILITIES: Interest = {
  id: 'test_4',
  text: 'Steel',
  canonicalKey: 'steel',
  source: 'manual',
  coverage: {
    level: 'decision_grade',
    matchedCategory: {
      categoryId: 'steel_hrc',
      categoryName: 'Steel (Hot Rolled Coil)',
      domain: 'Metals',
      subDomain: 'Ferrous',
      isActivated: true,
      hasMarketReport: true,
      hasPriceIndex: true,
      hasSupplierData: true,
      hasNewsAlerts: true,
      hasCostModel: false,
      analystName: 'Sarah Chen',
      updateFrequency: 'weekly',
    },
  },
  savedAt: '2025-02-15T10:00:00.000Z',
};

describe('InterestDetailDrawer', () => {
  const defaultProps = {
    interest: MOCK_INTEREST,
    onClose: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // VISIBILITY
  // ============================================
  describe('Visibility', () => {
    it('does not render when interest is null', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={null} />);
      expect(screen.queryByTestId('interest-detail-drawer')).not.toBeInTheDocument();
    });

    it('renders drawer when interest provided', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('interest-detail-drawer')).toBeInTheDocument();
    });

    it('renders backdrop', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-backdrop')).toBeInTheDocument();
    });
  });

  // ============================================
  // HEADER
  // ============================================
  describe('Header', () => {
    it('shows interest name as title', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('Steel');
    });

    it('shows coverage badge in header', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('drawer-coverage-badge')).toHaveTextContent('Decision Grade');
    });
  });

  // ============================================
  // ORIGIN SECTION
  // ============================================
  describe('Origin', () => {
    it('shows source badge', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('origin-source')).toHaveTextContent('From chat');
    });

    it('shows formatted date', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('origin-date')).toHaveTextContent('Tracked on Jan 15, 2025');
    });

    it('shows search context for chat-inferred interests', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      const originQuery = screen.getByTestId('origin-query');
      expect(originQuery).toBeInTheDocument();
      expect(originQuery.textContent).toContain('What is the price of HRC steel');
    });

    it('shows conversation link when conversationId present', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('origin-conversation')).toBeInTheDocument();
    });

    it('hides query block for manual interests', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_MINIMAL} />);
      expect(screen.queryByTestId('origin-query')).not.toBeInTheDocument();
    });

    it('hides query block for chat-inferred without searchContext', () => {
      const chatNoContext: Interest = {
        ...MOCK_INTEREST,
        searchContext: undefined,
      };
      render(<InterestDetailDrawer {...defaultProps} interest={chatNoContext} />);
      expect(screen.queryByTestId('origin-query')).not.toBeInTheDocument();
    });

    it('shows Manual source for manual interests', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_MINIMAL} />);
      expect(screen.getByTestId('origin-source')).toHaveTextContent('Manual');
    });
  });

  // ============================================
  // WHAT WE TRACK — READ-ONLY
  // ============================================
  describe('What We Track (read-only)', () => {
    it('shows fields in read-only mode by default', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('read-only-fields')).toBeInTheDocument();
      expect(screen.getByTestId('field-text')).toHaveTextContent('Steel');
      expect(screen.getByTestId('field-region')).toHaveTextContent('Europe');
      expect(screen.getByTestId('field-grade')).toHaveTextContent('HRC');
    });

    it('shows dash for missing region/grade', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_MINIMAL} />);
      expect(screen.getByTestId('field-region')).toHaveTextContent('—');
      expect(screen.getByTestId('field-grade')).toHaveTextContent('—');
    });

    it('shows coverage explanation', () => {
      const withGap: Interest = {
        ...MOCK_INTEREST,
        coverage: { level: 'partial', gapReason: 'Grade-level data not available' },
      };
      render(<InterestDetailDrawer {...defaultProps} interest={withGap} />);
      expect(screen.getByTestId('gap-reason')).toHaveTextContent('Grade-level data not available');
    });

    it('shows edit button', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    });
  });

  // ============================================
  // WHAT WE TRACK — EDIT MODE
  // ============================================
  describe('What We Track (edit mode)', () => {
    it('edit button opens edit form', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-button'));
      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
      expect(screen.queryByTestId('read-only-fields')).not.toBeInTheDocument();
    });

    it('edit form prefills with current values', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-button'));
      expect((screen.getByTestId('edit-text-input') as HTMLInputElement).value).toBe('Steel');
      expect((screen.getByTestId('edit-region-input') as HTMLInputElement).value).toBe('Europe');
      expect((screen.getByTestId('edit-grade-input') as HTMLInputElement).value).toBe('HRC');
    });

    it('cancel returns to read-only', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.click(screen.getByTestId('cancel-edit-button'));
      expect(screen.getByTestId('read-only-fields')).toBeInTheDocument();
      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
    });

    it('save calls onUpdate with edited values', async () => {
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      render(<InterestDetailDrawer {...defaultProps} onUpdate={onUpdate} />);

      fireEvent.click(screen.getByTestId('edit-button'));
      fireEvent.change(screen.getByTestId('edit-region-input'), { target: { value: 'Asia' } });
      fireEvent.click(screen.getByTestId('save-edit-button'));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith('test_1', {
          text: 'Steel',
          region: 'Asia',
          grade: 'HRC',
        });
      });
    });
  });

  // ============================================
  // HOW ABI USES THIS
  // ============================================
  describe('How Abi Uses This', () => {
    it('shows usage section', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('usage-section')).toBeInTheDocument();
    });

    it('shows generic usage items when no matchedCategory', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('generic-usage')).toBeInTheDocument();
      expect(screen.getByText('Prioritizes this topic in search results')).toBeInTheDocument();
    });

    it('shows region-specific item when region set (generic)', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByText('Considers region-specific data when available')).toBeInTheDocument();
    });

    it('shows grade-specific item when grade set (generic)', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByText('Filters by grade/specification when possible')).toBeInTheDocument();
    });

    it('hides region/grade items when not set', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_MINIMAL} />);
      expect(screen.queryByText('Considers region-specific data when available')).not.toBeInTheDocument();
      expect(screen.queryByText('Filters by grade/specification when possible')).not.toBeInTheDocument();
    });

    it('shows matched capabilities when matchedCategory exists', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.getByTestId('matched-capabilities')).toBeInTheDocument();
      expect(screen.queryByTestId('generic-usage')).not.toBeInTheDocument();
    });

    it('displays matched category name and domain', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.getByText(/Steel \(Hot Rolled Coil\)/)).toBeInTheDocument();
      expect(screen.getByText(/Metals/)).toBeInTheDocument();
    });

    it('displays analyst name', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
    });

    it('displays update frequency', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.getByText('Weekly updates')).toBeInTheDocument();
    });

    it('shows capability items based on matchedCategory flags', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.getByText('Market reports available')).toBeInTheDocument();
      expect(screen.getByText('Price index tracking')).toBeInTheDocument();
      expect(screen.getByText('Supplier intelligence')).toBeInTheDocument();
      expect(screen.getByText('News & alerts')).toBeInTheDocument();
      // hasCostModel is false for this mock
      expect(screen.queryByText('Cost modeling')).not.toBeInTheDocument();
    });

    it('shows activation hint for non-activated categories', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_AVAILABLE} />);
      expect(screen.getByTestId('activation-hint')).toBeInTheDocument();
      expect(screen.getByText('This category can be activated for decision-grade coverage')).toBeInTheDocument();
    });

    it('hides activation hint for activated categories', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_WITH_CAPABILITIES} />);
      expect(screen.queryByTestId('activation-hint')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // AVAILABLE BADGE
  // ============================================
  describe('Available badge', () => {
    it('shows Available badge in header for available-level coverage', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_AVAILABLE} />);
      expect(screen.getByTestId('drawer-coverage-badge')).toHaveTextContent('Available');
    });

    it('uses blue styling for available badge', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_AVAILABLE} />);
      const badge = screen.getByTestId('drawer-coverage-badge');
      expect(badge.className).toContain('bg-blue-50');
      expect(badge.className).toContain('text-blue-700');
    });
  });

  // ============================================
  // ACTIVITY
  // ============================================
  describe('Activity', () => {
    it('shows search context in activity section', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('activity-query')).toBeInTheDocument();
    });

    it('shows conversation reference', () => {
      render(<InterestDetailDrawer {...defaultProps} />);
      expect(screen.getByTestId('activity-conversation')).toBeInTheDocument();
    });

    it('shows empty state when no activity', () => {
      render(<InterestDetailDrawer {...defaultProps} interest={MOCK_MINIMAL} />);
      expect(screen.getByTestId('activity-empty')).toBeInTheDocument();
      expect(screen.getByText(/No conversation activity yet/)).toBeInTheDocument();
    });
  });

  // ============================================
  // CLOSE / DELETE
  // ============================================
  describe('Close & Delete', () => {
    it('close button calls onClose', () => {
      const onClose = vi.fn();
      render(<InterestDetailDrawer {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('drawer-close-button'));
      expect(onClose).toHaveBeenCalled();
    });

    it('backdrop click calls onClose', () => {
      const onClose = vi.fn();
      render(<InterestDetailDrawer {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('drawer-backdrop'));
      expect(onClose).toHaveBeenCalled();
    });

    it('delete button calls onDelete', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(<InterestDetailDrawer {...defaultProps} onDelete={onDelete} />);
      fireEvent.click(screen.getByTestId('delete-interest-button'));
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('test_1');
      });
    });
  });
});
