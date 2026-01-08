// Thread Similarity Service
// Uses existing community search API to find similar discussions

import { apiFetch } from './api';
import type { Question } from '../types/community';

/**
 * A similar thread found in the community
 */
export interface SimilarThread {
  id: string;
  title: string;
  replyCount: number;
  lastActivity: string;
  relevanceScore: number;
  category?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  snippet?: string;
}

/**
 * Search options for finding similar threads
 */
export interface SimilaritySearchOptions {
  limit?: number;
  minScore?: number;
  categories?: string[];
  excludeIds?: string[];
}

/**
 * Format relative time from ISO string
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Calculate simple relevance score based on search term matching
 * This is a client-side approximation since the API returns ILIKE matches
 */
function calculateRelevance(query: string, title: string, body: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();

  let score = 0;
  let totalWeight = queryWords.length;

  for (const word of queryWords) {
    // Title matches are worth more
    if (titleLower.includes(word)) {
      score += 1.5;
    } else if (bodyLower.includes(word)) {
      score += 0.5;
    }
  }

  return totalWeight > 0 ? Math.min(1, score / totalWeight) : 0;
}

/**
 * Convert Question to SimilarThread format
 */
function questionToSimilarThread(question: Question, query: string): SimilarThread {
  const relevance = calculateRelevance(query, question.title, question.body);
  const primaryTag = question.tags?.[0];

  return {
    id: question.id,
    title: question.title,
    replyCount: question.answerCount,
    lastActivity: formatRelativeTime(question.updatedAt),
    relevanceScore: relevance,
    category: primaryTag?.name,
    author: question.author ? {
      name: question.author.displayName || 'Anonymous',
      avatar: question.author.avatarUrl,
    } : undefined,
    snippet: question.body.length > 100
      ? question.body.substring(0, 100) + '...'
      : question.body,
  };
}

/**
 * Find threads similar to the given query using community search API
 * @param query - The question title/text to find similar threads for
 * @param options - Search options
 * @returns Array of similar threads sorted by relevance
 */
export async function findSimilarThreads(
  query: string,
  options: SimilaritySearchOptions = {}
): Promise<SimilarThread[]> {
  const {
    limit = 5,
    minScore = 0.3,
    excludeIds = [],
  } = options;

  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    // Use existing community search API
    const params = new URLSearchParams({
      search: query.trim(),
      pageSize: '10', // Fetch more than limit to allow filtering
      sortBy: 'votes', // Most relevant first
    });

    const data = await apiFetch<{
      questions: Question[];
      totalCount: number;
    }>(`/api/community/questions?${params}`);

    // Convert to SimilarThread format and filter
    const threads = data.questions
      .filter(q => !excludeIds.includes(q.id))
      .map(q => questionToSimilarThread(q, query))
      .filter(t => t.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return threads;
  } catch (error) {
    console.error('[threadSimilarity] Error fetching similar threads:', error);
    // Return empty array on error - don't block the form
    return [];
  }
}

/**
 * Check if a query has high-confidence similar threads
 * Useful for determining if we should prompt the user
 */
export async function hasSimilarThreads(query: string, threshold = 0.5): Promise<boolean> {
  const threads = await findSimilarThreads(query, { limit: 1, minScore: threshold });
  return threads.length > 0;
}

/**
 * Get thread by ID (for viewing details)
 */
export async function getThreadById(id: string): Promise<SimilarThread | null> {
  try {
    const question = await apiFetch<Question>(`/api/community/questions/${id}`);
    return questionToSimilarThread(question, '');
  } catch (error) {
    console.error('[threadSimilarity] Error fetching thread:', error);
    return null;
  }
}

export default {
  findSimilarThreads,
  hasSimilarThreads,
  getThreadById,
};
