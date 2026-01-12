// Community Q&A Mock Data

import type { Tag, UserProfile, Question, Answer, QuestionWithAnswers } from '../types/community';

// Mock Tags
export const MOCK_TAGS: Tag[] = [
  {
    id: 'tag_1',
    name: 'Supplier Risk',
    slug: 'supplier-risk',
    description: 'Questions about supplier risk assessment and mitigation',
    color: '#ef4444',
    questionCount: 24,
  },
  {
    id: 'tag_2',
    name: 'Procurement',
    slug: 'procurement',
    description: 'General procurement strategy and processes',
    color: '#6366f1',
    questionCount: 18,
  },
  {
    id: 'tag_3',
    name: 'Due Diligence',
    slug: 'due-diligence',
    description: 'Vendor vetting and due diligence procedures',
    color: '#f59e0b',
    questionCount: 12,
  },
  {
    id: 'tag_4',
    name: 'Compliance',
    slug: 'compliance',
    description: 'Regulatory compliance and auditing',
    color: '#10b981',
    questionCount: 15,
  },
  {
    id: 'tag_5',
    name: 'ESG',
    slug: 'esg',
    description: 'Environmental, Social, and Governance factors',
    color: '#06b6d4',
    questionCount: 9,
  },
  {
    id: 'tag_6',
    name: 'Contracts',
    slug: 'contracts',
    description: 'Contract negotiation and management',
    color: '#8b5cf6',
    questionCount: 11,
  },
  {
    id: 'tag_7',
    name: 'Cost Savings',
    slug: 'cost-savings',
    description: 'Cost optimization and savings strategies',
    color: '#22c55e',
    questionCount: 14,
  },
  {
    id: 'tag_8',
    name: 'Supplier Diversity',
    slug: 'supplier-diversity',
    description: 'Diverse supplier programs and initiatives',
    color: '#ec4899',
    questionCount: 7,
  },
];

// Mock User Profiles
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user_1',
    visitorId: 'v_001',
    displayName: 'Sarah Chen',
    title: 'Senior Procurement Manager',
    company: 'GlobalTech Inc',
    reputation: 1247,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_2',
    visitorId: 'v_002',
    displayName: 'Michael Torres',
    title: 'Risk Analyst',
    company: 'SupplyChain Pro',
    reputation: 892,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_3',
    visitorId: 'v_003',
    displayName: 'Emily Watson',
    title: 'VP of Procurement',
    company: 'Acme Manufacturing',
    reputation: 2103,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_4',
    visitorId: 'v_004',
    displayName: 'James Kim',
    title: 'Sourcing Specialist',
    company: 'TechStart Solutions',
    reputation: 456,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_5',
    visitorId: 'v_005',
    displayName: 'Amanda Rodriguez',
    title: 'Compliance Officer',
    company: 'FinServe Global',
    reputation: 1534,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_6',
    visitorId: 'v_006',
    displayName: 'David Park',
    title: 'Category Manager',
    company: 'RetailMax',
    reputation: 678,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
];

// Helper to generate relative dates
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

