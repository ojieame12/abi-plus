// Tests for TagSelector component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagSelector } from '../TagSelector';
import { createDefaultTags, resetTestCounters } from '../../../test/community-utils';

describe('TagSelector', () => {
  const mockTags = createDefaultTags();

  const defaultProps = {
    availableTags: mockTags,
    selectedTagIds: [] as string[],
    onChange: vi.fn(),
    maxTags: 5,
    isLoading: false,
  };

  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders search input when can add more tags', () => {
      render(<TagSelector {...defaultProps} />);

      expect(screen.getByPlaceholderText(/add tags/i)).toBeInTheDocument();
    });

    it('shows selected tags', () => {
      render(<TagSelector {...defaultProps} selectedTagIds={[mockTags[0].id]} />);

      expect(screen.getByText(mockTags[0].name)).toBeInTheDocument();
    });

    it('shows remove button on selected tags', () => {
      render(<TagSelector {...defaultProps} selectedTagIds={[mockTags[0].id]} />);

      // X button should be present
      const removeButton = screen.getByRole('button', { name: '' }); // X icon has no text
      expect(removeButton).toBeInTheDocument();
    });

    it('shows placeholder with current count', () => {
      render(<TagSelector {...defaultProps} selectedTagIds={[mockTags[0].id, mockTags[1].id]} />);

      expect(screen.getByPlaceholderText('Add tags (2/5)...')).toBeInTheDocument();
    });
  });

  describe('tag search', () => {
    it('shows dropdown on input focus', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.click(input);

      // Should show available tags
      await waitFor(() => {
        expect(screen.getByText(mockTags[0].name)).toBeInTheDocument();
      });
    });

    it('filters tags based on search query', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.type(input, 'supplier');

      await waitFor(() => {
        // Should show matching tags
        expect(screen.getByText('supplier-risk')).toBeInTheDocument();
      });
    });

    it('shows "no matching tags" when search has no results', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.type(input, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No matching tags found')).toBeInTheDocument();
      });
    });

    it('excludes already selected tags from dropdown', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} selectedTagIds={[mockTags[0].id]} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.click(input);

      // The selected tag should not appear in dropdown
      const dropdownItems = screen.getAllByRole('button');
      const tagNames = dropdownItems.map(item => item.textContent);
      // The selected tag name should only appear once (in the selected area, not dropdown)
      expect(tagNames.filter(n => n?.includes(mockTags[0].name)).length).toBeLessThanOrEqual(1);
    });
  });

  describe('adding tags', () => {
    it('calls onChange when tag is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.click(input);

      // Wait for dropdown to appear and click on a tag
      await waitFor(async () => {
        const tagButton = screen.getByRole('button', { name: new RegExp(mockTags[0].name) });
        await user.click(tagButton);
      });

      expect(onChange).toHaveBeenCalledWith([mockTags[0].id]);
    });

    it('clears search query after adding tag', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.type(input, 'supplier');

      await waitFor(async () => {
        const tagButton = screen.getByRole('button', { name: /supplier-risk/ });
        await user.click(tagButton);
      });

      expect(input).toHaveValue('');
    });
  });

  describe('removing tags', () => {
    it('calls onChange without removed tag', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} onChange={onChange} selectedTagIds={[mockTags[0].id, mockTags[1].id]} />);

      // Find the remove button for the first tag
      const selectedTags = screen.getAllByText(mockTags[0].name);
      const tagContainer = selectedTags[0].closest('span');
      const removeButton = tagContainer?.querySelector('button');

      if (removeButton) {
        await user.click(removeButton);
      }

      expect(onChange).toHaveBeenCalledWith([mockTags[1].id]);
    });
  });

  describe('max tags limit', () => {
    it('hides input when max tags reached', () => {
      render(<TagSelector {...defaultProps} selectedTagIds={mockTags.slice(0, 5).map(t => t.id)} maxTags={5} />);

      expect(screen.queryByPlaceholderText(/add tags/i)).not.toBeInTheDocument();
    });

    it('shows limit message when max reached', () => {
      render(<TagSelector {...defaultProps} selectedTagIds={mockTags.slice(0, 5).map(t => t.id)} maxTags={5} />);

      expect(screen.getByText('Maximum 5 tags allowed')).toBeInTheDocument();
    });

    it('does not add tag when at max limit', async () => {
      const onChange = vi.fn();
      render(<TagSelector {...defaultProps} onChange={onChange} selectedTagIds={mockTags.slice(0, 5).map(t => t.id)} maxTags={5} />);

      // Input should not be visible at max limit
      expect(screen.queryByPlaceholderText(/add tags/i)).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables input when loading', () => {
      render(<TagSelector {...defaultProps} isLoading={true} />);

      expect(screen.getByPlaceholderText(/add tags/i)).toBeDisabled();
    });
  });

  describe('question count display', () => {
    it('shows question count for each tag in dropdown', async () => {
      const user = userEvent.setup();
      render(<TagSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText(/add tags/i);
      await user.click(input);

      await waitFor(() => {
        // Each dropdown item shows "X questions" text
        expect(screen.getAllByText(/questions/).length).toBeGreaterThan(0);
      });
    });
  });
});
