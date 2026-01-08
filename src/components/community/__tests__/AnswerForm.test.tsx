// Tests for AnswerForm component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerForm } from '../AnswerForm';

describe('AnswerForm', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders body textarea', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /post answer/i })).toBeInTheDocument();
    });

    it('shows character counter', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByText('0/30 min')).toBeInTheDocument();
    });

    it('shows default placeholder', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Write your answer...')).toBeInTheDocument();
    });

    it('accepts custom placeholder', () => {
      render(<AnswerForm {...defaultProps} placeholder="Custom placeholder text" />);

      expect(screen.getByPlaceholderText('Custom placeholder text')).toBeInTheDocument();
    });
  });

  describe('body validation', () => {
    it('disables submit button when body is too short', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} />);

      await user.type(screen.getByRole('textbox'), 'Short');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton).toBeDisabled();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} />);

      await user.type(screen.getByRole('textbox'), 'Hello world');

      expect(screen.getByText('11/30 min')).toBeInTheDocument();
    });

    it('shows success color when minimum reached', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} />);

      await user.type(screen.getByRole('textbox'), 'This is a long enough answer body for testing.');

      // The character count should have the success styling
      expect(screen.getByText(/\/30 min/)).toHaveClass('text-slate-500');
    });
  });

  describe('submit button state', () => {
    it('is disabled when body is empty', () => {
      render(<AnswerForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton).toBeDisabled();
    });

    it('is disabled when body is too short', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} />);

      await user.type(screen.getByRole('textbox'), 'Short body');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton).toBeDisabled();
    });

    it('is enabled when body is valid', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} />);

      await user.type(screen.getByRole('textbox'), 'This is a valid answer body with more than 30 characters.');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('is disabled when loading', async () => {
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} isLoading={true} />);

      await user.type(screen.getByRole('textbox'), 'This is a valid answer body with more than 30 characters.');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with body', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByRole('textbox'), 'This is a valid answer body with more than 30 characters.');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('This is a valid answer body with more than 30 characters.');
      });
    });

    it('trims whitespace from body', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByRole('textbox'), '  Body with spaces that is long enough for testing.  ');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Body with spaces that is long enough for testing.');
      });
    });

    it('clears form after successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is a valid answer body with more than 30 characters.');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('does not submit when validation fails', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<AnswerForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByRole('textbox'), 'Short');

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      await user.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner during submission', () => {
      render(<AnswerForm {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /post answer/i });
      expect(submitButton.className).toContain('opacity-70');
    });

    it('disables textarea during loading', () => {
      render(<AnswerForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('helper text', () => {
    it('shows markdown supported hint by default', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByText('Markdown supported')).toBeInTheDocument();
    });

    it('shows markdown hint alongside character counter', () => {
      render(<AnswerForm {...defaultProps} />);

      expect(screen.getByText('Markdown supported')).toBeInTheDocument();
      expect(screen.getByText('0/30 min')).toBeInTheDocument();
    });
  });
});
