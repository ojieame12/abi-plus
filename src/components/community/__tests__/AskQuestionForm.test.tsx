// Tests for AskQuestionForm component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AskQuestionForm } from '../AskQuestionForm';
import { createDefaultTags, resetTestCounters } from '../../../test/community-utils';

describe('AskQuestionForm', () => {
  const defaultProps = {
    availableTags: createDefaultTags(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    isTagsLoading: false,
  };

  beforeEach(() => {
    resetTestCounters();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title, body, and tag inputs', () => {
      render(<AskQuestionForm {...defaultProps} />);

      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Details')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<AskQuestionForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /post question/i })).toBeInTheDocument();
    });

    it('shows character counters', () => {
      render(<AskQuestionForm {...defaultProps} />);

      expect(screen.getByText('0/15 min')).toBeInTheDocument();
      expect(screen.getByText('0/30 min')).toBeInTheDocument();
    });
  });

  describe('title validation', () => {
    it('disables submit when title is too short', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'Short');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton).toBeDisabled();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} />);

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'Testing');

      expect(screen.getByText('7/15 min')).toBeInTheDocument();
    });
  });

  describe('body validation', () => {
    it('disables submit when body is too short', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} />);

      // Fill valid title first
      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'This is a valid title');

      // Short body
      const bodyInput = screen.getByLabelText('Details');
      await user.type(bodyInput, 'Short body');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton).toBeDisabled();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} />);

      const bodyInput = screen.getByLabelText('Details');
      await user.type(bodyInput, 'Hello world');

      expect(screen.getByText('11/30 min')).toBeInTheDocument();
    });
  });

  describe('submit button state', () => {
    it('is disabled when form is invalid', () => {
      render(<AskQuestionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton).toBeDisabled();
    });

    it('is enabled when form is valid', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} />);

      await user.type(screen.getByLabelText('Title'), 'This is a valid title here');
      await user.type(screen.getByLabelText('Details'), 'This is a valid body with more than 30 characters for testing purposes.');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('is disabled when loading', async () => {
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} isLoading={true} />);

      await user.type(screen.getByLabelText('Title'), 'This is a valid title here');
      await user.type(screen.getByLabelText('Details'), 'This is a valid body with more than 30 characters for testing purposes.');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form data', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Title'), 'This is a valid title here');
      await user.type(screen.getByLabelText('Details'), 'This is a valid body with more than 30 characters for testing purposes.');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'This is a valid title here',
          body: 'This is a valid body with more than 30 characters for testing purposes.',
          tagIds: [],
        });
      });
    });

    it('trims whitespace from inputs', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Title'), '  Title with spaces  ');
      await user.type(screen.getByLabelText('Details'), '  Body with spaces that is long enough for validation.  ');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'Title with spaces',
          body: 'Body with spaces that is long enough for validation.',
          tagIds: [],
        });
      });
    });

    it('does not submit when validation fails', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<AskQuestionForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Title'), 'Short');

      const submitButton = screen.getByRole('button', { name: /post question/i });
      await user.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner during submission', () => {
      render(<AskQuestionForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /post question/i })).toBeInTheDocument();
      // Loader2 would be rendered - just check button is in loading state
      const submitButton = screen.getByRole('button', { name: /post question/i });
      expect(submitButton.className).toContain('opacity-70');
    });

    it('disables inputs during loading', () => {
      render(<AskQuestionForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText('Title')).toBeDisabled();
      expect(screen.getByLabelText('Details')).toBeDisabled();
    });
  });

  describe('tag selection', () => {
    it('shows tag limit message', () => {
      render(<AskQuestionForm {...defaultProps} />);

      expect(screen.getByText(/add up to 5 tags/i)).toBeInTheDocument();
    });
  });
});