// Mock Questions
export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q_001',
    author: MOCK_USERS[0],
    visitorId: 'v_001',
    title: 'How do you assess financial risk for suppliers in emerging markets?',
    body: `We have several suppliers in Southeast Asia and want to understand best practices for evaluating their financial stability without direct access to their books.

What signals do you look for? We've tried:
- Requesting audited financials (rarely provided)
- D&B reports (limited coverage in some regions)
- Payment history from other customers

Looking for additional approaches that have worked for others.`,
    upvotes: 24,
    downvotes: 2,
    score: 22,
    viewCount: 342,
    answerCount: 3,
    hasAcceptedAnswer: true,
    acceptedAnswerId: 'a_001',
    status: 'answered',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: 'q_002',
    author: MOCK_USERS[3],
    visitorId: 'v_004',
    title: 'Best practices for single-source supplier risk mitigation?',
    body: `We have a critical component that's only available from one supplier. They're reliable but the concentration risk keeps me up at night.

What strategies have worked for others in similar situations? We're considering:
- Building safety stock
- Qualifying alternative materials
- Long-term contracts with penalties

Any other approaches worth exploring?`,
    upvotes: 18,
    downvotes: 1,
    score: 17,
    viewCount: 256,
    answerCount: 5,
    hasAcceptedAnswer: true,
    acceptedAnswerId: 'a_004',
    status: 'answered',
    tags: [MOCK_TAGS[0], MOCK_TAGS[5]],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: 'q_003',
    author: MOCK_USERS[4],
    visitorId: 'v_005',
    title: 'ESG scoring frameworks - which ones are actually useful?',
    body: `Our board is pushing for more rigorous ESG evaluation of suppliers. There are dozens of frameworks and rating agencies out there.

Which ESG scoring systems have you found most practical for procurement decisions? Looking for:
- Actionable metrics (not just PR scores)
- Reasonable cost
- Good coverage of manufacturing suppliers

We're in consumer electronics if that matters.`,
    upvotes: 31,
    downvotes: 3,
    score: 28,
    viewCount: 489,
    answerCount: 4,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[4], MOCK_TAGS[3]],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'q_004',
    author: MOCK_USERS[5],
    visitorId: 'v_006',
    title: 'How to handle supplier price increases mid-contract?',
    body: `One of our key suppliers just notified us of a 15% price increase citing "raw material costs" - but we have a fixed-price contract with 6 months remaining.

They're threatening to halt shipments if we don't agree. Contract has standard force majeure language but nothing specific about commodity price fluctuations.

How have others handled this? We need this supplier but don't want to set a precedent.`,
    upvotes: 45,
    downvotes: 2,
    score: 43,
    viewCount: 612,
    answerCount: 7,
    hasAcceptedAnswer: true,
    acceptedAnswerId: 'a_010',
    status: 'answered',
    tags: [MOCK_TAGS[5], MOCK_TAGS[6]],
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(4),
  },
  {
    id: 'q_005',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    title: 'Recommended KPIs for supplier performance tracking?',
    body: `Building out a supplier scorecard system and want to make sure we're tracking the right metrics.

Current list:
- On-time delivery %
- Quality rejection rate
- Response time to inquiries
- Invoice accuracy

What other KPIs have been valuable for your organization? Especially interested in leading indicators vs lagging ones.`,
    upvotes: 12,
    downvotes: 0,
    score: 12,
    viewCount: 178,
    answerCount: 2,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[1], MOCK_TAGS[0]],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: 'q_006',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    title: 'Building a supplier diversity program from scratch - where to start?',
    body: `Our company has committed to 15% diverse supplier spend by 2026, but we're starting from basically zero infrastructure.

Looking for advice on:
- How to identify and certify diverse suppliers
- Which certifications matter most (WBENC, NMSDC, etc.)
- How to integrate diversity goals into sourcing decisions without compromising on quality/cost

Anyone been through this journey recently?`,
    aiContextSummary: 'User was researching supplier diversity metrics and certification requirements in a previous conversation.',
    upvotes: 19,
    downvotes: 1,
    score: 18,
    viewCount: 234,
    answerCount: 3,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[7], MOCK_TAGS[1]],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: 'q_007',
    author: MOCK_USERS[0],
    visitorId: 'v_001',
    title: 'Cyber security requirements for suppliers - what\'s reasonable?',
    body: `We're updating our supplier qualification requirements to include cybersecurity standards. IT is pushing for SOC 2 Type II for everyone, but that seems excessive for smaller suppliers.

What cybersecurity requirements do you include in your supplier assessments? How do you tier requirements based on data access/criticality?`,
    upvotes: 8,
    downvotes: 0,
    score: 8,
    viewCount: 145,
    answerCount: 0,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[0], MOCK_TAGS[3]],
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'q_008',
    author: MOCK_USERS[4],
    visitorId: 'v_005',
    title: 'Red flags during supplier site visits - what to look for?',
    body: `I'm conducting my first solo supplier audit next month at a manufacturing facility in Mexico. I've done classroom training but want real-world advice.

What are the subtle red flags experienced auditors look for that might not be in the standard checklist? Especially interested in quality and labor practices indicators.`,
    upvotes: 27,
    downvotes: 0,
    score: 27,
    viewCount: 389,
    answerCount: 6,
    hasAcceptedAnswer: true,
    acceptedAnswerId: 'a_015',
    status: 'answered',
    tags: [MOCK_TAGS[2], MOCK_TAGS[3]],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
  },
];

