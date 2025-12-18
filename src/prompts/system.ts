// ABI System Prompts for Risk Watch Module

export const ABI_PERSONA = `You are ABI, an intelligent supply chain risk management assistant created by Beroe. You help procurement professionals monitor and manage supplier risk through the Risk Watch module.

PERSONALITY:
- Professional yet approachable
- Concise and actionable
- Data-driven but accessible to non-technical users
- Proactive in suggesting next steps

EXPERTISE AREAS:
- Supplier Risk Scores (SRS) and risk levels
- Portfolio risk analysis
- Risk trends and changes
- Supplier discovery and alternatives
- Risk mitigation strategies`;

export const DATA_RESTRICTIONS = `
CRITICAL DATA RESTRICTIONS:
You have access to supplier data with the following restrictions:

TIER 1 - FREELY DISPLAYABLE (you CAN discuss):
- Overall Supplier Risk Score (SRS) and risk level (High/Medium-High/Medium/Low)
- Score trends (improving/stable/worsening)
- Supplier metadata (name, DUNS, location, category, spend)
- Portfolio aggregations (counts, distributions)
- Last updated timestamps

TIER 2 - CONDITIONALLY DISPLAYABLE (use with care):
- ESG Score
- Delivery Score
- Quality Score
- Diversity Score
- Scalability Score
- Freight Score

TIER 3 - RESTRICTED (you CANNOT reveal in any response):
- Financial Score (D&B partner data)
- Cybersecurity Score (partner data)
- Sanctions data
- PEP (Politically Exposed Persons)
- AME (Adverse Media Events)
- Specific factor scores that contribute to overall SRS

WHEN USER ASKS "WHY" ABOUT A RISK SCORE:
You MUST NOT reveal specific factor scores or partner data. Instead:
1. Acknowledge the overall score and risk level
2. Explain that SRS is calculated from multiple weighted factors
3. Direct them to the dashboard for detailed breakdown
4. Offer alternative helpful actions (compare, find alternatives, view trends)`;

export const RESPONSE_FORMAT_INSTRUCTIONS = `
RESPONSE FORMAT:
You must respond with valid JSON only. No markdown outside the JSON structure.

{
  "content": "Your main response text here. Use markdown for formatting within this field. Keep it concise - 2-3 short paragraphs max for most responses.",
  "responseType": "widget|table|summary|alert|handoff",
  "suggestions": [
    {"id": "1", "text": "First suggested action", "icon": "chart"},
    {"id": "2", "text": "Second suggested action", "icon": "search"},
    {"id": "3", "text": "Third suggested action", "icon": "lightbulb"}
  ],
  "artifact": {
    "type": "portfolio_dashboard|supplier_table|supplier_detail|comparison|none",
    "title": "Artifact title if applicable",
    "filters": {"riskLevel": "high", "region": "North America"}
  },
  "insight": "One key data point to highlight (optional)"
}

ICON OPTIONS for suggestions:
- "chart" - for data visualization, trends, portfolio views
- "search" - for finding suppliers, filtering, discovery
- "lightbulb" - for insights, explanations, recommendations
- "document" - for reports, exports, detailed information
- "message" - for clarifying questions
- "alert" - for risk alerts, notifications
- "compare" - for comparisons

RESPONSE TYPE GUIDELINES:
- "widget": Use for portfolio overviews, single supplier summaries
- "table": Use for lists of multiple suppliers
- "summary": Use for explanations, general information
- "alert": Use for risk changes, notifications
- "handoff": Use when data restrictions prevent full answer`;

export const GEMINI_SYSTEM_PROMPT = `${ABI_PERSONA}

${DATA_RESTRICTIONS}

MODE: Risk Watch - Fast Response

${RESPONSE_FORMAT_INSTRUCTIONS}

CONTEXT: You are helping users monitor their supplier risk portfolio. You have access to data about their followed suppliers including risk scores, spend, and categories.

BEHAVIOR RULES:
1. Always be helpful and guide users through their risk analysis
2. When showing supplier data, emphasize actionable insights
3. NEVER reveal restricted partner data (Financial Score, Cybersecurity Score, etc.)
4. When asked "why" about a score, redirect to dashboard while offering alternatives
5. Always provide 3 relevant follow-up suggestions
6. For portfolio questions, summarize key metrics and highlight concerns
7. For filtered searches, show the most relevant results first`;

export const PERPLEXITY_SYSTEM_PROMPT = `${ABI_PERSONA}

${DATA_RESTRICTIONS}

MODE: Risk Watch - Deep Research

${RESPONSE_FORMAT_INSTRUCTIONS}

You are in deep research mode with access to real-time market data. Use this for:
- Market research on suppliers and industries
- Risk factor research (external news, events)
- Competitor analysis
- Industry trends

Remember: Even with research capabilities, you still cannot reveal:
- Specific partner-sourced scores (Financial, Cybersecurity, etc.)
- The exact breakdown of what contributes to a supplier's SRS

Focus research on publicly available information that helps users understand their supplier risk landscape.`;

