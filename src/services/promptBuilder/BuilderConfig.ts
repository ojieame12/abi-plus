// Guided Prompt Builder Configuration
// Rich, dynamic prompt building with seeded data

import type { IntentCategory, SubIntent } from '../../types/intents';
import type { WidgetType } from '../../types/widgets';

// ============================================
// SEEDED DATA - Portfolio Context
// ============================================

export const SEEDED_SUPPLIERS = [
  { id: 'sup-001', name: 'Taiwan Semiconductor (TSMC)', category: 'Electronics', region: 'Asia Pacific', riskLevel: 'medium' },
  { id: 'sup-002', name: 'Samsung Electronics', category: 'Electronics', region: 'Asia Pacific', riskLevel: 'low' },
  { id: 'sup-003', name: 'Foxconn Technology', category: 'Electronics', region: 'Asia Pacific', riskLevel: 'high' },
  { id: 'sup-004', name: 'Intel Corporation', category: 'Electronics', region: 'North America', riskLevel: 'low' },
  { id: 'sup-005', name: 'BHP Group', category: 'Raw Materials', region: 'Asia Pacific', riskLevel: 'medium' },
  { id: 'sup-006', name: 'Rio Tinto', category: 'Raw Materials', region: 'Europe', riskLevel: 'low' },
  { id: 'sup-007', name: 'Vale S.A.', category: 'Raw Materials', region: 'Latin America', riskLevel: 'high' },
  { id: 'sup-008', name: 'BASF SE', category: 'Chemicals', region: 'Europe', riskLevel: 'low' },
  { id: 'sup-009', name: 'Dow Chemical', category: 'Chemicals', region: 'North America', riskLevel: 'medium' },
  { id: 'sup-010', name: 'LG Chem', category: 'Chemicals', region: 'Asia Pacific', riskLevel: 'medium-high' },
  { id: 'sup-011', name: 'Maersk Line', category: 'Logistics', region: 'Europe', riskLevel: 'low' },
  { id: 'sup-012', name: 'FedEx Supply Chain', category: 'Logistics', region: 'North America', riskLevel: 'low' },
  { id: 'sup-013', name: 'Flex Ltd', category: 'Contract Manufacturing', region: 'North America', riskLevel: 'medium' },
  { id: 'sup-014', name: 'Jabil Inc', category: 'Contract Manufacturing', region: 'North America', riskLevel: 'medium' },
  { id: 'sup-015', name: 'Albemarle Corporation', category: 'Raw Materials', region: 'North America', riskLevel: 'medium-high' },
];

export const SEEDED_CATEGORIES = [
  { id: 'electronics', name: 'Electronics & Semiconductors', supplierCount: 4, avgRisk: 'medium' },
  { id: 'raw-materials', name: 'Raw Materials & Mining', supplierCount: 4, avgRisk: 'medium-high' },
  { id: 'chemicals', name: 'Chemicals & Materials', supplierCount: 3, avgRisk: 'medium' },
  { id: 'logistics', name: 'Logistics & Transportation', supplierCount: 2, avgRisk: 'low' },
  { id: 'manufacturing', name: 'Contract Manufacturing', supplierCount: 2, avgRisk: 'medium' },
];

export const SEEDED_REGIONS = [
  { id: 'north-america', name: 'North America', supplierCount: 6, avgRisk: 'low' },
  { id: 'europe', name: 'Europe', supplierCount: 3, avgRisk: 'low' },
  { id: 'asia-pacific', name: 'Asia Pacific', supplierCount: 5, avgRisk: 'medium-high' },
  { id: 'latin-america', name: 'Latin America', supplierCount: 1, avgRisk: 'high' },
];

export const SEEDED_COMMODITIES = [
  { id: 'copper', name: 'Copper', currentPrice: '$8,945/mt', change: '+2.3%' },
  { id: 'lithium', name: 'Lithium Carbonate', currentPrice: '$13,200/mt', change: '-5.1%' },
  { id: 'aluminum', name: 'Aluminum', currentPrice: '$2,380/mt', change: '+1.2%' },
  { id: 'rare-earth', name: 'Rare Earth Elements', currentPrice: 'Index: 142', change: '+8.4%' },
  { id: 'steel', name: 'Steel HRC', currentPrice: '$680/mt', change: '-0.8%' },
  { id: 'silicon', name: 'Polysilicon', currentPrice: '$7.20/kg', change: '+3.2%' },
];

export const SEEDED_TIMEFRAMES = [
  { id: '7d', name: 'Last 7 days' },
  { id: '30d', name: 'Last 30 days' },
  { id: '90d', name: 'Last quarter' },
  { id: 'ytd', name: 'Year to date' },
  { id: '1y', name: 'Last 12 months' },
];

export const SEEDED_RISK_LEVELS = [
  { id: 'high', name: 'High Risk', color: 'red' },
  { id: 'medium-high', name: 'Medium-High Risk', color: 'orange' },
  { id: 'medium', name: 'Medium Risk', color: 'yellow' },
  { id: 'low', name: 'Low Risk', color: 'green' },
];

// ============================================
// BUILDER TYPES
// ============================================

export type BuilderDomain = 'risk' | 'market' | 'suppliers' | 'actions';

export interface BuilderSelection {
  domain: BuilderDomain | null;
  subject: string | null;
  action: string | null;
  modifiers: Record<string, string>;
}

export interface BuilderOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface InputConfig {
  id: string;
  type: 'select' | 'text' | 'multi-select';
  label: string;
  placeholder?: string;
  options?: { id: string; name: string }[];
  dataSource?: 'suppliers' | 'categories' | 'regions' | 'commodities' | 'timeframes' | 'risk_levels';
  required?: boolean;
}

export interface ActionConfig extends BuilderOption {
  inputs?: InputConfig[];
  promptTemplate: string;
}

// ============================================
// LEVEL 1: DOMAINS
// ============================================

export const BUILDER_DOMAINS: BuilderOption[] = [
  { id: 'risk', label: 'Risk', icon: 'shield', description: 'Portfolio risk & exposure analysis' },
  { id: 'market', label: 'Market', icon: 'trending-up', description: 'Prices, news & industry trends' },
  { id: 'suppliers', label: 'Suppliers', icon: 'building', description: 'Supplier analysis & discovery' },
  { id: 'actions', label: 'Actions', icon: 'zap', description: 'Reports, alerts & workflows' },
];

// ============================================
// LEVEL 2: SUBJECTS
// ============================================

