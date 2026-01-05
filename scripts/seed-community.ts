// Seed Community Data - Realistic procurement Q&A content
// Run with: npx tsx scripts/seed-community.ts

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import {
  users,
  profiles,
  tags,
  questions,
  questionTags,
  answers,
} from '../src/db/schema.js';
import { seedBadges, checkAndAwardBadges } from '../src/services/badgeService.js';

// ══════════════════════════════════════════════════════════════════
// SAMPLE DATA
// ══════════════════════════════════════════════════════════════════

const SAMPLE_USERS = [
  {
    email: 'sarah.chen@example.com',
    displayName: 'Sarah Chen',
    username: 'sarahchen',
    company: 'Meridian Manufacturing',
    jobTitle: 'VP of Procurement',
    bio: '20+ years in strategic sourcing. Passionate about sustainable supply chains.',
    reputation: 2450,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
  },
  {
    email: 'marcus.rodriguez@example.com',
    displayName: 'Marcus Rodriguez',
    username: 'mrodriguez',
    company: 'AutoDrive Corp',
    jobTitle: 'Supply Chain Director',
    bio: 'Automotive supply chain specialist. Former Toyota, now leading transformation at AutoDrive.',
    reputation: 1820,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
  {
    email: 'emily.watson@example.com',
    displayName: 'Emily Watson',
    username: 'emwatson',
    company: 'PharmaCo',
    jobTitle: 'Strategic Sourcing Lead',
    bio: 'Pharma procurement with focus on API sourcing and regulatory compliance.',
    reputation: 950,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    email: 'david.kim@example.com',
    displayName: 'David Kim',
    username: 'dkim',
    company: 'TechFlow Inc',
    jobTitle: 'Vendor Relations Manager',
    bio: 'Building better vendor relationships through data-driven insights.',
    reputation: 680,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  },
  {
    email: 'jessica.thompson@example.com',
    displayName: 'Jessica Thompson',
    username: 'jthompson',
    company: 'RetailMax',
    jobTitle: 'Procurement Analyst',
    bio: 'Data analyst turned procurement specialist. Love finding patterns in spend data.',
    reputation: 320,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    email: 'alex.okonkwo@example.com',
    displayName: 'Alex Okonkwo',
    username: 'aokonkwo',
    company: 'Global Goods Ltd',
    jobTitle: 'Category Manager',
    bio: 'CPG category management. Specializing in indirect spend optimization.',
    reputation: 540,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
];

const SAMPLE_TAGS = [
  { name: 'Supplier Management', slug: 'supplier-management', description: 'Managing supplier relationships and performance' },
  { name: 'Risk Assessment', slug: 'risk-assessment', description: 'Evaluating and mitigating supply chain risks' },
  { name: 'Contract Negotiation', slug: 'contract-negotiation', description: 'Negotiating terms, pricing, and agreements' },
  { name: 'Sourcing Strategy', slug: 'sourcing-strategy', description: 'Strategic approaches to supplier selection' },
  { name: 'Compliance', slug: 'compliance', description: 'Regulatory and policy compliance in procurement' },
  { name: 'Cost Optimization', slug: 'cost-optimization', description: 'Reducing costs while maintaining quality' },
  { name: 'Sustainability', slug: 'sustainability', description: 'Environmental and social responsibility in sourcing' },
  { name: 'Logistics', slug: 'logistics', description: 'Transportation, warehousing, and distribution' },
  { name: 'Procurement Tech', slug: 'procurement-tech', description: 'Technology and tools for procurement' },
  { name: 'Vendor Evaluation', slug: 'vendor-evaluation', description: 'Assessing and qualifying new vendors' },
];

interface QuestionData {
  title: string;
  body: string;
  authorIndex: number;
  tagSlugs: string[];
  answers: AnswerData[];
  score: number;
}

interface AnswerData {
  body: string;
  authorIndex: number;
  score: number;
  isAccepted: boolean;
}

const SAMPLE_QUESTIONS: QuestionData[] = [
  {
    title: 'How do you handle supplier risk assessment for single-source critical components?',
    body: `We're heavily dependent on a single supplier for a critical component in our manufacturing process. They're the only ones who can meet our quality specs, but it's keeping me up at night.

What frameworks or approaches do you use for assessing and mitigating single-source risk?

Specifically interested in:
- How do you quantify the risk?
- What mitigation strategies have actually worked?
- At what point do you invest in qualifying an alternative?

Any experiences or war stories would be helpful.`,
    authorIndex: 4, // Jessica
    tagSlugs: ['risk-assessment', 'supplier-management'],
    score: 24,
    answers: [
      {
        body: `Great question - this is one of the most common challenges in procurement.

**Framework we use:**

1. **Risk Scoring Matrix** - We score each single-source component on:
   - Revenue impact if supply disrupted
   - Time to qualify alternative
   - Supplier financial health
   - Geographic/political risk

2. **Mitigation Tiers:**
   - Tier 1 (Critical): Active dual-sourcing program, 6+ months safety stock
   - Tier 2 (Important): Qualified backup, 3 months stock
   - Tier 3 (Standard): Documented alternatives, standard inventory

**What's worked for us:**
- We invested in qualifying a second source for our top 5 single-source items. Cost us about $200K in qualification but saved us $2M when our primary had a fire.
- Strategic inventory buffers - yes it ties up capital, but insurance is never free.
- Deep supplier relationships - we have quarterly business reviews with all single-source suppliers, including plant visits.

**When to qualify alternative:**
Rule of thumb: If the component is in your top 20% by spend OR risk score, start the qualification process now. Don't wait for a crisis.`,
        authorIndex: 0, // Sarah
        score: 18,
        isAccepted: true,
      },
      {
        body: `Adding to Sarah's excellent answer - in automotive, we've learned some hard lessons here.

One thing that's worked: we now require all single-source suppliers to maintain business continuity insurance and share their BCP with us. It's become a contract requirement.

Also, don't underestimate the power of transparency. When we explained to our key supplier why we were qualifying an alternative, they actually helped us do it. They understood it wasn't about replacing them - it was about supply chain resilience.`,
        authorIndex: 1, // Marcus
        score: 12,
        isAccepted: false,
      },
    ],
  },
  {
    title: 'Best practices for renegotiating contracts during high inflation periods?',
    body: `We're getting hit with price increase requests from almost every supplier. Some are justified, some feel opportunistic.

How are you approaching contract renegotiations in this environment? Looking for:
- How to validate supplier cost claims
- Negotiation tactics that preserve relationships
- Contract structures that work for both parties

We can't just accept every increase, but we also can't lose critical suppliers.`,
    authorIndex: 3, // David
    tagSlugs: ['contract-negotiation', 'cost-optimization', 'supplier-management'],
    score: 31,
    answers: [
      {
        body: `This has been my life for the past 18 months. Here's what's working:

**Validating cost claims:**
- Request detailed cost breakdowns (material, labor, energy, logistics)
- Cross-reference with commodity indices (we use IHS and Mintec)
- Compare increases across similar suppliers - if one is asking 15% and others 8%, dig deeper

**Negotiation approach:**
1. Acknowledge the reality - inflation is real, don't pretend it isn't
2. Ask for phased increases rather than one big jump
3. Tie future adjustments to specific indices
4. Offer something in return: longer contract, larger volumes, faster payment terms

**Contract structures that help:**
- Index-based pricing with caps and floors
- Quarterly price reviews instead of annual
- Gain-sharing clauses for when costs come back down (they will eventually)

The key is being firm but fair. Suppliers remember who treated them well during tough times.`,
        authorIndex: 0, // Sarah
        score: 22,
        isAccepted: false,
      },
      {
        body: `One tactic that's worked well for us: **Total Cost of Ownership (TCO) conversations**.

When a supplier asks for a 10% price increase, we zoom out and look at the whole picture:
- Can they improve delivery performance to reduce our expediting costs?
- Are there packaging changes that reduce our handling costs?
- Can they hold inventory for us to reduce our carrying costs?

Often we find 5-7% savings elsewhere that offset part of the increase. Supplier gets most of their ask, we manage the bottom line impact.

Also - don't negotiate via email. Get on a video call or in person. It's harder to be unreasonable face-to-face.`,
        authorIndex: 5, // Alex
        score: 15,
        isAccepted: false,
      },
    ],
  },
  {
    title: 'What KPIs do you actually track for supplier performance reviews?',
    body: `I'm revamping our supplier scorecard and want to make sure we're measuring what matters, not just what's easy to measure.

Currently we track:
- On-time delivery %
- Quality (PPM defects)
- Invoice accuracy

But I feel like we're missing things. What KPIs have you found most valuable? How often do you review them with suppliers?`,
    authorIndex: 5, // Alex
    tagSlugs: ['supplier-management', 'vendor-evaluation'],
    score: 19,
    answers: [
      {
        body: `Your foundation is solid. Here's what we've added that's been valuable:

**Operational:**
- Lead time consistency (not just OTD, but variability)
- Fill rate (are we getting full orders?)
- Response time to inquiries/issues

**Strategic:**
- Innovation contributions (have they proposed improvements?)
- Flexibility score (how do they handle changes?)
- Sustainability metrics (carbon footprint, certifications)

**Relationship:**
- Escalation frequency
- Contract compliance
- Price competitiveness vs. market

**Pro tip:** Don't measure more than 8-10 things. Otherwise you dilute focus.

We do monthly dashboards for operational metrics, quarterly deep-dives for strategic, and annual for relationship. Top 20% of suppliers by spend get the most attention.`,
        authorIndex: 2, // Emily
        score: 14,
        isAccepted: true,
      },
    ],
  },
  {
    title: 'How to build a sustainable procurement strategy without killing margins?',
    body: `Leadership wants us to improve our sustainability metrics - lower carbon suppliers, ethical sourcing, the works. But they also don't want costs to go up.

Has anyone successfully implemented sustainable procurement without a significant cost premium? Looking for practical approaches, not just theoretical frameworks.`,
    authorIndex: 1, // Marcus
    tagSlugs: ['sustainability', 'cost-optimization', 'sourcing-strategy'],
    score: 27,
    answers: [
      {
        body: `It's definitely possible, but requires a longer-term view. Here's what's worked:

**Quick wins (cost neutral or positive):**
- Consolidate shipments to reduce transport emissions AND costs
- Switch to digital documentation
- Optimize packaging (less material = lower cost + lower carbon)
- Energy-efficient specifications for applicable goods

**Medium-term (1-3 years):**
- Local sourcing where possible (lower logistics, supports community)
- Supplier development programs for smaller sustainable suppliers
- Circular economy initiatives (refurbished, recycled materials)

**The business case trick:**
Frame sustainability as risk mitigation. Carbon taxes are coming. Supply chain disruptions from climate events are increasing. Sustainable suppliers are often more resilient.

We calculated that our sustainability investments have a 3-year payback through risk reduction alone, before counting any cost savings or brand value.`,
        authorIndex: 0, // Sarah
        score: 19,
        isAccepted: false,
      },
      {
        body: `Adding a practical example: we switched 30% of our packaging to recycled materials. Initial quotes were 12% higher. But we:

1. Committed to 3-year volumes
2. Agreed to slightly longer lead times
3. Helped the supplier get grants for equipment

Final premium: 3%. And we got a sustainability story for marketing.

The key is treating sustainable suppliers as partners, not vendors.`,
        authorIndex: 2, // Emily
        score: 11,
        isAccepted: false,
      },
    ],
  },
  {
    title: 'Evaluating suppliers in emerging markets - red flags to watch for?',
    body: `We're looking at expanding our supplier base to Southeast Asia to reduce China concentration. First time sourcing from Vietnam and Indonesia.

What should I be watching for that might not be obvious? Any due diligence steps that are critical for emerging market suppliers?`,
    authorIndex: 2, // Emily
    tagSlugs: ['vendor-evaluation', 'risk-assessment', 'sourcing-strategy'],
    score: 16,
    answers: [
      {
        body: `Been doing this for 10 years. Here's my checklist:

**Red Flags:**
- Reluctance to allow factory audits
- Financials that don't add up (check Dun & Bradstreet)
- High employee turnover (ask for data)
- Multiple "trading company" intermediaries
- Too-good-to-be-true pricing
- No established customers you can reference

**Critical Due Diligence:**
1. **Physical audit** - always, always visit the factory. Photos lie.
2. **Background checks** - use local investigators for ownership verification
3. **Bank and trade references** - actually call them
4. **Labor compliance audit** - third party, unannounced if possible
5. **IP protection assessment** - especially for anything proprietary
6. **Logistics dry run** - ship a trial order before committing

**Vietnam-specific:** Watch for capacity claims. Many suppliers share facilities and overcommit. Indonesia: infrastructure can be a challenge outside major hubs.

Budget 2-3x the time you'd expect for qualification. Worth it.`,
        authorIndex: 1, // Marcus
        score: 21,
        isAccepted: true,
      },
    ],
  },
  {
    title: 'Has anyone successfully implemented AI in their sourcing workflow?',
    body: `There's so much hype about AI in procurement. Curious if anyone has actually implemented something that works.

Specifically interested in:
- What use cases have delivered real value?
- What tools are you using?
- What flopped?

Not looking for vendor pitches, just real practitioner experiences.`,
    authorIndex: 4, // Jessica
    tagSlugs: ['procurement-tech', 'sourcing-strategy'],
    score: 22,
    answers: [
      {
        body: `We've been experimenting for about 18 months. Here's the honest truth:

**What's working:**
- **Spend classification** - AI categorizes our tail spend way faster than humans. 95%+ accuracy after training.
- **Contract analysis** - Extracting key terms and obligations from 1000s of legacy contracts. Saved 6 months of manual work.
- **Supplier risk monitoring** - Real-time alerts from news/financial sources. Caught two supplier issues before they became crises.

**What flopped:**
- **Automated negotiation** - The "AI negotiation" tool we tried was basically templated emails. Not impressed.
- **Demand forecasting** - Our data wasn't clean enough. Garbage in, garbage out.

**Tools we're using:**
- SpendHQ for spend analytics (has good ML features)
- Resilinc for supply chain risk
- Built our own contract analyzer using Azure OpenAI + custom training

**Advice:** Start with data cleanup before any AI project. Your AI is only as good as your data.`,
        authorIndex: 3, // David
        score: 16,
        isAccepted: false,
      },
      {
        body: `Agree with David on the data point. We spent 6 months cleaning our supplier and spend data before any AI deployment.

One area he didn't mention: **market intelligence**. We use AI to monitor commodity prices, trade policies, and supplier news. It surfaces things we'd never catch manually.

Biggest lesson: AI is a tool, not a strategy. Know what problem you're solving first.`,
        authorIndex: 0, // Sarah
        score: 9,
        isAccepted: false,
      },
    ],
  },
  {
    title: 'How do you justify procurement technology investments to the CFO?',
    body: `I want to implement a proper S2P suite but our CFO is skeptical about the ROI. Previous IT projects haven't delivered as promised.

How have you built business cases that actually convinced finance? What metrics resonate with CFOs?`,
    authorIndex: 3, // David
    tagSlugs: ['procurement-tech', 'cost-optimization'],
    score: 14,
    answers: [
      {
        body: `CFO here in a past life, so I know both sides.

**What CFOs want to see:**
1. **Hard dollar savings** - Not "potential" or "up to" - actual projected savings with methodology
2. **Quick wins** - What can you deliver in 6 months? They're skeptical of 3-year projections
3. **Benchmarks** - "Companies like us saved X%" is powerful
4. **Risk reduction** - Quantify the cost of a compliance failure or supply disruption

**Structure that works:**
- Phase 0 (90 days): Data cleanup, quick wins, prove the concept
- Phase 1 (6 months): Core deployment, first savings
- Phase 2 (12 months): Advanced features, optimization

**Pro tips:**
- Get the CFO's team involved early - they'll own the numbers
- Pilot before full rollout - reduces perceived risk
- Connect to strategic priorities - if cost reduction is #1 priority, lead with that
- Show the cost of doing nothing - status quo has costs too

We got our S2P approved by showing we could pay for it in 18 months through maverick spend reduction alone. Everything else was gravy.`,
        authorIndex: 0, // Sarah
        score: 12,
        isAccepted: true,
      },
    ],
  },
  {
    title: 'Managing supplier relationships when you have to push back on pricing?',
    body: `One of our best suppliers just proposed a 15% increase for next year. I know their costs have gone up, but 15% is way above what we can absorb.

How do you push back firmly without damaging a relationship you value? We've worked with them for 8 years and they're consistently our best performer.`,
    authorIndex: 5, // Alex
    tagSlugs: ['supplier-management', 'contract-negotiation'],
    score: 11,
    answers: [
      {
        body: `The fact that you're asking this question means you'll handle it well.

**My approach for valued suppliers:**

1. **Acknowledge first**: "We value this relationship and want to find a path forward"

2. **Seek to understand**: Ask for a detailed breakdown. Often reveals areas for discussion.

3. **Share your constraints**: Be honest about what you can and can't do. Transparency builds trust.

4. **Explore alternatives together**:
   - Phased increases (5% now, 5% in 6 months, 5% in 12)
   - Volume commitments for better pricing
   - Spec changes that reduce their costs
   - Longer contract for price protection

5. **Find the ZOPA**: There's usually a zone of possible agreement. Your job is finding it.

**What not to do:**
- Threaten to leave (unless you mean it)
- Compare them to cheaper alternatives (insulting to a top performer)
- Make it personal

After 8 years, you've built relationship equity. Use it wisely - not as a weapon, but as a foundation for honest dialogue.`,
        authorIndex: 1, // Marcus
        score: 8,
        isAccepted: false,
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ══════════════════════════════════════════════════════════════════

async function seedUsers(db: ReturnType<typeof drizzle>): Promise<Map<number, string>> {
  console.log('Seeding users...');
  const userIdMap = new Map<number, string>();

  for (let i = 0; i < SAMPLE_USERS.length; i++) {
    const userData = SAMPLE_USERS[i];

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    let userId: string;

    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`  User ${userData.displayName} already exists`);
    } else {
      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: userData.email,
          emailVerifiedAt: new Date(),
        })
        .returning({ id: users.id });
      userId = newUser.id;
      console.log(`  Created user ${userData.displayName}`);
    }

    userIdMap.set(i, userId);

    // Upsert profile
    const existingProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      await db
        .update(profiles)
        .set({
          displayName: userData.displayName,
          username: userData.username,
          company: userData.company,
          jobTitle: userData.jobTitle,
          bio: userData.bio,
          reputation: userData.reputation,
          avatarUrl: userData.avatarUrl,
          onboardingStep: 'complete',
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        displayName: userData.displayName,
        username: userData.username,
        company: userData.company,
        jobTitle: userData.jobTitle,
        bio: userData.bio,
        reputation: userData.reputation,
        avatarUrl: userData.avatarUrl,
        onboardingStep: 'complete',
      });
    }
  }

  return userIdMap;
}

async function seedTags(db: ReturnType<typeof drizzle>): Promise<Map<string, string>> {
  console.log('Seeding tags...');
  const tagIdMap = new Map<string, string>();

  for (const tagData of SAMPLE_TAGS) {
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, tagData.slug))
      .limit(1);

    let tagId: string;

    if (existing.length > 0) {
      tagId = existing[0].id;
      // Update existing tag
      await db
        .update(tags)
        .set({ name: tagData.name, description: tagData.description })
        .where(eq(tags.id, tagId));
    } else {
      const [newTag] = await db
        .insert(tags)
        .values({ ...tagData, questionCount: 0 })
        .returning({ id: tags.id });
      tagId = newTag.id;
      console.log(`  Created tag: ${tagData.name}`);
    }

    tagIdMap.set(tagData.slug, tagId);
  }

  return tagIdMap;
}

