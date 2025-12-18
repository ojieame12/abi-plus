// Response Schema Types
// Defines the structure of AI responses to ensure consistency

export type WidgetType =
    | 'price-gauge'      // Market price with gauge visualization
    | 'risk-score'       // Supplier risk score display
    | 'data-table'       // Tabular data (suppliers, comparisons)
    | 'distribution'     // Risk distribution chart
    | 'trend-chart'      // Line/area chart for trends
    | 'comparison'       // Side-by-side comparison
    | 'alert'            // Event/alert card
    | 'portfolio'        // Portfolio overview
    | 'supplier-card'    // Individual supplier detail
    | 'market-context'   // Market intelligence
    | 'benchmark';       // Benchmark comparison

export interface ResponseWidget {
    type: WidgetType;
    title?: string;
    data: Record<string, unknown>;
}

export interface ResponseInsight {
    text: string;
    trend?: 'up' | 'down' | 'neutral';
    detail?: string;
}

export interface ResponseSource {
    webPages: number;
    dataSources: number;
    dataSourceName?: string; // e.g., "Beroe Data Sources"
}

export interface FollowUp {
    id: string;
    text: string;
    icon?: 'chat' | 'search' | 'document' | 'chart' | 'alert';
    action?: string; // Optional action identifier
}

export interface ThoughtProcess {
    duration: string;        // e.g., "2min"
    summary: string;         // Brief description of what AI did
    steps?: string[];        // Detailed steps (shown when expanded)
    searchQueries?: string[];
    sourcesReviewed?: number;
}

// Main Response Structure
export interface AIResponseData {
    // Required elements
    id: string;
    content: string;              // Main response text (markdown supported)
    sources: ResponseSource;
    followUps: FollowUp[];

    // Optional elements
    thoughtProcess?: ThoughtProcess;
    widget?: ResponseWidget;
    insight?: ResponseInsight;

    // Metadata
    timestamp?: string;
    responseType?: ResponseType;
}

// Response type determines default widget/layout
export type ResponseType =
    | 'summary'           // Text-heavy, minimal widgets
    | 'data'              // Widget-focused (tables, charts)
    | 'alert'             // Alert/notification style
    | 'comparison'        // Side-by-side comparison
    | 'exploration';      // Mixed content

// Helper to create default response structure
export const createResponse = (
    content: string,
    options: Partial<Omit<AIResponseData, 'id' | 'content'>> = {}
): AIResponseData => ({
    id: crypto.randomUUID(),
    content,
    sources: options.sources ?? { webPages: 0, dataSources: 0 },
    followUps: options.followUps ?? [],
    ...options,
});

// Default follow-ups by context
export const getDefaultFollowUps = (context: 'risk' | 'market' | 'supplier' | 'general'): FollowUp[] => {
    const followUpsByContext: Record<string, FollowUp[]> = {
        risk: [
            { id: '1', text: 'Show me suppliers that need immediate attention', icon: 'alert' },
            { id: '2', text: 'View risk trends over time', icon: 'chart' },
            { id: '3', text: 'Find alternatives for high-risk suppliers', icon: 'search' },
        ],
        market: [
            { id: '1', text: 'See more suppliers for this category', icon: 'search' },
            { id: '2', text: 'View spend & inflation of each category', icon: 'chart' },
            { id: '3', text: 'Discover recent reports related to this category', icon: 'document' },
        ],
        supplier: [
            { id: '1', text: 'Compare with similar suppliers', icon: 'chart' },
            { id: '2', text: 'View full risk profile in dashboard', icon: 'document' },
            { id: '3', text: 'Find alternative suppliers', icon: 'search' },
        ],
        general: [
            { id: '1', text: 'Tell me more about this', icon: 'chat' },
            { id: '2', text: 'Show related data', icon: 'chart' },
            { id: '3', text: 'Export this information', icon: 'document' },
        ],
    };

    return followUpsByContext[context] || followUpsByContext.general;
};