export const BUILDER_SUBJECTS: Record<BuilderDomain, BuilderOption[]> = {
  risk: [
    { id: 'portfolio-health', label: 'Portfolio Health', description: 'Overall risk posture' },
    { id: 'exposure-analysis', label: 'Exposure Analysis', description: 'Spend at risk' },
    { id: 'risk-changes', label: 'Risk Changes', description: 'Score movements' },
    { id: 'concentration', label: 'Concentration Risk', description: 'Dependency analysis' },
  ],
  market: [
    { id: 'commodity-prices', label: 'Commodity Prices', description: 'Price tracking & forecasts' },
    { id: 'industry-news', label: 'Industry News', description: 'Market developments' },
    { id: 'disruptions', label: 'Disruptions', description: 'Supply chain events' },
    { id: 'geopolitical', label: 'Geopolitical', description: 'Regional risks & trade' },
  ],
  suppliers: [
    { id: 'deep-dive', label: 'Deep Dive', description: 'Single supplier analysis' },
    { id: 'compare', label: 'Compare', description: 'Side-by-side evaluation' },
    { id: 'discover', label: 'Discover', description: 'Find & filter suppliers' },
    { id: 'alternatives', label: 'Alternatives', description: 'Replacement options' },
  ],
  actions: [
    { id: 'executive-report', label: 'Executive Report', description: 'Leadership summaries' },
    { id: 'alerts', label: 'Alerts', description: 'Monitoring & notifications' },
    { id: 'mitigation', label: 'Mitigation Plan', description: 'Risk reduction strategies' },
    { id: 'export', label: 'Export Data', description: 'Download & share' },
  ],
};

// ============================================
// LEVEL 3: ACTIONS WITH INPUTS & RICH PROMPTS
// ============================================

