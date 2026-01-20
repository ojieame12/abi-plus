// Community Q&A Mock Data

import type {
  Tag,
  UserProfile,
  Question,
  Answer,
  QuestionWithAnswers,
  QuestionSortBy,
  QuestionFilter,
} from '../types/community';
import type {
  TrendChartData,
  SpendExposureData,
  AlertCardData,
  SupplierRiskCardData,
} from '../types/widgets';

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

// Mock User Profiles - varied reputation levels to show different badge tiers
// Newcomer: 0-99, Bronze: 100-499, Silver: 500-999, Gold: 1000-2499, Platinum: 2500-4999, Diamond: 5000+
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user_1',
    visitorId: 'v_001',
    displayName: 'Sarah Chen',
    title: 'Senior Procurement Manager',
    company: 'GlobalTech Inc',
    reputation: 5840,  // Diamond
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_2',
    visitorId: 'v_002',
    displayName: 'Michael Torres',
    title: 'Risk Analyst',
    company: 'SupplyChain Pro',
    reputation: 3250,  // Platinum
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_3',
    visitorId: 'v_003',
    displayName: 'Emily Watson',
    title: 'VP of Procurement',
    company: 'Acme Manufacturing',
    reputation: 7420,  // Diamond
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_4',
    visitorId: 'v_004',
    displayName: 'James Kim',
    title: 'Sourcing Specialist',
    company: 'TechStart Solutions',
    reputation: 456,   // Bronze
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_5',
    visitorId: 'v_005',
    displayName: 'Amanda Rodriguez',
    title: 'Compliance Officer',
    company: 'FinServe Global',
    reputation: 1890,  // Gold
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
  },
  {
    id: 'user_6',
    visitorId: 'v_006',
    displayName: 'David Park',
    title: 'Category Manager',
    company: 'RetailMax',
    reputation: 780,   // Silver
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

  // ══════════════════════════════════════════════════════════════════
  // QUESTION WITH IMAGES
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'q_009',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    title: 'Is this spend distribution normal for a mid-size manufacturing company?',
    body: `I just ran my first portfolio analysis and the results seem off to me. Here's what I'm seeing:

About 45% of our spend is concentrated in "Medium-High" risk suppliers, which seems high compared to what I've read about industry benchmarks.

**Key observations:**
- Total spend across 47 suppliers
- Almost half our spend is with medium-high risk vendors
- Only 12% with low-risk suppliers

Is this a red flag or fairly typical for a company our size? We're a $200M revenue manufacturer in the automotive parts space.`,
    images: [
      {
        id: 'img_001',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
        alt: 'Dashboard showing spend distribution pie chart',
        caption: 'Our current spend distribution by risk level',
      },
    ],
    upvotes: 34,
    downvotes: 1,
    score: 33,
    viewCount: 567,
    answerCount: 4,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(3),
  },

  // ══════════════════════════════════════════════════════════════════
  // QUESTION WITH AI CONTEXT SUMMARY (from conversation)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'q_010',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    title: 'Acme Steel Corp risk score jumped 15 points - anyone else seeing supplier volatility?',
    body: `I was analyzing our steel suppliers earlier and noticed Acme Steel Corp's risk score increased significantly over the past month. The AI assistant flagged several contributing factors:

- Recent news about labor disputes at their main facility
- Q3 financial results showed margin compression
- Two key executives departed in the past 6 weeks

**My questions:**
1. Are other customers of Acme seeing similar concerns?
2. How much weight should I give to executive departures vs. financial metrics?
3. Should I be proactively engaging with them or wait for more data?

I've attached the risk trend chart from my analysis. The spike in mid-December is what concerns me most.`,
    aiContextSummary: 'User was analyzing steel supplier portfolio when ABI flagged Acme Steel Corp for significant risk score increase. The conversation included factor breakdown analysis showing financial stress and operational concerns as primary drivers.',
    embeddedWidgets: [
      {
        id: 'widget_trend_001',
        type: 'trend_chart',
        data: {
          title: 'Acme Steel Corp Risk Score Trend',
          dataPoints: [
            { date: '2024-09-01', value: 42, label: 'Sep' },
            { date: '2024-10-01', value: 44, label: 'Oct' },
            { date: '2024-11-01', value: 45, label: 'Nov' },
            { date: '2024-12-01', value: 52, label: 'Dec' },
            { date: '2025-01-01', value: 58, label: 'Jan' },
          ],
          changeDirection: 'up',
          changeSummary: '+16 points over 4 months',
          unit: 'Risk Score',
          suppliers: ['Acme Steel Corp'],
        } as TrendChartData,
        size: 'M',
        caption: 'Risk score trend showing steady increase since September',
      },
    ],
    upvotes: 52,
    downvotes: 3,
    score: 49,
    viewCount: 823,
    answerCount: 8,
    hasAcceptedAnswer: true,
    acceptedAnswerId: 'a_020',
    status: 'answered',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(8),
  },

  // ══════════════════════════════════════════════════════════════════
  // QUESTION WITH EMBEDDED WIDGET (Spend Exposure)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'q_011',
    author: MOCK_USERS[0],
    visitorId: 'v_001',
    title: 'Our high-risk spend exposure seems dangerous - how do others manage this?',
    body: `After our quarterly portfolio review, I'm concerned about our spend-at-risk distribution. We have $4.2M (23%) of our total spend with high-risk suppliers.

The interactive breakdown below shows the full picture. What worries me most is that our largest single supplier (Precision Components Ltd) accounts for $2.1M and is rated "High Risk."

**Looking for advice on:**
- What's an acceptable threshold for high-risk spend percentage?
- How quickly should we be working to diversify away from high-risk suppliers?
- Are there industries where higher risk concentration is unavoidable?

Would appreciate any benchmarks or frameworks you use for managing spend-at-risk.`,
    embeddedWidgets: [
      {
        id: 'widget_spend_001',
        type: 'spend_exposure',
        data: {
          totalSpend: 18500000,
          totalSpendFormatted: '$18.5M',
          breakdown: [
            { level: 'high', amount: 4200000, formatted: '$4.2M', percent: 23, supplierCount: 3 },
            { level: 'medium-high', amount: 5550000, formatted: '$5.5M', percent: 30, supplierCount: 8 },
            { level: 'medium', amount: 4625000, formatted: '$4.6M', percent: 25, supplierCount: 12 },
            { level: 'low', amount: 4125000, formatted: '$4.1M', percent: 22, supplierCount: 24 },
          ],
          highestExposure: {
            supplierName: 'Precision Components Ltd',
            amount: '$2.1M',
            riskLevel: 'high',
          },
        } as SpendExposureData,
        size: 'M',
        caption: 'Current spend-at-risk breakdown by supplier risk level',
      },
    ],
    upvotes: 41,
    downvotes: 2,
    score: 39,
    viewCount: 445,
    answerCount: 5,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[0], MOCK_TAGS[6]],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(5),
  },

  // ══════════════════════════════════════════════════════════════════
  // QUESTION WITH ALERT WIDGET
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'q_012',
    author: MOCK_USERS[3],
    visitorId: 'v_004',
    title: 'Multiple suppliers showing risk increases - coincidence or market trend?',
    body: `Got hit with several risk alerts this week. Three of our suppliers in the electronics components space all showed increased risk scores in the same timeframe.

The alert below summarizes the changes. I'm wondering if this is:
1. A sector-wide issue (chip shortage aftermath?)
2. Coincidental timing of their individual issues
3. Something about how risk scores are calculated

Has anyone else noticed correlated risk movements across suppliers in the same category? Trying to understand if I should be concerned about systemic risk in our electronics supply base.`,
    aiContextSummary: 'User received multiple risk alerts and was investigating potential correlation between supplier risk increases in the electronics sector.',
    embeddedWidgets: [
      {
        id: 'widget_alert_001',
        type: 'alert_card',
        data: {
          alertType: 'risk_increase',
          severity: 'warning',
          title: 'Multiple Supplier Risk Increases Detected',
          affectedSuppliers: [
            { name: 'ChipTech Industries', previousScore: 38, currentScore: 47, change: '+9' },
            { name: 'MicroElectric Co', previousScore: 41, currentScore: 52, change: '+11' },
            { name: 'CircuitPro Manufacturing', previousScore: 35, currentScore: 44, change: '+9' },
          ],
          timestamp: new Date().toISOString(),
          actionRequired: true,
          suggestedAction: 'Review category-wide risk factors and consider supplier diversification strategy',
        } as AlertCardData,
        size: 'M',
        caption: 'This weeks risk alerts across electronics suppliers',
      },
    ],
    upvotes: 28,
    downvotes: 1,
    score: 27,
    viewCount: 312,
    answerCount: 4,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(6),
  },

  // ══════════════════════════════════════════════════════════════════
  // QUESTION WITH SUPPLIER RISK CARD
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'q_013',
    author: MOCK_USERS[5],
    visitorId: 'v_006',
    title: 'Evaluating this new supplier - feedback on risk profile?',
    body: `We're considering onboarding Global Manufacturing Partners as a secondary source for machined components. Their pricing is competitive but I want to get community input on their risk profile.

Here's their current assessment from our due diligence. A few things stand out:
- They're based in Vietnam, which adds some geopolitical considerations
- Financial stability looks solid
- Some concerns around quality management systems

For those who've worked with suppliers in Southeast Asia - does this risk profile look reasonable? Any red flags I should dig deeper on before we proceed with qualification?`,
    embeddedWidgets: [
      {
        id: 'widget_supplier_001',
        type: 'supplier_risk_card',
        data: {
          supplierId: 'sup_gmp_001',
          supplierName: 'Global Manufacturing Partners',
          riskScore: 52,
          riskLevel: 'medium',
          trend: 'stable',
          category: 'Machined Components',
          location: { city: 'Ho Chi Minh City', country: 'Vietnam', region: 'APAC' },
          spend: 0,
          spendFormatted: '$0 (New)',
          lastUpdated: new Date().toISOString(),
          keyFactors: [
            { name: 'Financial Stability', impact: 'positive' },
            { name: 'Geographic Risk', impact: 'negative' },
            { name: 'Quality Systems', impact: 'negative' },
            { name: 'Delivery Performance', impact: 'positive' },
          ],
          isResearched: true,
        } as SupplierRiskCardData,
        size: 'M',
        caption: 'Due diligence risk assessment for Global Manufacturing Partners',
      },
    ],
    upvotes: 15,
    downvotes: 0,
    score: 15,
    viewCount: 198,
    answerCount: 3,
    hasAcceptedAnswer: false,
    status: 'open',
    tags: [MOCK_TAGS[2], MOCK_TAGS[0]],
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(4),
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

  // Answers for q_010 (Acme Steel Corp question)
  {
    id: 'a_020',
    questionId: 'q_010',
    author: MOCK_USERS[4],
    visitorId: 'v_005',
    body: `We use Acme Steel Corp as well and have been monitoring this closely. Here's our take:

**Executive Departures:**
This is actually a bigger deal than many realize. When you lose a CFO and VP of Operations in quick succession, it often signals either:
- Internal disagreements about company direction
- Early warning signs that insiders see problems coming
- Or sometimes just coincidence (retirements, better opportunities)

**Our Approach:**
1. We've scheduled a QBR with their new leadership team for next month
2. Asked for updated financial statements (which they've agreed to provide)
3. Put a 90-day hold on increasing our spend with them
4. Identified two backup suppliers we could shift volume to if needed

**On the labor disputes:**
The union negotiations are industry-wide in the steel sector right now. I wouldn't weight this too heavily unless it escalates to actual work stoppages.

My recommendation: Don't panic, but do engage proactively. The suppliers who communicate well during uncertain times are usually the ones worth keeping.`,
    upvotes: 42,
    downvotes: 1,
    score: 41,
    isAccepted: true,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'a_021',
    questionId: 'q_010',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    body: `The 15-point jump is significant but not necessarily alarming on its own. I've seen similar movements that turned out to be:

1. **Temporary volatility** - Score recovers within 2-3 months as news cycle moves on
2. **Leading indicator** - The start of a longer decline that took 6-12 months to play out
3. **Overcorrection** - Risk models can be sensitive to certain news types

The fact that it's a steel supplier matters here. The whole sector is dealing with:
- Energy cost pressures
- Post-pandemic demand normalization
- China overcapacity concerns

I'd weight the financial metrics (margin compression) more heavily than the executive departures. Executives leave for all kinds of reasons, but deteriorating margins are hard to spin.`,
    upvotes: 18,
    downvotes: 0,
    score: 18,
    isAccepted: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },

  // Answers for q_011 (Spend exposure question)
  {
    id: 'a_022',
    questionId: 'q_011',
    author: MOCK_USERS[2],
    visitorId: 'v_003',
    body: `23% high-risk spend is definitely on the higher end, but whether it's "dangerous" depends on a few factors:

**Industry Benchmarks:**
- Best-in-class companies typically target <10% high-risk spend
- Average is around 15-20%
- Some industries (rare materials, specialized manufacturing) can run 25-30%

**Your Situation:**
The fact that one supplier (Precision Components) represents half of your high-risk spend is actually good news in a way - you have a clear target to address.

**Practical Steps:**
1. **Immediate:** Build 8-12 weeks safety stock for Precision Components
2. **30-60 days:** Start qualifying at least one alternative supplier
3. **Ongoing:** Implement quarterly reviews with clear KPIs for risk reduction

**The Real Question:**
Can you actually move away from Precision Components? If they're high-risk but also the only ones who can meet your specs, that changes the calculus. Focus on risk mitigation (contracts, inventory, monitoring) rather than diversification.`,
    upvotes: 24,
    downvotes: 0,
    score: 24,
    isAccepted: false,
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(18),
  },

  // Answers for q_012 (Multiple risk alerts question)
  {
    id: 'a_023',
    questionId: 'q_012',
    author: MOCK_USERS[0],
    visitorId: 'v_001',
    body: `This is definitely worth investigating. We've seen similar patterns and here's what we learned:

**Common Causes of Correlated Risk Increases:**

1. **Shared sub-tier suppliers** - If your electronics suppliers all source from the same chip fabs or PCB manufacturers, problems upstream cascade to all of them

2. **Macro factors** - Currency movements, trade policy changes, or commodity price spikes can hit an entire category simultaneously

3. **Scoring methodology** - Some risk scoring systems weight industry news heavily. A few negative headlines about "electronics supply chain" can bump everyone's score

**What to Do:**

- Ask your risk provider if there's a common factor driving all three increases
- Map your sub-tier exposure - you might find they all share a critical component source
- Look at whether the score increases are driven by the same factors or different ones

In our case, we found two of our "correlated" suppliers actually shared the same contract manufacturer in Malaysia. That wasn't a coincidence - it was concentration risk we hadn't seen.`,
    upvotes: 19,
    downvotes: 0,
    score: 19,
    isAccepted: false,
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(14),
  },

  // Answers for q_013 (New supplier evaluation question)
  {
    id: 'a_024',
    questionId: 'q_013',
    author: MOCK_USERS[1],
    visitorId: 'v_002',
    body: `I've worked with several Vietnamese suppliers and have some thoughts:

**The Good:**
- Score of 52 is solidly medium-risk - not alarming
- Vietnam has become increasingly sophisticated for machined components
- Financial stability being positive is important - many issues start there

**Things to Dig Into:**

1. **Quality Systems** - Ask specifically what certifications they have (ISO 9001? IATF 16949?). "Concerns" is vague - get details.

2. **Geographic Risk** - This is probably about:
   - Shipping times/logistics complexity
   - Currency exposure (VND can be volatile)
   - Political stability (actually pretty good in Vietnam)

3. **Labor practices** - Vietnam has good labor laws but enforcement varies. Consider a site visit or third-party audit.

**My Advice:**
Start with a small trial order (maybe 10-15% of what you'd eventually want to source). See how they perform on a real shipment before committing more volume. The "researched" flag suggests this is external data - validate it with your own experience.`,
    upvotes: 11,
    downvotes: 0,
    score: 11,
    isAccepted: false,
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(8),
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
  sortBy?: QuestionSortBy;
  filter?: QuestionFilter;
  tag?: string | null;
  search?: string;
}): Question[] {
  let results = [...MOCK_QUESTIONS];

  // Filter by status
  if (options.filter === 'open') {
    results = results.filter(q => q.status === 'open');
  } else if (options.filter === 'answered') {
    results = results.filter(q => q.hasAcceptedAnswer);
  } else if (options.filter === 'unanswered') {
    results = results.filter(q => !q.hasAcceptedAnswer);
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