async function seedQuestionsAndAnswers(
  db: ReturnType<typeof drizzle>,
  userIdMap: Map<number, string>,
  tagIdMap: Map<string, string>
): Promise<void> {
  console.log('Seeding questions and answers...');

  // Track tag question counts
  const tagCounts = new Map<string, number>();

  for (const qData of SAMPLE_QUESTIONS) {
    const authorId = userIdMap.get(qData.authorIndex)!;

    // Check if question already exists (by title)
    const existing = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.title, qData.title))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Question already exists: ${qData.title.substring(0, 40)}...`);
      continue;
    }

    // Create question
    const [newQuestion] = await db
      .insert(questions)
      .values({
        userId: authorId,
        title: qData.title,
        body: qData.body,
        score: qData.score,
        answerCount: qData.answers.length,
        status: qData.answers.some(a => a.isAccepted) ? 'answered' : 'open',
        createdAt: randomPastDate(30),
      })
      .returning({ id: questions.id });

    console.log(`  Created question: ${qData.title.substring(0, 40)}...`);

    // Add tags
    for (const slug of qData.tagSlugs) {
      const tagId = tagIdMap.get(slug);
      if (tagId) {
        await db.insert(questionTags).values({
          questionId: newQuestion.id,
          tagId,
        });
        tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
      }
    }

    // Add answers
    let acceptedAnswerId: string | null = null;
    for (const aData of qData.answers) {
      const answerAuthorId = userIdMap.get(aData.authorIndex)!;

      const [newAnswer] = await db
        .insert(answers)
        .values({
          questionId: newQuestion.id,
          userId: answerAuthorId,
          body: aData.body,
          score: aData.score,
          isAccepted: aData.isAccepted,
          createdAt: randomPastDate(25),
        })
        .returning({ id: answers.id });

      if (aData.isAccepted) {
        acceptedAnswerId = newAnswer.id;
      }

      console.log(`    Added answer by ${SAMPLE_USERS[aData.authorIndex].displayName}`);
    }

    // Update question with accepted answer
    if (acceptedAnswerId) {
      await db
        .update(questions)
        .set({ acceptedAnswerId })
        .where(eq(questions.id, newQuestion.id));
    }
  }

  // Update tag counts
  console.log('Updating tag counts...');
  for (const [tagId, count] of tagCounts) {
    await db
      .update(tags)
      .set({ questionCount: count })
      .where(eq(tags.id, tagId));
  }
}

async function seedBadgesForUsers(
  db: ReturnType<typeof drizzle>,
  userIdMap: Map<number, string>
): Promise<void> {
  console.log('Seeding badges...');

  // First, make sure badge definitions exist
  await seedBadges(db);

  // Check and award badges for each user
  for (const [index, userId] of userIdMap) {
    const awarded = await checkAndAwardBadges(db, userId);
    if (awarded.length > 0) {
      console.log(`  Awarded ${awarded.length} badges to ${SAMPLE_USERS[index].displayName}`);
    }
  }
}

function randomPastDate(maxDaysAgo: number): Date {
  const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log('Starting community seed...\n');

  // Check for DATABASE_URL - load from .env.local if needed
  if (!process.env.DATABASE_URL) {
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: '.env.local' });
    } catch {
      // dotenv not available, continue without it
    }
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    console.error('Set it in your environment or in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    const userIdMap = await seedUsers(db);
    const tagIdMap = await seedTags(db);
    await seedQuestionsAndAnswers(db, userIdMap, tagIdMap);
    await seedBadgesForUsers(db, userIdMap);

    console.log('\nSeed complete!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