export const BUILDER_ACTIONS: Record<string, ActionConfig[]> = {
  // ========== RISK DOMAIN ==========
  'risk:portfolio-health': [
    {
      id: 'executive-summary',
      label: 'Executive Summary',
      description: 'Board-ready overview',
      promptTemplate: `Provide a comprehensive executive summary of my supplier risk portfolio suitable for board presentation. Include:

1. **Portfolio Overview**: Total suppliers monitored, total spend under management, and overall risk distribution
2. **Key Risk Metrics**: Average portfolio risk score, trend vs last quarter, and benchmark against industry
3. **Critical Concerns**: Top 3-5 issues requiring leadership attention, with specific supplier names and risk factors
4. **Recent Changes**: Significant risk movements in the past 30 days with root cause analysis
5. **Wins & Improvements**: Any suppliers that improved or risks that were successfully mitigated
6. **Recommended Actions**: Prioritized list of decisions or approvals needed from leadership

Format this as a structured briefing I can present in 5 minutes.`,
    },
    {
      id: 'risk-distribution',
      label: 'Risk Distribution',
      description: 'Breakdown by tier',
      promptTemplate: `Analyze my portfolio risk distribution in detail. Show me:

1. **Distribution Breakdown**: Number and percentage of suppliers in each risk tier (Critical, High, Medium-High, Medium, Low)
2. **Spend Alignment**: How spend is distributed across risk tiers - highlight any misalignment where high spend correlates with high risk
3. **Category Patterns**: Which procurement categories have the highest concentration of risky suppliers
4. **Geographic Patterns**: Regional distribution of risk, identifying any geographic clusters of concern
5. **Trend Analysis**: How has this distribution shifted over the past 6 months? Are we getting riskier or safer?
6. **Peer Comparison**: How does my risk distribution compare to industry benchmarks?

Include specific supplier names in each tier and actionable insights for rebalancing the portfolio.`,
    },
    {
      id: 'health-scorecard',
      label: 'Health Scorecard',
      description: 'KPIs and metrics',
      inputs: [
        { id: 'timeframe', type: 'select', label: 'Period', dataSource: 'timeframes', required: true },
      ],
      promptTemplate: `Generate a detailed portfolio health scorecard for {{timeframe}}. Include:

1. **Overall Health Score**: Composite score (0-100) with breakdown of contributing factors
2. **Key Performance Indicators**:
   - Supplier Risk Index (weighted average)
   - Risk-Adjusted Spend Ratio
   - Supplier Diversification Score
   - Geographic Risk Balance
   - Single-Source Dependency Rate
3. **Trend Indicators**: Direction and velocity of change for each KPI
4. **Red Flags**: Any metrics that breached thresholds or require immediate attention
5. **Comparison**: Period-over-period comparison showing improvement or decline areas
6. **Action Items**: Specific steps to improve underperforming metrics

Present this as a dashboard-style scorecard with clear visual hierarchy.`,
    },
  ],

  'risk:exposure-analysis': [
    {
      id: 'spend-at-risk',
      label: 'Spend at Risk',
      description: 'Dollar exposure analysis',
      promptTemplate: `Perform a comprehensive spend-at-risk analysis of my supplier portfolio. Detail:

1. **Total Exposure Summary**:
   - Total spend at elevated risk (Medium-High and above)
   - Percentage of total portfolio spend this represents
   - Dollar-weighted average risk score

2. **Tier Breakdown**:
   - Critical Risk (80+): $X across N suppliers - LIST EACH
   - High Risk (60-79): $X across N suppliers - TOP 5
   - Medium-High (45-59): $X across N suppliers - TOP 5

3. **Concentration Alerts**:
   - Any single supplier representing >10% of at-risk spend
   - Categories where >40% of spend is with risky suppliers

4. **Trend Analysis**: How has spend-at-risk changed over past 6 months?

5. **Scenario Modeling**:
   - If top 3 high-risk suppliers failed, what's the impact?
   - What would it cost to shift spend to lower-risk alternatives?

6. **Recommendations**: Prioritized actions to reduce exposure, with estimated risk reduction.`,
    },
    {
      id: 'category-exposure',
      label: 'Category Exposure',
      description: 'Risk by category',
      inputs: [
        { id: 'category', type: 'select', label: 'Category', dataSource: 'categories', required: false },
      ],
      promptTemplate: `Analyze spend exposure and risk concentration {{#category}}specifically for {{category}}{{/category}}{{^category}}across all procurement categories{{/category}}. Include:

1. **Category Risk Profile**:
   - Total spend and supplier count per category
   - Average risk score and distribution within each
   - Category-specific risk factors (commodity volatility, geopolitical, etc.)

2. **Hot Spots**: Categories with concerning risk profiles:
   - High average risk scores
   - Limited supplier diversity
   - Critical single-source dependencies

3. **Deep Dive on Top Concerns**: For the 2-3 most concerning categories:
   - Named suppliers and their specific issues
   - Alternative supplier availability
   - Switching cost estimates

4. **Category Comparison Matrix**: Side-by-side view of all categories by risk metrics

5. **Strategic Recommendations**: Category-level strategies for risk reduction.`,
    },
    {
      id: 'regional-exposure',
      label: 'Regional Exposure',
      description: 'Geographic risk analysis',
      inputs: [
        { id: 'region', type: 'select', label: 'Region', dataSource: 'regions', required: false },
      ],
      promptTemplate: `Analyze my geographic risk exposure {{#region}}with focus on {{region}}{{/region}}{{^region}}across all regions{{/region}}. Provide:

1. **Regional Distribution**:
   - Spend and supplier count by region
   - Risk score averages by geography
   - Map of concentration hotspots

2. **Geopolitical Risk Factors**:
   - Trade policy risks (tariffs, sanctions, restrictions)
   - Political stability concerns
   - Currency and economic volatility
   - Natural disaster exposure

3. **Regional Deep Dives**: For high-exposure regions:
   - Key suppliers and their criticality
   - Alternative sourcing options in other regions
   - Lead time and cost implications of regional shifts

4. **Diversification Analysis**:
   - Current geographic concentration score
   - Recommendations for better regional balance
   - Specific suppliers that could be multi-sourced

5. **Scenario Planning**: Impact analysis if a major region becomes inaccessible.`,
    },
  ],

  'risk:risk-changes': [
    {
      id: 'recent-changes',
      label: 'Recent Changes',
      description: 'Score movements',
      inputs: [
        { id: 'timeframe', type: 'select', label: 'Period', dataSource: 'timeframes', required: true },
      ],
      promptTemplate: `Identify and analyze all significant supplier risk changes in {{timeframe}}. Report:

1. **Summary Statistics**:
   - Total suppliers with score changes >5 points
   - Net portfolio risk movement (improving vs declining)
   - Most volatile suppliers

2. **Deteriorations (Worsening Risk)** - For EACH supplier that got riskier:
   - Supplier name and new vs old score
   - Root cause: What specific factors drove the change?
   - Severity: Is this temporary or structural?
   - Impact: What's our exposure to this supplier?
   - Action Required: Monitor, engage, or escalate?

3. **Improvements** - Suppliers that got safer:
   - What drove the improvement?
   - Can we increase business with them?

4. **Watchlist Updates**: Suppliers approaching concerning thresholds

5. **Pattern Analysis**: Any systemic factors driving multiple changes (market conditions, regional issues)?

6. **Recommended Responses**: Prioritized action list based on exposure and severity.`,
    },
    {
      id: 'score-investigation',
      label: 'Investigate Score',
      description: 'Why did it change?',
      inputs: [
        { id: 'supplier', type: 'select', label: 'Supplier', dataSource: 'suppliers', required: true },
        { id: 'timeframe', type: 'select', label: 'Period', dataSource: 'timeframes', required: true },
      ],
      promptTemplate: `Conduct a detailed investigation into {{supplier}}'s risk score changes over {{timeframe}}. Analyze:

1. **Score Timeline**: Chart the score movement with key inflection points dated

2. **Factor-by-Factor Breakdown**:
   - Financial Health: Credit rating, liquidity, profitability changes
   - Operational Risk: Quality incidents, delivery performance, capacity issues
   - Compliance: Regulatory issues, certifications, audit findings
   - ESG: Environmental incidents, labor issues, governance concerns
   - External: Market conditions, geopolitical factors, industry trends

3. **Root Cause Analysis**: What specifically triggered the change?
   - Was it a single event or gradual decline?
   - Internal to supplier or external market factors?
   - Are peer suppliers seeing similar changes?

4. **News & Events**: Recent headlines or filings that correlate with score changes

5. **Forward Outlook**: Is this likely to continue, stabilize, or reverse?

6. **Recommended Response**: Specific actions based on findings.`,
    },
  ],

  'risk:concentration': [
    {
      id: 'single-source',
      label: 'Single Source Risk',
      description: 'Critical dependencies',
      promptTemplate: `Identify and analyze all single-source dependencies in my portfolio. Report:

1. **Critical Single Sources**: Suppliers where they are my ONLY option for a component/service:
   - Supplier name and what they provide
   - Annual spend and contract status
   - Current risk score and trend
   - Why single-sourced (technical, contractual, market)

2. **Risk Assessment for Each**:
   - What happens if they fail? Business impact assessment
   - Lead time to qualify alternative
   - Estimated switching cost

3. **Near Single Sources**: Where I have 2 suppliers but one is >80% of volume

4. **Qualification Pipeline**: Alternatives currently being qualified

5. **Strategic Recommendations**:
   - Priority ranking for diversification efforts
   - Quick wins vs long-term qualification needs
   - Budget implications for multi-sourcing

6. **Action Plan**: Specific next steps with timelines.`,
    },
    {
      id: 'concentration-analysis',
      label: 'Full Analysis',
      description: 'All concentration risks',
      promptTemplate: `Perform a comprehensive concentration risk analysis across all dimensions:

1. **Supplier Concentration**:
   - Top 10 suppliers by spend - what % of total do they represent?
   - Herfindahl-Hirschman Index (HHI) for supplier diversity
   - Any supplier >15% of total spend (flag as critical)

2. **Category Concentration**:
   - Spend distribution across categories
   - Categories with <3 qualified suppliers

3. **Geographic Concentration**:
   - Regional spend distribution
   - Country-level exposures >20% of total
   - Port/logistics chokepoint dependencies

4. **Tier Concentration**:
   - Visibility into Tier 2/3 suppliers
   - Known shared sub-suppliers across my Tier 1s

5. **Temporal Concentration**:
   - Contract renewal clustering
   - Seasonal dependency patterns

6. **Risk Correlation**:
   - Suppliers that would be affected by the same disruption events
   - Correlated risk factors across the portfolio

7. **Diversification Roadmap**: Phased plan to reduce concentration risk.`,
    },
  ],

  // ========== MARKET DOMAIN ==========
  'market:commodity-prices': [
    {
      id: 'price-impact',
      label: 'Price Impact Analysis',
      description: 'How prices affect my suppliers',
      inputs: [
        { id: 'commodity', type: 'select', label: 'Commodity', dataSource: 'commodities', required: true },
      ],
      promptTemplate: `Analyze how {{commodity}} price movements impact my supplier portfolio:

1. **Current Market Status**:
   - Current price and recent trend (30/90/365 day)
   - Key price drivers (supply/demand dynamics, geopolitical, seasonal)
   - Analyst consensus on near-term direction

2. **Portfolio Exposure**:
   - Which of my suppliers are significantly exposed to {{commodity}}?
   - Estimated commodity cost as % of their COGS
   - Pass-through mechanisms in our contracts

3. **Supplier-Specific Impact**:
   For each exposed supplier:
   - Their hedging position if known
   - Historical response to price spikes
   - Contract price adjustment clauses

4. **Scenario Analysis**:
   - If {{commodity}} increases 20%, what's the impact on my costs?
   - Which suppliers would be most stressed?
   - Risk of supply disruption at various price points

5. **Mitigation Strategies**:
   - Contract renegotiation opportunities
   - Alternative materials or suppliers
   - Hedging or forward buying options

6. **Monitoring Setup**: Key indicators to watch.`,
    },
    {
      id: 'price-forecast',
      label: 'Price Outlook',
      description: 'Forecasts and trends',
      inputs: [
        { id: 'commodity', type: 'select', label: 'Commodity', dataSource: 'commodities', required: true },
      ],
      promptTemplate: `Provide a comprehensive price outlook for {{commodity}}:

1. **Current State**:
   - Spot price and recent volatility
   - Futures curve shape (contango/backwardation)
   - Inventory levels and supply/demand balance

2. **Price Drivers Analysis**:
   - Supply side: Production capacity, disruptions, new projects
   - Demand side: End-market growth, substitution trends
   - Macro factors: Currency, trade policy, energy costs
   - ESG factors: Decarbonization impact, regulatory changes

3. **Forecast Summary**:
   - 3-month outlook with confidence range
   - 12-month outlook with scenarios
   - Key catalysts that could shift the outlook

4. **Risk Scenarios**:
   - Bull case: What would cause prices to spike?
   - Bear case: What would cause prices to crash?
   - Probability-weighted expected value

5. **Procurement Implications**:
   - Optimal buying strategy given outlook
   - Timing recommendations for major purchases
   - Hedging considerations.`,
    },
  ],

  'market:industry-news': [
    {
      id: 'market-briefing',
      label: 'Market Briefing',
      description: 'Latest developments',
      inputs: [
        { id: 'category', type: 'select', label: 'Industry', dataSource: 'categories', required: false },
      ],
      promptTemplate: `Provide a comprehensive market briefing {{#category}}for the {{category}} industry{{/category}}{{^category}}across my key supply markets{{/category}}:

1. **Headlines This Week**: Top 5 news items affecting supply chains with relevance to my portfolio

2. **Market Dynamics**:
   - Supply/demand balance shifts
   - Capacity announcements (expansions, closures)
   - M&A activity affecting supplier landscape
   - Technology disruptions emerging

3. **Regulatory & Policy**:
   - New regulations affecting supply chains
   - Trade policy changes
   - Tariff updates and implications

4. **Company-Specific News**: Any news about MY specific suppliers

5. **Emerging Risks**: Early warning signals to monitor

6. **Opportunities**: Favorable market conditions to capitalize on

7. **Recommended Actions**: What should I do based on this intelligence?`,
    },
    {
      id: 'supplier-news',
      label: 'Supplier News',
      description: 'News about specific supplier',
      inputs: [
        { id: 'supplier', type: 'select', label: 'Supplier', dataSource: 'suppliers', required: true },
      ],
      promptTemplate: `Compile all relevant recent news and developments for {{supplier}}:

1. **Recent Headlines**: All news mentions in past 30 days with sentiment analysis

2. **Financial News**:
   - Earnings reports and analyst reactions
   - Credit rating changes
   - Funding/debt announcements
   - Stock performance context

3. **Operational News**:
   - Facility announcements (new plants, closures, expansions)
   - Product launches or discontinuations
   - Quality or safety incidents
   - Labor relations developments

4. **Strategic News**:
   - Leadership changes
   - M&A activity
   - Partnership announcements
   - Strategic pivots

5. **ESG & Reputation**:
   - Environmental incidents or initiatives
   - Social/labor controversies
   - Governance concerns

6. **Risk Implications**: How does this news affect their risk profile and my relationship?

7. **Suggested Actions**: Engagement or monitoring recommendations.`,
    },
  ],

  'market:disruptions': [
    {
      id: 'active-disruptions',
      label: 'Active Disruptions',
      description: 'Current events',
      promptTemplate: `Report on all active supply chain disruptions affecting or potentially affecting my portfolio:

1. **Active Disruptions Summary**:
   For each current event:
   - Event type and location
   - Start date and expected duration
   - Affected industries/commodities
   - Current status and trajectory

2. **Direct Portfolio Impact**:
   - Which of MY suppliers are affected?
   - Products/components at risk
   - Estimated lead time impact
   - Financial exposure

3. **Indirect Risks**:
   - Tier 2/3 exposure if known
   - Logistics/shipping impacts
   - Secondary effects (price spikes, shortages)

4. **Response Status**:
   - Actions already taken
   - Supplier communication status
   - Alternative sourcing activated

5. **Emerging Threats**: Events developing that could become disruptions

6. **Recommended Actions**: Priority response actions for each disruption.`,
    },
    {
      id: 'disruption-scenario',
      label: 'Scenario Planning',
      description: 'What-if analysis',
      inputs: [
        { id: 'region', type: 'select', label: 'Region', dataSource: 'regions', required: true },
      ],
      promptTemplate: `Model the impact of a major supply disruption in {{region}}:

1. **Scenario Definition**:
   - Type of disruption (natural disaster, geopolitical, pandemic)
   - Assumed duration: 2 weeks / 2 months / 6 months
   - Assumed scope of impact

2. **Direct Supplier Impact**:
   - Suppliers in {{region}}: Full list with criticality rating
   - Which would be unable to deliver?
   - Lead time to alternative sources

3. **Financial Impact Modeling**:
   - Revenue at risk from supply shortage
   - Expedited shipping cost estimates
   - Alternative sourcing premium costs

4. **Operational Impact**:
   - Production lines affected
   - Customer commitments at risk
   - Inventory runway by affected product

5. **Mitigation Options**:
   - Pre-positioned alternatives
   - Emergency inventory strategy
   - Contract provisions (force majeure)

6. **Preparedness Gaps**: What do we need to put in place before this happens?

7. **Action Items**: Concrete steps to improve resilience.`,
    },
  ],

  'market:geopolitical': [
    {
      id: 'regional-risks',
      label: 'Regional Risks',
      description: 'Geopolitical analysis',
      inputs: [
        { id: 'region', type: 'select', label: 'Region', dataSource: 'regions', required: true },
      ],
      promptTemplate: `Provide a comprehensive geopolitical risk assessment for my exposure to {{region}}:

1. **Current Geopolitical Climate**:
   - Political stability assessment
   - Key events/elections on the horizon
   - Government policy direction affecting business

2. **Trade & Regulatory Environment**:
   - Current tariff structure affecting my goods
   - Trade agreement status and trends
   - Export control / sanctions risks
   - Local content requirements

3. **Economic Factors**:
   - Currency stability and forecast
   - Inflation and cost environment
   - Labor market conditions

4. **My Exposure in {{region}}**:
   - Suppliers located there: List with spend
   - Alternative sourcing availability
   - Contract terms addressing geopolitical risk

5. **Risk Scenarios**:
   - Escalation scenario: What could make things worse?
   - De-escalation scenario: What could improve conditions?
   - Probability-weighted impact assessment

6. **Recommended Strategy**: Stay, reduce, or exit - with rationale and timeline.`,
    },
  ],

  // ========== SUPPLIERS DOMAIN ==========
  'suppliers:deep-dive': [
    {
      id: 'full-profile',
      label: 'Full Profile',
      description: 'Comprehensive analysis',
      inputs: [
        { id: 'supplier', type: 'select', label: 'Supplier', dataSource: 'suppliers', required: true },
      ],
      promptTemplate: `Provide a comprehensive 360-degree profile of {{supplier}}:

1. **Company Overview**:
   - Business description and history
   - Ownership structure and financials
   - Key facilities and geographic footprint
   - Strategic direction and recent developments

2. **Our Relationship**:
   - Annual spend and trend
   - Products/services we procure
   - Contract status and key terms
   - Relationship tenure and history

3. **Risk Profile Deep Dive**:
   - Current SRS score and tier
   - Score trend over past 12 months
   - Factor-by-factor breakdown:
     * Financial health (with specific metrics)
     * Operational performance (quality, delivery)
     * Compliance status (certs, audits)
     * ESG performance
     * External risk factors

4. **Performance Metrics**:
   - On-time delivery rate
   - Quality metrics (PPM, escapes)
   - Responsiveness scores
   - Innovation contribution

5. **Competitive Position**:
   - Their market position
   - Key competitors
   - Technology/capability differentiation

6. **SWOT Summary**: Strengths, weaknesses, opportunities, threats

7. **Relationship Recommendations**: Actions to optimize this supplier relationship.`,
    },
    {
      id: 'risk-factors',
      label: 'Risk Factors',
      description: 'What drives their risk',
      inputs: [
        { id: 'supplier', type: 'select', label: 'Supplier', dataSource: 'suppliers', required: true },
      ],
      promptTemplate: `Provide a detailed breakdown of risk factors for {{supplier}}:

1. **Risk Score Composition**:
   - Overall score and tier
   - Factor weights and individual scores
   - Which factors are dragging score up/down

2. **Financial Risk Deep Dive**:
   - Revenue and profitability trends
   - Debt levels and coverage ratios
   - Cash flow and liquidity position
   - Credit rating and recent changes
   - Altman Z-score or equivalent

3. **Operational Risk Assessment**:
   - Capacity utilization and constraints
   - Quality track record
   - Delivery performance history
   - Key operational dependencies
   - Business continuity preparedness

4. **Compliance & Regulatory**:
   - Certification status (ISO, industry-specific)
   - Recent audit findings
   - Regulatory exposure and compliance history

5. **ESG Risk Profile**:
   - Environmental: Carbon footprint, incidents, initiatives
   - Social: Labor practices, community relations
   - Governance: Board structure, ethics history

6. **External Risk Factors**:
   - Geographic risks
   - Market/industry headwinds
   - Customer concentration

7. **Risk Trajectory**: Where is this heading and what are leading indicators?

8. **Mitigation Recommendations**: Actions to manage identified risks.`,
    },
  ],

  'suppliers:compare': [
    {
      id: 'side-by-side',
      label: 'Side by Side',
      description: 'Compare two suppliers',
      inputs: [
        { id: 'supplier1', type: 'select', label: 'First Supplier', dataSource: 'suppliers', required: true },
        { id: 'supplier2', type: 'select', label: 'Second Supplier', dataSource: 'suppliers', required: true },
      ],
      promptTemplate: `Provide a detailed side-by-side comparison of {{supplier1}} vs {{supplier2}}:

1. **Overview Comparison**:
   | Dimension | {{supplier1}} | {{supplier2}} |
   - Company size and scale
   - Geographic footprint
   - Years in business
   - Our spend with each

2. **Risk Profile Comparison**:
   - Overall risk score
   - Risk tier and trajectory
   - Each risk factor head-to-head
   - Key risk differentiators

3. **Performance Comparison**:
   - On-time delivery rate
   - Quality metrics
   - Responsiveness
   - Innovation

4. **Commercial Comparison**:
   - Pricing competitiveness
   - Payment terms
   - Contract flexibility
   - Total cost of ownership

5. **Capability Comparison**:
   - Technical capabilities
   - Capacity availability
   - Geographic coverage
   - Value-added services

6. **Strategic Fit**:
   - Alignment with our needs
   - Partnership potential
   - Long-term viability

7. **Winner by Category**: Clear recommendation with rationale

8. **Recommendation**: Which to prefer for what scenarios?`,
    },
  ],

  'suppliers:discover': [
    {
      id: 'high-risk-list',
      label: 'High Risk Suppliers',
      description: 'Suppliers needing attention',
      inputs: [
        { id: 'riskLevel', type: 'select', label: 'Minimum Risk Level', dataSource: 'risk_levels', required: true },
      ],
      promptTemplate: `Identify and analyze all suppliers at {{riskLevel}} level or above:

1. **Summary**: Count and total spend with suppliers at/above {{riskLevel}}

2. **Detailed List**: For EACH supplier:
   - Supplier name and risk score
   - Risk tier and trend direction
   - Primary risk factors driving the score
   - Our annual spend and dependency level
   - Contract status and exit options

3. **Priority Ranking**: Ordered by combination of risk and exposure

4. **Root Cause Patterns**: Common themes across high-risk suppliers

5. **Action Framework**:
   For each supplier, recommend one of:
   - Monitor: Low exposure, manageable risk
   - Engage: Work with supplier to address issues
   - Dual-source: Qualify alternative to reduce dependency
   - Exit: Risk unacceptable, begin transition

6. **Quick Wins**: Suppliers where risk could be quickly reduced

7. **30-60-90 Day Action Plan**: Prioritized intervention roadmap.`,
    },
    {
      id: 'category-suppliers',
      label: 'By Category',
      description: 'Suppliers in category',
      inputs: [
        { id: 'category', type: 'select', label: 'Category', dataSource: 'categories', required: true },
      ],
      promptTemplate: `Provide a comprehensive analysis of my {{category}} supplier base:

1. **Category Overview**:
   - Total spend in {{category}}
   - Number of active suppliers
   - Category risk profile vs portfolio average

2. **Supplier Landscape**:
   Full list with:
   - Supplier name
   - Annual spend and % of category
   - Risk score and tier
   - Key products/services from each
   - Contract status

3. **Risk Distribution**: How risk is distributed within this category

4. **Concentration Analysis**:
   - Top supplier share
   - Single-source situations
   - Geographic concentration

5. **Performance Ranking**: Best to worst by quality, delivery, cost

6. **Gap Analysis**:
   - Capabilities missing from current supplier base
   - Capacity constraints
   - Innovation gaps

7. **Market Context**: How does my supplier base compare to available market?

8. **Optimization Recommendations**: Actions to improve the {{category}} supplier portfolio.`,
    },
    {
      id: 'regional-suppliers',
      label: 'By Region',
      description: 'Suppliers in region',
      inputs: [
        { id: 'region', type: 'select', label: 'Region', dataSource: 'regions', required: true },
      ],
      promptTemplate: `Analyze my supplier presence and exposure in {{region}}:

1. **Regional Overview**:
   - Total spend in {{region}}
   - Number of suppliers
   - Regional risk profile

2. **Supplier List**:
   All suppliers in {{region}} with:
   - Company name and location (city/country)
   - Category and products supplied
   - Annual spend
   - Risk score and key factors
   - Criticality rating

3. **Regional Risk Assessment**:
   - Geopolitical factors
   - Economic conditions
   - Infrastructure reliability
   - Regulatory environment

4. **Concentration Concerns**:
   - Categories over-exposed to {{region}}
   - Single points of failure
   - Logistics dependencies

5. **Alternative Sourcing**:
   - Which suppliers could be multi-sourced?
   - Alternative regions for each category
   - Qualification status of alternatives

6. **Strategic Recommendations**: Optimal regional footprint for my needs.`,
    },
  ],

  'suppliers:alternatives': [
    {
      id: 'find-alternatives',
      label: 'Find Alternatives',
      description: 'Replacement options',
      inputs: [
        { id: 'supplier', type: 'select', label: 'For Supplier', dataSource: 'suppliers', required: true },
      ],
      promptTemplate: `Identify and evaluate alternative suppliers to {{supplier}}:

1. **Current State**:
   - What we procure from {{supplier}}
   - Annual spend and contract terms
   - Why we're seeking alternatives (risk, cost, performance, diversification)

2. **Requirements Definition**:
   - Technical requirements
   - Capacity needs
   - Geographic preferences
   - Certification requirements

3. **Alternative Candidates**:
   For each potential alternative:
   - Company name and overview
   - Relevant capabilities
   - Current risk score comparison
   - Estimated pricing vs incumbent
   - Pros and cons
   - Qualification complexity (timeline, cost)

4. **Comparison Matrix**: Side-by-side of top 3-5 alternatives vs {{supplier}}

5. **Switching Analysis**:
   - One-time switching costs
   - Qualification timeline
   - Risks during transition
   - Performance during ramp

6. **Recommendation**: Best alternative(s) with rationale

7. **Transition Roadmap**: Steps to qualify and onboard recommended alternative.`,
    },
  ],

  // ========== ACTIONS DOMAIN ==========
  'actions:executive-report': [
    {
      id: 'board-summary',
      label: 'Board Summary',
      description: 'Leadership briefing',
      inputs: [
        { id: 'timeframe', type: 'select', label: 'Period', dataSource: 'timeframes', required: true },
      ],
      promptTemplate: `Generate a board-ready executive summary of supply chain risk for {{timeframe}}:

**EXECUTIVE SUMMARY: Supply Chain Risk Report**
**Period: {{timeframe}}**

1. **Dashboard Metrics** (visual-ready):
   - Overall Portfolio Risk Score: X/100 (↑↓ vs prior period)
   - Spend at Risk: $XM (X% of total)
   - High-Risk Suppliers: N (change vs prior)
   - Active Disruptions: N

2. **Key Takeaways** (3 bullets for executive attention):
   - Most important positive development
   - Most important concern
   - Key decision needed

3. **Portfolio Status**:
   - Risk distribution summary
   - Significant changes in period
   - Emerging risks identified

4. **Notable Incidents**: Any material events requiring awareness

5. **Actions Taken**: Summary of risk mitigation activities

6. **Recommendations Requiring Approval**:
   - Budget requests
   - Strategy changes
   - Supplier exits/additions

7. **Outlook**: Key risks and opportunities looking ahead

Format for 5-minute verbal presentation with visual aids.`,
    },
    {
      id: 'category-report',
      label: 'Category Report',
      description: 'Category-specific report',
      inputs: [
        { id: 'category', type: 'select', label: 'Category', dataSource: 'categories', required: true },
        { id: 'timeframe', type: 'select', label: 'Period', dataSource: 'timeframes', required: true },
      ],
      promptTemplate: `Generate a detailed category report for {{category}} covering {{timeframe}}:

**CATEGORY REPORT: {{category}}**
**Period: {{timeframe}}**

1. **Category Summary**:
   - Total spend: $XM
   - Active suppliers: N
   - Avg risk score: X (vs portfolio avg)

2. **Supplier Performance Matrix**:
   | Supplier | Spend | Risk | Quality | Delivery | Trend |
   (Include all suppliers in category)

3. **Risk Analysis**:
   - Category-specific risk factors
   - Suppliers of concern
   - Risk trend in period

4. **Market Conditions**:
   - Supply/demand dynamics
   - Pricing trends
   - Capacity situation

5. **Performance Highlights**:
   - Best performers
   - Improvement opportunities
   - SLA compliance summary

6. **Strategic Initiatives**:
   - Active projects
   - Upcoming renewals
   - Qualification pipeline

7. **Recommendations**: Actions for next period

8. **Appendix**: Detailed supplier scorecards.`,
    },
  ],

  'actions:alerts': [
    {
      id: 'setup-alerts',
      label: 'Configure Alerts',
      description: 'Set up monitoring',
      promptTemplate: `Help me configure comprehensive supplier risk alerts:

1. **Recommended Alert Configuration**:

   **Score-Based Alerts**:
   - Any supplier crosses into High Risk (>70): Immediate
   - Any supplier score increases >10 points in 30 days: Same day
   - Portfolio average risk increases >5 points: Weekly digest

   **Financial Alerts**:
   - Credit rating downgrade: Immediate
   - Negative earnings surprise: Same day
   - Bankruptcy/restructuring news: Immediate

   **Operational Alerts**:
   - Quality incident reported: Same day
   - Facility disruption: Immediate
   - Key personnel departure: Weekly digest

   **Market Alerts**:
   - Commodity price move >10%: Same day
   - Geopolitical event in supplier region: Same day
   - Regulatory change affecting suppliers: Weekly digest

2. **Current Gaps**: What should I be monitoring that I'm not?

3. **Recommended Frequency**: Daily digest vs real-time by alert type

4. **Escalation Matrix**: Who gets what alerts

5. **Implementation**: Help me set these up now.`,
    },
    {
      id: 'view-alerts',
      label: 'View Active Alerts',
      description: 'Current notifications',
      promptTemplate: `Show me all active alerts and notifications requiring attention:

1. **Critical Alerts** (Immediate action required):
   - Alert type and trigger
   - Affected supplier(s)
   - Triggered date/time
   - Current status
   - Recommended action

2. **Warning Alerts** (Review within 48 hours):
   - Full list with details
   - Priority ranking

3. **Informational** (For awareness):
   - Digest of lower-priority items

4. **Alert History**: What's been resolved recently?

5. **Alert Effectiveness**: Are my alert thresholds calibrated well?

6. **Recommendations**: Alerts I should acknowledge, investigate, or escalate.`,
    },
  ],

  'actions:mitigation': [
    {
      id: 'mitigation-plan',
      label: 'Create Plan',
      description: 'Risk reduction strategy',
      inputs: [
        { id: 'supplier', type: 'select', label: 'For Supplier', dataSource: 'suppliers', required: false },
      ],
      promptTemplate: `Develop a comprehensive risk mitigation plan {{#supplier}}for {{supplier}}{{/supplier}}{{^supplier}}for my highest-risk suppliers{{/supplier}}:

1. **Risk Assessment Summary**:
   - Current risk profile
   - Key risk factors to address
   - Urgency and exposure level

2. **Mitigation Strategies**:

   **Immediate Actions** (0-30 days):
   - Specific actions with owners
   - Quick wins to reduce exposure
   - Communication plan

   **Short-term** (30-90 days):
   - Alternative qualification activities
   - Contract renegotiation items
   - Inventory buffer adjustments

   **Medium-term** (90-180 days):
   - Structural changes to supplier base
   - Dual-sourcing implementation
   - Technology/process improvements

3. **Resource Requirements**:
   - Budget needed
   - Personnel/time investment
   - External support required

4. **Risk Reduction Targets**:
   - Measurable goals
   - Timeline for achievement
   - Leading indicators to track

5. **Contingency Plans**: If mitigation fails, what's Plan B?

6. **Governance**: Review cadence and decision rights

7. **Implementation Roadmap**: Week-by-week action plan.`,
    },
  ],

  'actions:export': [
    {
      id: 'export-portfolio',
      label: 'Portfolio Export',
      description: 'Download full data',
      promptTemplate: `Prepare a comprehensive portfolio data export:

1. **Export Contents**:
   - Full supplier list with all attributes
   - Current risk scores and factors
   - Spend data by supplier
   - Performance metrics
   - Contract summary data

2. **Format Options**:
   - Excel workbook with multiple tabs
   - CSV files (one per data type)
   - PDF summary report

3. **Data Dictionary**: Field definitions for all exported data

4. **Filters Applied**: Any filtering on the export

5. **Data Freshness**: As-of date for all metrics

Help me generate and download this export.`,
    },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSubjectsForDomain(domain: BuilderDomain): BuilderOption[] {
  return BUILDER_SUBJECTS[domain] || [];
}

export function getActionsForSubject(domain: BuilderDomain, subject: string): ActionConfig[] {
  const key = `${domain}:${subject}`;
  return BUILDER_ACTIONS[key] || [];
}

export function getActionConfig(domain: BuilderDomain, subject: string, actionId: string): ActionConfig | undefined {
  const actions = getActionsForSubject(domain, subject);
  return actions.find(a => a.id === actionId);
}

export function getInputOptions(dataSource: InputConfig['dataSource']): { id: string; name: string }[] {
  switch (dataSource) {
    case 'suppliers':
      return SEEDED_SUPPLIERS.map(s => ({ id: s.id, name: s.name }));
    case 'categories':
      return SEEDED_CATEGORIES.map(c => ({ id: c.id, name: c.name }));
    case 'regions':
      return SEEDED_REGIONS.map(r => ({ id: r.id, name: r.name }));
    case 'commodities':
      return SEEDED_COMMODITIES.map(c => ({ id: c.id, name: c.name }));
    case 'timeframes':
      return SEEDED_TIMEFRAMES;
    case 'risk_levels':
      return SEEDED_RISK_LEVELS.map(r => ({ id: r.id, name: r.name }));
    default:
      return [];
  }
}

export function buildPrompt(selection: BuilderSelection): string {
  if (!selection.domain || !selection.subject || !selection.action) {
    return '';
  }

  const actionConfig = getActionConfig(selection.domain, selection.subject, selection.action);
  if (!actionConfig) return '';

  let prompt = actionConfig.promptTemplate;

  // Replace simple placeholders
  Object.entries(selection.modifiers).forEach(([key, value]) => {
    // Handle mustache-style conditionals {{#key}}...{{/key}} and {{^key}}...{{/key}}
    const conditionalRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');
    const inverseRegex = new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g');

    if (value) {
      // If value exists, show conditional content and hide inverse
      prompt = prompt.replace(conditionalRegex, '$1');
      prompt = prompt.replace(inverseRegex, '');
      // Replace simple placeholder
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    } else {
      // If no value, hide conditional content and show inverse
      prompt = prompt.replace(conditionalRegex, '');
      prompt = prompt.replace(inverseRegex, '$1');
    }
  });

  // Clean up any remaining unreplaced conditionals
  prompt = prompt.replace(/\{\{#\w+\}\}[\s\S]*?\{\{\/\w+\}\}/g, '');
  prompt = prompt.replace(/\{\{\^\w+\}\}[\s\S]*?\{\{\/\w+\}\}/g, '');
  prompt = prompt.replace(/\{\{\w+\}\}/g, '');

  return prompt.trim();
}

export function buildPath(selection: BuilderSelection): string {
  if (!selection.domain || !selection.subject || !selection.action) {
    return '';
  }
  return `${selection.domain}:${selection.subject}:${selection.action}`;
}

// ============================================
// ROUTE MAPPING FOR ROUTER
// ============================================

export interface RouteMapping {
  intent: IntentCategory;
  subIntent: SubIntent;
  widgets: WidgetType[];
  requiresResearch?: boolean;
  requiresSupplierInput?: boolean;
  promptTemplate: string;
}

// Maps action paths to intent routing
// NOTE: These intents must match IntentCategory values from types/intents.ts
const ROUTE_MAPPINGS: Record<string, Omit<RouteMapping, 'promptTemplate'>> = {
  // Risk domain → portfolio_overview or trend_detection
  'risk:portfolio-health:executive-summary': { intent: 'portfolio_overview', subIntent: 'overall_summary', widgets: ['executive_summary', 'risk_distribution'] },
  'risk:portfolio-health:risk-distribution': { intent: 'portfolio_overview', subIntent: 'overall_summary', widgets: ['risk_distribution', 'supplier_table'] },
  'risk:portfolio-health:health-scorecard': { intent: 'portfolio_overview', subIntent: 'overall_summary', widgets: ['health_scorecard', 'stat_card'] },
  'risk:exposure-analysis:spend-at-risk': { intent: 'portfolio_overview', subIntent: 'spend_weighted', widgets: ['spend_exposure', 'supplier_table'] },
  'risk:exposure-analysis:category-exposure': { intent: 'portfolio_overview', subIntent: 'by_dimension', widgets: ['risk_distribution', 'supplier_table'] },
  'risk:exposure-analysis:regional-exposure': { intent: 'portfolio_overview', subIntent: 'by_dimension', widgets: ['risk_distribution', 'supplier_table'] },
  'risk:risk-changes:recent-changes': { intent: 'trend_detection', subIntent: 'recent_changes', widgets: ['events_feed', 'supplier_table'] },
  'risk:risk-changes:score-investigation': { intent: 'supplier_deep_dive', subIntent: 'score_inquiry', widgets: ['supplier_risk_card', 'stat_card'], requiresSupplierInput: true },
  'risk:concentration:single-source': { intent: 'filtered_discovery', subIntent: 'by_attribute', widgets: ['supplier_table', 'alert_card'] },
  'risk:concentration:concentration-analysis': { intent: 'portfolio_overview', subIntent: 'by_dimension', widgets: ['risk_distribution', 'supplier_table'] },

  // Market domain → market_context (triggers research)
  'market:commodity-prices:price-impact': { intent: 'market_context', subIntent: 'none', widgets: ['trend_chart', 'supplier_table'], requiresResearch: true },
  'market:commodity-prices:price-forecast': { intent: 'market_context', subIntent: 'none', widgets: ['trend_chart', 'info_card'], requiresResearch: true },
  'market:industry-news:market-briefing': { intent: 'market_context', subIntent: 'none', widgets: ['news_item', 'events_feed'], requiresResearch: true },
  'market:industry-news:supplier-news': { intent: 'supplier_deep_dive', subIntent: 'news_events', widgets: ['news_item', 'supplier_risk_card'], requiresResearch: true, requiresSupplierInput: true },
  'market:disruptions:active-disruptions': { intent: 'market_context', subIntent: 'none', widgets: ['events_feed', 'alert_card'] },
  'market:disruptions:disruption-scenario': { intent: 'market_context', subIntent: 'none', widgets: ['info_card', 'supplier_table'] },
  'market:geopolitical:regional-risks': { intent: 'market_context', subIntent: 'none', widgets: ['info_card', 'risk_distribution'], requiresResearch: true },

  // Suppliers domain → supplier_deep_dive, filtered_discovery, or comparison
  'suppliers:deep-dive:full-profile': { intent: 'supplier_deep_dive', subIntent: 'supplier_overview', widgets: ['supplier_risk_card', 'stat_card'], requiresSupplierInput: true },
  'suppliers:deep-dive:risk-factors': { intent: 'supplier_deep_dive', subIntent: 'score_inquiry', widgets: ['stat_card', 'trend_chart'], requiresSupplierInput: true },
  'suppliers:compare:side-by-side': { intent: 'comparison', subIntent: 'none', widgets: ['comparison_table', 'stat_card'] },
  'suppliers:discover:high-risk-list': { intent: 'filtered_discovery', subIntent: 'by_risk_level', widgets: ['supplier_table', 'risk_distribution'] },
  'suppliers:discover:category-suppliers': { intent: 'filtered_discovery', subIntent: 'by_attribute', widgets: ['supplier_table', 'stat_card'] },
  'suppliers:discover:regional-suppliers': { intent: 'filtered_discovery', subIntent: 'by_attribute', widgets: ['supplier_table', 'risk_distribution'] },
  'suppliers:alternatives:find-alternatives': { intent: 'action_trigger', subIntent: 'find_alternatives', widgets: ['supplier_table', 'comparison_table'], requiresSupplierInput: true },

  // Actions domain → action_trigger, reporting_export, or setup_config
  'actions:executive-report:board-summary': { intent: 'reporting_export', subIntent: 'none', widgets: ['executive_summary', 'risk_distribution'] },
  'actions:executive-report:category-report': { intent: 'reporting_export', subIntent: 'none', widgets: ['executive_summary', 'supplier_table'] },
  'actions:alerts:setup-alerts': { intent: 'setup_config', subIntent: 'none', widgets: ['info_card', 'checklist_card'] },
  'actions:alerts:view-alerts': { intent: 'trend_detection', subIntent: 'recent_changes', widgets: ['events_feed', 'alert_card'] },
  'actions:mitigation:mitigation-plan': { intent: 'action_trigger', subIntent: 'mitigation_plan', widgets: ['recommendation_card', 'checklist_card'] },
  'actions:export:export-portfolio': { intent: 'reporting_export', subIntent: 'none', widgets: ['info_card'] },
};

export function getRouteMappingForPath(path: string): RouteMapping | null {
  const baseMapping = ROUTE_MAPPINGS[path];
  if (!baseMapping) return null;

  // Parse path to get domain, subject, action
  const [domain, subject, action] = path.split(':');
  const actionConfig = getActionConfig(domain as BuilderDomain, subject, action);

  return {
    ...baseMapping,
    promptTemplate: actionConfig?.promptTemplate || '',
  };
}
