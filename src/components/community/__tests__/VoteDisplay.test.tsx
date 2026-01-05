import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoteDisplay } from '../VoteDisplay';

describe('VoteDisplay', () => {
  it('displays positive score without prefix', () => {
    render(<VoteDisplay score={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays negative score', () => {
    render(<VoteDisplay score={-5} />);
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('displays zero score', () => {
    render(<VoteDisplay score={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies strong styling for positive scores', () => {
    const { container } = render(<VoteDisplay score={10} />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-slate-900');
    expect(element).toHaveClass('font-medium');
  });

  it('applies muted styling for negative scores', () => {
    const { container } = render(<VoteDisplay score={-3} />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-slate-400');
    expect(element).toHaveClass('font-normal');
  });

  it('applies muted styling for zero score', () => {
    const { container } = render(<VoteDisplay score={0} />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-slate-400');
  });

  it('applies small text size when size="sm"', () => {
    const { container } = render(<VoteDisplay score={5} size="sm" />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-sm');
  });

  it('applies medium text size when size="md"', () => {
    const { container } = render(<VoteDisplay score={5} size="md" />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-base');
  });

  it('applies large text size when size="lg"', () => {
    const { container } = render(<VoteDisplay score={5} size="lg" />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-lg');
  });

  it('defaults to medium size', () => {
    const { container } = render(<VoteDisplay score={5} />);
    const element = container.firstChild;
    expect(element).toHaveClass('text-base');
  });

  it('handles large positive numbers', () => {
    render(<VoteDisplay score={1000} />);
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('handles large negative numbers', () => {
    render(<VoteDisplay score={-999} />);
    expect(screen.getByText('-999')).toBeInTheDocument();
  });
});