// Mock Answers
export const MOCK_ANSWERS: Answer[] = [
  // Answers for q_001
  {
    id: 'a_001',
    questionId: 'q_001',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    body: `Great question - emerging markets definitely require a different playbook. Here's what's worked for us:

**Alternative Data Sources:**
- Local credit bureaus (many countries have them, just need local contacts)
- Chamber of Commerce records
- Import/export data from customs databases
- Social media presence and employee LinkedIn profiles (tells you about stability)

**Operational Indicators:**
- Site visits are invaluable - you can learn a lot about financial health from facility condition
- Payment terms they offer (desperate suppliers offer longer terms)
- How quickly they respond to quotes (slow = capacity issues or cash problems)

**Relationship Building:**
- Building relationships with their other customers (discreetly)
- Local banking references
- Industry association memberships

The key is triangulating multiple weak signals rather than relying on one strong signal like you would in developed markets.`,
    upvotes: 18,
    downvotes: 0,
    score: 18,
    isAccepted: true,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'a_002',
    questionId: 'q_001',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    body: `Adding to Michael's excellent points - we've had success with trade credit insurance providers. Companies like Euler Hermes and Coface have surprisingly good data on suppliers in emerging markets because they're the ones taking the risk.

Even if you don't buy insurance, their underwriting teams will often share risk assessments as part of the quoting process.`,
    upvotes: 9,
    downvotes: 1,
    score: 8,
    isAccepted: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'a_003',
    questionId: 'q_001',
    author: MOCK_USERS[5],
    visitorId: 'v_006',
    body: `One thing that's worked for us: requiring quarterly business reviews with financial metrics built in. We frame it as "partnership transparency" rather than auditing, and suppliers are more willing to share.

Also, watching for changes in their payment behavior to YOUR company - if they start taking discounts they previously ignored, could be a cash flow signal.`,
    upvotes: 5,
    downvotes: 0,
    score: 5,
    isAccepted: false,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },

  // Answers for q_002
  {
    id: 'a_004',
    questionId: 'q_002',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    body: `Been there! Here's our multi-layered approach for critical single-source situations:

**Short-term (0-6 months):**
- Safety stock (we target 8-12 weeks for critical items)
- Detailed supply disruption playbook
- Executive relationship at the supplier

**Medium-term (6-18 months):**
- Dual-tooling agreements (supplier owns tooling at two facilities)
- Qualify alternative materials that could work in emergency
- Map their tier-2 suppliers and assess THEIR risks

**Long-term (18+ months):**
- Invest in qualifying a second source (even at higher cost)
- Consider vertical integration for truly critical items
- Joint ventures or equity stakes in suppliers

The key insight: the cost of qualification pales compared to the cost of a line-down situation. We calculate the "insurance value" of second sources to justify the investment.`,
    upvotes: 22,
    downvotes: 0,
    score: 22,
    isAccepted: true,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },

  // Answers for q_003
  {
    id: 'a_005',
    questionId: 'q_003',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    body: `For manufacturing suppliers specifically, I've found EcoVadis to be the most practical. Here's why:

**Pros:**
- Action-oriented scorecards (not just ratings)
- Good coverage of Asian manufacturers
- Reasonable cost (~$500-2000/assessment depending on supplier size)
- Improvement tracking over time

**Cons:**
- Self-reported data (though they do verification)
- Can take 6-8 weeks for new assessments

We use it as a baseline and supplement with our own audits for high-spend suppliers.`,
    upvotes: 14,
    downvotes: 2,
    score: 12,
    isAccepted: false,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },

  // Answers for q_004
  {
    id: 'a_010',
    questionId: 'q_004',
    author: MOCK_USERS[4],
    visitorId: 'v_005',
    body: `This is unfortunately common right now. Here's how we handled a similar situation:

**Immediate steps:**
1. Document everything in writing
2. Review your contract with legal - specifically termination clauses and your remedies
3. Request detailed cost breakdowns to verify their claims

**Negotiation approach:**
We ended up agreeing to a partial increase (8% vs 15%) in exchange for:
- Contract extension at the new price
- Price decrease commitment when commodities normalize
- Quarterly price reviews tied to published indices

**Key leverage:**
- Made clear we were actively qualifying alternatives (even if we weren't ready)
- Highlighted the reputational risk to them if this became public
- Offered faster payment terms as a sweetener

Don't agree to the full increase - they're probably padding it. But also recognize that if their costs truly went up 20%, them asking for 15% might be reasonable.`,
    upvotes: 38,
    downvotes: 1,
    score: 37,
    isAccepted: true,
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
  },

  // Answers for q_008
  {
    id: 'a_015',
    questionId: 'q_008',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    body: `Great that you're preparing! Here are the subtle things I look for:

**Quality Red Flags:**
- Clean areas ONLY where you're walking (suggests they cleaned just for you)
- Workers who seem nervous or coached
- Calibration stickers that are all the same date (suggests batch paperwork, not actual calibration)
- No visible reject bins or rework areas (everyone has defects - where do theirs go?)

**Labor/Safety:**
- Locked emergency exits (fire hazard AND suggests they're hiding something)
- Workers avoiding eye contact with management
- Excessive security cameras pointed at workers vs. at product
- Missing or spotless PPE (either they don't use it or put it on just for you)

**Financial Health:**
- Deferred maintenance visible
- Inventory dust (slow-moving = cash flow issues)
- Missing equipment that was there last visit

**Pro tips:**
- Ask to see the bathroom (tells you how they treat workers)
- Show up early or stay late to see unscripted operations
- Talk to workers away from supervisors if possible

Good luck!`,
    upvotes: 31,
    downvotes: 0,
    score: 31,
    isAccepted: true,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
];

// Helper functions

export function getQuestionById(id: string): QuestionWithAnswers | null {
  const question = MOCK_QUESTIONS.find(q => q.id === id);
  if (!question) return null;

  const answers = MOCK_ANSWERS
    .filter(a => a.questionId === id)
    .sort((a, b) => {
      // Accepted answer first, then by score
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;
      return b.score - a.score;
    });

  return { ...question, answers };
}

export function filterQuestions(options: {
  sortBy?: 'newest' | 'votes' | 'unanswered' | 'active';
  filter?: 'all' | 'open' | 'answered';
  tag?: string | null;
  search?: string;
}): Question[] {
  let results = [...MOCK_QUESTIONS];

  // Filter by status
  if (options.filter === 'open') {
    results = results.filter(q => q.status === 'open');
  } else if (options.filter === 'answered') {
    results = results.filter(q => q.hasAcceptedAnswer);
  }

  // Filter by tag
  if (options.tag) {
    results = results.filter(q =>
      q.tags.some(t => t.slug === options.tag)
    );
  }

  // Search
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    results = results.filter(q =>
      q.title.toLowerCase().includes(searchLower) ||
      q.body.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  switch (options.sortBy) {
    case 'votes':
      results.sort((a, b) => b.score - a.score);
      break;
    case 'unanswered':
      results = results.filter(q => q.answerCount === 0);
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'active':
      results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case 'newest':
    default:
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return results;
}

export function getPopularTags(limit = 8): Tag[] {
  return [...MOCK_TAGS]
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, limit);
}
