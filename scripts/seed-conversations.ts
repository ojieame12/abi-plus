// Seed script for plausible conversation sessions
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { conversations, messages } from '../src/db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Sample visitor ID for demo data
const DEMO_VISITOR_ID = 'demo-user-001';

const SEED_CONVERSATIONS = [
  {
    title: 'High-risk suppliers in Asia Pacific',
    category: 'risk',
    messages: [
      { role: 'user', content: 'Show me all high-risk suppliers in the Asia Pacific region' },
      { role: 'assistant', content: 'I found **12 high-risk suppliers** in your Asia Pacific portfolio. The majority are concentrated in electronics manufacturing (5) and raw materials (4).\n\n**Top concerns:**\n- 3 suppliers have recent financial instability indicators\n- 2 have compliance violations in the past 6 months\n- 4 are in regions with elevated geopolitical risk\n\nWould you like me to drill into any specific supplier or risk category?' },
      { role: 'user', content: 'What about the ones with financial instability?' },
      { role: 'assistant', content: 'The **3 suppliers with financial instability** are:\n\n1. **Shenzhen MicroTech Ltd** (SRS: 78) - Credit rating downgraded from B+ to B- in Q3. Cash flow concerns reported.\n\n2. **Taiwan Precision Components** (SRS: 72) - Revenue declined 23% YoY. Key customer loss reported.\n\n3. **Bangkok Industrial Supply** (SRS: 69) - Debt-to-equity ratio increased to 2.8x. Payment delays to their suppliers noted.\n\nI recommend setting up monitoring alerts for these three. Should I create alerts for any financial metric changes?' }
    ]
  },
  {
    title: 'Alternative suppliers for semiconductors',
    category: 'suppliers',
    messages: [
      { role: 'user', content: 'I need to find alternative suppliers for semiconductors. Our current supplier TSMC has a 3-month lead time.' },
      { role: 'assistant', content: 'I\'ve identified **8 alternative semiconductor suppliers** that could reduce your lead time dependency on TSMC.\n\n**Tier 1 Alternatives (similar capability):**\n- Samsung Foundry - 6-8 week lead time, 5nm capable\n- GlobalFoundries - 8-10 week lead time, 12nm+\n- Intel Foundry Services - 10-12 week lead time, 7nm capable\n\n**Tier 2 Alternatives (volume/legacy nodes):**\n- UMC - 4-6 week lead time, 28nm+\n- SMIC - 6-8 week lead time, 14nm+ (export restrictions apply)\n\nWould you like a detailed comparison including pricing, quality metrics, and geographic risk?' },
      { role: 'user', content: 'Yes, show me the comparison for tier 1 alternatives' },
      { role: 'assistant', content: '**Tier 1 Semiconductor Supplier Comparison**\n\n| Metric | Samsung | GlobalFoundries | Intel IFS |\n|--------|---------|-----------------|----------|\n| Lead Time | 6-8 weeks | 8-10 weeks | 10-12 weeks |\n| Min Order | $2M | $500K | $1M |\n| Quality (DPPM) | 12 | 18 | 15 |\n| Price Index | 1.15x TSMC | 0.95x TSMC | 1.25x TSMC |\n| Geo Risk | Medium | Low | Low |\n\n**Recommendation:** GlobalFoundries offers the best balance of lead time, cost, and risk for your volume. Samsung is better for cutting-edge nodes.\n\nShall I initiate an RFQ process with any of these?' }
    ]
  },
  {
    title: 'Q3 spend analysis by category',
    category: 'general',
    messages: [
      { role: 'user', content: 'What was our total spend in Q3 broken down by category?' },
      { role: 'assistant', content: 'Here\'s your **Q3 2024 Spend Analysis**:\n\n**Total Spend: $47.2M** (↑8% vs Q2)\n\n**By Category:**\n- Raw Materials: $18.4M (39%)\n- Components: $12.8M (27%)\n- Logistics: $8.1M (17%)\n- Services: $4.6M (10%)\n- MRO: $3.3M (7%)\n\n**Notable Changes:**\n- Raw Materials up 15% due to commodity price increases\n- Logistics down 5% from carrier renegotiations\n- Components stable with new supplier onboarding\n\nWould you like to see the top 10 suppliers by spend or drill into any category?' }
    ]
  },
  {
    title: 'Supplier compliance check - Acme Corp',
    category: 'suppliers',
    messages: [
      { role: 'user', content: 'Run a compliance check on Acme Corp' },
      { role: 'assistant', content: '**Compliance Report: Acme Corp**\n\n✅ **Overall Status: COMPLIANT** (Score: 92/100)\n\n**Certifications:**\n- ISO 9001:2015 ✓ (expires Dec 2025)\n- ISO 14001:2015 ✓ (expires Mar 2025)\n- SOC 2 Type II ✓ (renewed Aug 2024)\n\n**Regulatory:**\n- REACH Compliant ✓\n- RoHS Compliant ✓\n- Conflict Minerals Policy ✓\n\n**⚠️ Attention Items:**\n- ISO 14001 renewal due in 3 months\n- Annual audit scheduled for Nov 2024\n- 1 minor non-conformance from last audit (corrective action completed)\n\nWould you like me to set a reminder for the ISO 14001 renewal or view the audit history?' },
      { role: 'user', content: 'Set a reminder for the ISO renewal' },
      { role: 'assistant', content: 'Done! I\'ve created a reminder:\n\n📅 **Reminder Set**\n- **Subject:** Acme Corp ISO 14001:2015 Renewal\n- **Due:** January 15, 2025 (60 days before expiry)\n- **Assigned to:** You\n- **Notes:** Current cert expires March 2025. Initiate renewal process.\n\nI\'ll also flag this in your supplier risk dashboard. Would you like to notify the Acme Corp contact to begin their renewal process?' }
    ]
  },
  {
    title: 'Cost reduction opportunities',
    category: 'research',
    messages: [
      { role: 'user', content: 'Where can we reduce costs in our supply chain?' },
      { role: 'assistant', content: 'Based on your spend data and market analysis, I\'ve identified **$4.2M in potential savings** across 5 areas:\n\n**1. Supplier Consolidation - $1.8M**\nYou have 12 suppliers for packaging materials. Consolidating to 3-4 preferred suppliers could yield 15-20% savings through volume leverage.\n\n**2. Payment Terms Optimization - $890K**\n23 suppliers offer early payment discounts (2/10 net 30) that aren\'t being utilized. Implementing dynamic discounting could capture these.\n\n**3. Logistics Network - $720K**\nShipping from 4 separate distribution points to the same customers. Route optimization and consolidation recommended.\n\n**4. Specification Rationalization - $540K**\nOver-specified components in 8 product lines. Engineering review could identify cost-neutral alternatives.\n\n**5. Contract Renegotiation - $250K**\n6 contracts up for renewal in Q1 with below-market terms based on current commodity indices.\n\nWhich area would you like to explore first?' }
    ]
  },
  {
    title: 'New supplier onboarding - TechFlow Inc',
    category: 'suppliers',
    messages: [
      { role: 'user', content: 'Start onboarding process for TechFlow Inc as a new electronics supplier' },
      { role: 'assistant', content: 'I\'ll initiate the onboarding workflow for **TechFlow Inc**.\n\n**Onboarding Checklist:**\n\n☐ **Phase 1: Documentation** (Week 1-2)\n- Supplier registration form\n- W-9 / Tax documentation\n- Insurance certificates\n- Banking information\n\n☐ **Phase 2: Qualification** (Week 2-4)\n- Quality system audit (ISO 9001 verification)\n- Financial health assessment\n- Reference checks (3 required)\n- Site visit scheduling\n\n☐ **Phase 3: Setup** (Week 4-5)\n- ERP vendor master creation\n- Payment terms agreement\n- Pricing/catalog upload\n- EDI/integration setup\n\n☐ **Phase 4: Pilot** (Week 5-8)\n- Trial order placement\n- Quality inspection\n- Performance baseline\n\nI\'ve sent the initial documentation request to the contact email on file. Would you like to assign a supplier manager to oversee this onboarding?' }
    ]
  },
  {
    title: 'Supply chain disruption alert',
    category: 'risk',
    messages: [
      { role: 'user', content: 'What disruptions should I be aware of this week?' },
      { role: 'assistant', content: '🚨 **Active Disruption Alerts (Week of Jan 6)**\n\n**HIGH PRIORITY:**\n\n1. **Port Strike - US West Coast** 🔴\n   - Status: Ongoing negotiations\n   - Impact: 4 of your suppliers ship through LA/Long Beach\n   - Affected POs: 12 orders ($2.1M)\n   - Mitigation: Air freight quotes requested, East Coast rerouting evaluated\n\n2. **Factory Fire - Jiangsu Province** 🔴\n   - Supplier: Suzhou Electronics Co.\n   - Impact: 100% of your PCB assemblies from this facility\n   - ETA to resume: 3-4 weeks\n   - Mitigation: Activated secondary supplier, expedite fees apply\n\n**MEDIUM PRIORITY:**\n\n3. **Weather Delays - Northern Europe** 🟡\n   - Heavy snow affecting trucking in Germany/Poland\n   - Impact: 2-3 day delays on 6 shipments\n   - No action required - buffer stock sufficient\n\n4. **Currency Volatility - Japanese Yen** 🟡\n   - Yen weakened 4% this week\n   - Opportunity: Lock in favorable rates for Q2 orders\n\nWould you like to drill into any of these or see the full mitigation plans?' }
    ]
  },
  {
    title: 'Comparing logistics providers',
    category: 'suppliers',
    messages: [
      { role: 'user', content: 'Compare our top 3 logistics providers by performance' },
      { role: 'assistant', content: '**Logistics Provider Performance Comparison**\n\n| Metric | FedEx | DHL | UPS |\n|--------|-------|-----|-----|\n| On-Time Delivery | 94.2% | 91.8% | 93.5% |\n| Damage Rate | 0.3% | 0.5% | 0.4% |\n| Avg Transit Time | 2.4 days | 2.8 days | 2.5 days |\n| Cost per Shipment | $48.50 | $42.30 | $45.80 |\n| Claims Resolution | 4.2 days | 6.1 days | 5.3 days |\n| Your Spend (Q3) | $2.8M | $3.1M | $2.2M |\n\n**Analysis:**\n- **FedEx** leads in reliability but costs 15% more\n- **DHL** offers best pricing, acceptable performance for non-critical shipments\n- **UPS** balanced option, strong claims handling\n\n**Recommendation:** Shift non-urgent domestic shipments from FedEx to DHL for ~$180K annual savings while keeping FedEx for time-critical deliveries.\n\nWant me to model different allocation scenarios?' }
    ]
  }
];

async function seedConversations() {
  console.log('🌱 Seeding conversations...\n');

  for (const conv of SEED_CONVERSATIONS) {
    // Create conversation
    const [newConv] = await db.insert(conversations).values({
      visitorId: DEMO_VISITOR_ID,
      title: conv.title,
      category: conv.category,
    }).returning();

    console.log(`✓ Created: "${conv.title}"`);

    // Add messages with slight time offsets
    let timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last week
    
    for (const msg of conv.messages) {
      await db.insert(messages).values({
        conversationId: newConv.id,
        role: msg.role,
        content: msg.content,
        timestamp,
      });
      
      // Add 30 seconds to 2 minutes between messages
      timestamp = new Date(timestamp.getTime() + (30 + Math.random() * 90) * 1000);
    }
    
    console.log(`  └─ Added ${conv.messages.length} messages`);
  }

  console.log(`\n✅ Seeded ${SEED_CONVERSATIONS.length} conversations`);
  console.log(`\n📝 Use visitor ID: ${DEMO_VISITOR_ID} to view these conversations`);
}

seedConversations().catch(console.error);
