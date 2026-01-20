// Content layer types for the three-tier architecture
// L1: AI Generated, L2a: Analyst Verified, L2b: Decision Grade, L3: Bespoke

export type ContentLayer = 'L1' | 'L2a' | 'L2b' | 'L3';

export interface LayerConfig {
  id: ContentLayer;
  name: string;
  shortName: string;
  description: string;
  badgeText: string;
  badgeIcon: string; // Lucide icon name
  colorScheme: {
    bg: string;
    bgHover: string;
    border: string;
    text: string;
    icon: string;
    tagBg: string;
    tagText: string;
  };
  provenanceCopy: string;
}

// Color schemes aligned with existing design system:
// - Teal for Beroe/Analyst branded (matches ValueLadderActions Analyst Connect)
// - Amber/Gold for Premium (matches Expert Network)
// - Violet for primary accent
// - Slate for neutral

export const LAYER_CONFIGS: Record<ContentLayer, LayerConfig> = {
  L1: {
    id: 'L1',
    name: 'Pure AI',
    shortName: 'AI',
    description: 'Abi - AI-generated using web data, Beroe datasets, and partner data',
    badgeText: 'Pure AI',
    badgeIcon: 'Bot',
    colorScheme: {
      bg: 'bg-slate-50',
      bgHover: 'hover:bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-600',
      icon: 'text-slate-500',
      tagBg: 'bg-slate-500',
      tagText: 'text-white',
    },
    provenanceCopy: 'Instant coverage for any category or region',
  },
  L2a: {
    id: 'L2a',
    name: 'Premium Managed',
    shortName: 'Managed',
    description: 'Validated by Beroe analysts with "Ask a supplier/expert" access',
    badgeText: 'Premium Managed',
    badgeIcon: 'CheckCircle',
    colorScheme: {
      bg: 'bg-teal-50',
      bgHover: 'hover:bg-teal-100',
      border: 'border-teal-200',
      text: 'text-teal-700',
      icon: 'text-teal-600',
      tagBg: 'bg-teal-600',
      tagText: 'text-white',
    },
    provenanceCopy: 'Part of your managed category subscription',
  },
  L2b: {
    id: 'L2b',
    name: 'Decision Grade',
    shortName: 'Decision',
    description: 'On-request upgrade to decision-grade analysis',
    badgeText: 'Decision Grade',
    badgeIcon: 'Star',
    colorScheme: {
      bg: 'bg-violet-50',
      bgHover: 'hover:bg-violet-100',
      border: 'border-violet-200',
      text: 'text-violet-700',
      icon: 'text-violet-600',
      tagBg: 'bg-violet-600',
      tagText: 'text-white',
    },
    provenanceCopy: 'Upgraded from AI report via credit request',
  },
  L3: {
    id: 'L3',
    name: 'Bespoke',
    shortName: 'Bespoke',
    description: 'White-glove strategic support from expert network',
    badgeText: 'Bespoke',
    badgeIcon: 'Crown',
    colorScheme: {
      // Gradient from amber to yellow for premium feel
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      bgHover: 'hover:from-amber-100 hover:to-yellow-100',
      border: 'border-amber-300',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      tagBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      tagText: 'text-white',
    },
    provenanceCopy: 'Strategic project support with specialized tools',
  },
};

// Helper to get layer config
export function getLayerConfig(layer: ContentLayer): LayerConfig {
  return LAYER_CONFIGS[layer];
}

// Determine layer from response metadata
export interface LayerMetadata {
  isManaged?: boolean;    // Part of client's managed category slots (L2a)
  isUpgraded?: boolean;   // Upgraded via credit request (L2b)
  isBespoke?: boolean;    // Expert network deliverable (L3)
  analystName?: string;   // For L2a/L2b: validating analyst
  expertName?: string;    // For L3: expert who delivered
  validatedAt?: string;   // When validation occurred
}

export function getContentLayer(metadata?: LayerMetadata): ContentLayer {
  if (!metadata) return 'L1';
  if (metadata.isBespoke) return 'L3';
  if (metadata.isUpgraded) return 'L2b';
  if (metadata.isManaged) return 'L2a';
  return 'L1';
}

// Layer display order (for sorting/filtering)
export const LAYER_ORDER: ContentLayer[] = ['L1', 'L2a', 'L2b', 'L3'];

// Get human-readable layer label
export function getLayerLabel(layer: ContentLayer): string {
  return LAYER_CONFIGS[layer].name;
}