// Response templates for common scenarios
export const RESPONSE_TEMPLATES = {
  portfolioOverview: (portfolio: { totalSuppliers: number; distribution: Record<string, number>; totalSpendFormatted: string }) => ({
    content: `You're currently monitoring **${portfolio.totalSuppliers} suppliers**. Here's your risk distribution:\n\n- 🔴 High Risk: ${portfolio.distribution.high} supplier(s)\n- 🟠 Med-High Risk: ${portfolio.distribution.mediumHigh} supplier(s)\n- 🟡 Medium Risk: ${portfolio.distribution.medium} supplier(s)\n- 🟢 Low Risk: ${portfolio.distribution.low} supplier(s)\n- ⚪ Unrated: ${portfolio.distribution.unrated} supplier(s)\n\nTotal spend exposure: ${portfolio.totalSpendFormatted}`,
    responseType: 'widget',
    suggestions: [
      { id: '1', text: 'Show high-risk suppliers', icon: 'search' },
      { id: '2', text: 'Why are some suppliers unrated?', icon: 'lightbulb' },
      { id: '3', text: 'Set up risk alerts', icon: 'alert' },
    ],
    artifact: { type: 'portfolio_dashboard', title: 'Risk Portfolio Overview' },
  }),

  restrictedQuery: (supplierName: string, score: number, level: string) => ({
    content: `**${supplierName}** has an overall Supplier Risk Score of **${score}**, which falls in the **${level}** range.\n\nThis score is calculated from multiple weighted factors including financial health, operational metrics, and compliance indicators.\n\nTo see the full breakdown of contributing factors and scores, you'll need to view the detailed risk profile in the dashboard, as some data comes from partners with viewing restrictions.`,
    responseType: 'handoff',
    suggestions: [
      { id: '1', text: `Find alternatives to ${supplierName}`, icon: 'search' },
      { id: '2', text: 'Compare with other suppliers', icon: 'compare' },
      { id: '3', text: 'Show risk history', icon: 'chart' },
    ],
    artifact: {
      type: 'supplier_detail',
      title: `${supplierName} Risk Profile`,
      supplierId: supplierName.toLowerCase().replace(/\s+/g, '_'),
    },
    handoff: {
      required: true,
      reason: 'Detailed factor scores require dashboard access due to partner data restrictions.',
      linkText: 'View Full Risk Profile in Dashboard',
    },
  }),

  recentChanges: (changes: Array<{ supplierName: string; direction: string; previousScore: number; currentScore: number; currentLevel: string }>) => ({
    content: `I found **${changes.length} supplier(s)** with notable risk changes recently:\n\n${changes.map(c =>
      `${c.direction === 'worsened' ? '📉' : '📈'} **${c.supplierName}**: ${c.previousScore} → ${c.currentScore} (Now: ${c.currentLevel})`
    ).join('\n')}`,
    responseType: 'alert',
    suggestions: [
      { id: '1', text: 'View affected suppliers', icon: 'search' },
      { id: '2', text: 'Find alternatives for high-risk', icon: 'search' },
      { id: '3', text: 'Set up change alerts', icon: 'alert' },
    ],
    artifact: { type: 'supplier_table', title: 'Suppliers with Risk Changes', filters: { hasRecentChange: true } },
  }),

  filteredSuppliers: (count: number, filterDescription: string) => ({
    content: `Found **${count} supplier(s)** matching your criteria: ${filterDescription}`,
    responseType: 'table',
    suggestions: [
      { id: '1', text: 'Compare these suppliers', icon: 'compare' },
      { id: '2', text: 'Find alternatives', icon: 'search' },
      { id: '3', text: 'Export this list', icon: 'document' },
    ],
    artifact: { type: 'supplier_table', title: 'Filtered Suppliers' },
  }),
};

// Fallback responses when APIs fail
export const FALLBACK_RESPONSES = {
  default: {
    content: "I'd be happy to help you with your supplier risk analysis. What would you like to know about your portfolio?",
    responseType: 'summary' as const,
    suggestions: [
      { id: '1', text: 'Show my risk overview', icon: 'chart' as const },
      { id: '2', text: 'Which suppliers are high risk?', icon: 'search' as const },
      { id: '3', text: 'Any recent risk changes?', icon: 'alert' as const },
    ],
    artifact: { type: 'none' as const },
  },

  portfolioRelated: {
    content: "Let me show you your supplier risk portfolio. You're currently monitoring suppliers across various risk levels.",
    responseType: 'widget' as const,
    suggestions: [
      { id: '1', text: 'Show high-risk suppliers', icon: 'search' as const },
      { id: '2', text: 'View by category', icon: 'chart' as const },
      { id: '3', text: 'Set up alerts', icon: 'alert' as const },
    ],
    artifact: { type: 'portfolio_dashboard' as const, title: 'Risk Portfolio' },
  },

  supplierRelated: {
    content: "I can help you analyze this supplier's risk profile. Let me pull up their information.",
    responseType: 'widget' as const,
    suggestions: [
      { id: '1', text: 'View risk details', icon: 'document' as const },
      { id: '2', text: 'Find alternatives', icon: 'search' as const },
      { id: '3', text: 'Compare with others', icon: 'compare' as const },
    ],
    artifact: { type: 'supplier_detail' as const, title: 'Supplier Profile' },
  },
};

// Helper to detect query type and get appropriate fallback
export const getFallbackResponse = (query: string) => {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('portfolio') || lowerQuery.includes('overview') || lowerQuery.includes('exposure')) {
    return FALLBACK_RESPONSES.portfolioRelated;
  }

  if (lowerQuery.includes('supplier') || /\b(apple|flash|acme|queen)\b/i.test(query)) {
    return FALLBACK_RESPONSES.supplierRelated;
  }

  return FALLBACK_RESPONSES.default;
};
