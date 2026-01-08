// Thread Similarity Service
// Finds similar community discussions to reduce duplicate questions

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
 * Mock thread data for development
 * In production, this would come from the community API
 */
const MOCK_THREADS: SimilarThread[] = [
  {
    id: 'thread-1',
    title: 'Aluminum pricing volatility in APAC region - what to expect?',
    replyCount: 12,
    lastActivity: '2 days ago',
    relevanceScore: 0.92,
    category: 'Raw Materials',
    author: { name: 'Sarah Chen', avatar: undefined },
    snippet: 'Looking for insights on aluminum price trends in the Asia-Pacific market...',
  },
  {
    id: 'thread-2',
    title: 'LME vs regional pricing differences for aluminum',
    replyCount: 8,
    lastActivity: '1 week ago',
    relevanceScore: 0.85,
    category: 'Raw Materials',
    author: { name: 'Michael Torres' },
    snippet: 'Has anyone analyzed the premium differences between LME and regional aluminum pricing?',
  },
  {
    id: 'thread-3',
    title: 'Q1 2026 cost drivers for packaging materials',
    replyCount: 5,
    lastActivity: '3 days ago',
    relevanceScore: 0.78,
    category: 'Packaging',
    author: { name: 'Emma Wilson' },
    snippet: 'What are the main factors affecting packaging material costs this quarter?',
  },
  {
    id: 'thread-4',
    title: 'Supplier risk assessment best practices',
    replyCount: 23,
    lastActivity: '1 day ago',
    relevanceScore: 0.75,
    category: 'Risk Management',
    author: { name: 'David Kim' },
    snippet: 'Sharing our framework for evaluating supplier risk across multiple dimensions...',
  },
  {
    id: 'thread-5',
    title: 'Negotiation strategies for commodity price increases',
    replyCount: 15,
    lastActivity: '4 days ago',
    relevanceScore: 0.72,
    category: 'Procurement Strategy',
    author: { name: 'Lisa Park' },
    snippet: 'When suppliers request price increases, what approaches have worked for you?',
  },
  {
    id: 'thread-6',
    title: 'China aluminum export policy changes - impact analysis',
    replyCount: 19,
    lastActivity: '5 days ago',
    relevanceScore: 0.88,
    category: 'Raw Materials',
    author: { name: 'James Liu' },
    snippet: 'Recent policy shifts in China are affecting aluminum exports. Discussing implications...',
  },
  {
    id: 'thread-7',
    title: 'Managing concentration risk in supplier portfolios',
    replyCount: 11,
    lastActivity: '1 week ago',
    relevanceScore: 0.70,
    category: 'Risk Management',
    author: { name: 'Rachel Green' },
    snippet: 'How do you balance supplier concentration with relationship benefits?',
  },
  {
    id: 'thread-8',
    title: 'Plastic resin price forecast for H2 2026',
    replyCount: 7,
    lastActivity: '6 days ago',
    relevanceScore: 0.65,
    category: 'Raw Materials',
    author: { name: 'Tom Anderson' },
    snippet: 'Looking at factors that will influence plastic resin prices in the second half...',
  },
];

/**
 * Keywords and their related terms for matching
 */
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  aluminum: ['aluminium', 'lme', 'bauxite', 'metal', 'alloy'],
  pricing: ['price', 'cost', 'rate', 'premium', 'discount'],
  supplier: ['vendor', 'source', 'provider', 'manufacturer'],
  risk: ['assessment', 'evaluation', 'exposure', 'vulnerability'],
  packaging: ['container', 'box', 'wrap', 'pallet'],
  negotiation: ['negotiate', 'deal', 'contract', 'agreement'],
  china: ['chinese', 'apac', 'asia', 'asian'],
  inflation: ['increase', 'rising', 'cost increase', 'price hike'],
};

/**
 * Calculate similarity score between query and thread title
 * Uses keyword matching and related terms
 */
function calculateSimilarity(query: string, threadTitle: string): number {
  const normalizedQuery = query.toLowerCase();
  const normalizedTitle = threadTitle.toLowerCase();

  // Direct word overlap
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);

  let matchScore = 0;
  let totalWeight = 0;

  for (const queryWord of queryWords) {
    const weight = queryWord.length > 5 ? 2 : 1; // Longer words are more significant
    totalWeight += weight;

    // Direct match
    if (titleWords.some(tw => tw.includes(queryWord) || queryWord.includes(tw))) {
      matchScore += weight;
      continue;
    }

    // Check keyword mappings for related terms
    for (const [key, synonyms] of Object.entries(KEYWORD_MAPPINGS)) {
      if (queryWord.includes(key) || synonyms.some(s => queryWord.includes(s))) {
        if (normalizedTitle.includes(key) || synonyms.some(s => normalizedTitle.includes(s))) {
          matchScore += weight * 0.8; // Slightly lower score for synonym match
          break;
        }
      }
    }
  }

  return totalWeight > 0 ? matchScore / totalWeight : 0;
}

/**
 * Find threads similar to the given query
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
    categories,
    excludeIds = [],
  } = options;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!query || query.trim().length < 3) {
    return [];
  }

  // Calculate similarity scores for each thread
  const scoredThreads = MOCK_THREADS
    .filter(thread => !excludeIds.includes(thread.id))
    .filter(thread => !categories || categories.length === 0 || categories.includes(thread.category || ''))
    .map(thread => ({
      ...thread,
      relevanceScore: calculateSimilarity(query, thread.title),
    }))
    .filter(thread => thread.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scoredThreads;
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return MOCK_THREADS.find(thread => thread.id === id) || null;
}

export default {
  findSimilarThreads,
  hasSimilarThreads,
  getThreadById,
};
