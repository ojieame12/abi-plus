// Citation Badge Component
// Inline hoverable badge for citations [B1], [W1]
// Icon style (Beroe squircle or Globe), no underline

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Circle } from 'lucide-react';
import type { Citation } from '../../types/hybridResponse';
import type { WebSource, InternalSource } from '../../types/aiResponse';

// ============================================
// BEROE LOGO ICON (Purple Squircle)
// ============================================

const BeroeLogo = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 30 30"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M14.7842 3.63885e-09C16.5464 -5.77794e-05 18.3322 0.688064 19.8955 1.58105C21.4965 2.4956 23.0674 3.74115 24.4473 5.12109C25.8271 6.50101 27.0728 8.0719 27.9873 9.67285C28.8801 11.236 29.5682 13.0214 29.5684 14.7832C29.5684 16.5453 28.8802 18.3312 27.9873 19.8945C27.0728 21.4955 25.8271 23.0664 24.4473 24.4463C23.0674 25.8262 21.4964 27.0717 19.8955 27.9863C18.3322 28.8793 16.5463 29.5682 14.7842 29.5684C13.137 29.5684 11.4186 28.9537 9.84961 28.085C8.2456 27.1968 6.62186 25.9461 5.12207 24.4463C3.62215 22.9464 2.37146 21.3218 1.4834 19.7178C0.614911 18.149 0.000331958 16.4317 0 14.7852C5.82123e-05 13.0229 0.687979 11.2363 1.58105 9.67285C2.49564 8.07181 3.74112 6.50107 5.12109 5.12109C6.50107 3.74112 8.07181 2.49564 9.67285 1.58105C11.2362 0.688014 13.022 0.00011151 14.7842 3.63885e-09ZM14.6484 3.62793C13.0746 3.6279 11.4687 3.81266 10.0342 4.2041C8.63338 4.58636 7.22272 5.21279 6.21777 6.21777C5.21286 7.22276 4.58637 8.63332 4.2041 10.0342C3.81266 11.4687 3.62796 13.0746 3.62793 14.6484C3.62793 16.2224 3.81262 17.829 4.2041 19.2637C4.56245 20.5768 5.13519 21.8986 6.0332 22.8867L6.21777 23.0801C7.15699 24.019 8.48688 24.6485 9.87695 25.0479C11.2982 25.4562 12.9377 25.6689 14.6484 25.6689C16.3591 25.6689 17.9987 25.4561 19.4199 25.0479C20.8099 24.6485 22.1398 24.0194 23.0791 23.0801C24.084 22.0751 24.7105 20.6645 25.0928 19.2637C25.4843 17.829 25.6689 16.2224 25.6689 14.6484C25.6689 13.0746 25.4842 11.4687 25.0928 10.0342C24.7105 8.63339 24.084 7.22268 23.0791 6.21777C22.0742 5.21295 20.6635 4.58637 19.2627 4.2041C17.8282 3.81264 16.2223 3.62796 14.6484 3.62793Z" />
  </svg>
);

// ============================================
// TYPES
// ============================================

/** Props for hybrid citation badge (subtle icon style) */
export interface HybridCitationBadgeProps {
  /** Citation data (from CitationMap) */
  citation: Citation | WebSource | InternalSource;
  /** Citation ID (e.g., "B1", "W1") - used to determine source type */
  citationId: string;
  /** Source type for styling (auto-detected from citationId if not provided) */
  sourceType?: 'beroe' | 'web' | 'unknown';
  /** Callback when clicking the icon (e.g., open report viewer) */
  onSourceClick?: (citation: Citation | WebSource | InternalSource) => void;
}

/** Props for legacy numbered citation badge */
interface LegacyCitationBadgeProps {
  number: number;
  onClick?: () => void;
}

// Union type for backwards compatibility
export type CitationBadgeProps = HybridCitationBadgeProps | LegacyCitationBadgeProps;

// Type guard
function isHybridProps(props: CitationBadgeProps): props is HybridCitationBadgeProps {
  return 'citationId' in props;
}

// ============================================
// COMPONENT
// ============================================

export const CitationBadge = (props: CitationBadgeProps) => {
  // Legacy mode
  if (!isHybridProps(props)) {
    return <LegacyCitationBadge {...props} />;
  }

  // Hybrid mode with tooltip
  return <HybridCitationBadge {...props} />;
};

// ============================================
// LEGACY BADGE (backwards compatible)
// ============================================

const LegacyCitationBadge = ({ number, onClick }: LegacyCitationBadgeProps) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 ml-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full hover:bg-slate-200 transition-colors"
    >
      <Circle size={10} strokeWidth={2} />
      <span>{number}</span>
    </button>
  );
};

// ============================================
// HYBRID BADGE (subtle underline + icon)
// ============================================

const HybridCitationBadge = ({
  citation,
  citationId,
  sourceType,
  onSourceClick,
}: HybridCitationBadgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Extract display data from citation (includes provider metadata)
  const displayData = extractDisplayData(citation, citationId);

  // Determine source type from citationId if not provided
  const resolvedSourceType = sourceType || (citationId.startsWith('B') ? 'beroe' : 'web');
  const isBeroe = resolvedSourceType === 'beroe';
  const isTier1 = displayData.reliabilityTier === 'tier1';

  // Get dynamic border color from provider metadata, fallback to defaults
  const getBorderColorClasses = () => {
    // If provider color is specified, use it (converted to Tailwind-compatible)
    if (displayData.providerColor) {
      // Provider colors are hex values - we'll apply via style for precise matching
      return 'border-current hover:border-current';
    }
    // Default colors based on source type
    return isBeroe
      ? 'border-violet-300 hover:border-violet-400'
      : 'border-slate-300 hover:border-blue-400';
  };

  const getIconColorClasses = () => {
    if (displayData.providerColor) {
      return ''; // Will use style prop
    }
    return isBeroe
      ? 'text-violet-600 hover:text-violet-700'
      : 'text-blue-500 hover:text-blue-600';
  };

  // Handle hover - fast, minimal delay
  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  }, []);

  // Handle click
  const handleClick = useCallback(() => {
    if (onSourceClick) {
      onSourceClick(citation);
    }
  }, [citation, onSourceClick]);

  return (
    <span className="relative inline-flex items-baseline">
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          inline-flex items-center
          border rounded-sm no-underline
          ${getBorderColorClasses()}
          transition-colors cursor-pointer
          ml-0.5 px-0.5 py-0.5
        `}
        style={displayData.providerColor ? { borderColor: displayData.providerColor } : undefined}
        aria-label={`Source: ${displayData.name}`}
      >
        {isBeroe ? (
          <BeroeLogo
            className={`w-3 h-3 transition-colors ${getIconColorClasses()}`}
            style={displayData.providerColor ? { color: displayData.providerColor } : undefined}
          />
        ) : (
          <Globe
            className={`w-3 h-3 transition-colors ${getIconColorClasses()}`}
            style={displayData.providerColor ? { color: displayData.providerColor } : undefined}
            strokeWidth={2}
          />
        )}
      </button>

      {/* Tooltip - minimal, appears below */}
      {/* Using span elements to avoid <div> inside <p> DOM nesting error */}
      <AnimatePresence>
        {showTooltip && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 block"
          >
            <span className="bg-slate-800 text-white text-[11px] rounded-md px-2.5 py-1.5 max-w-[220px] shadow-md whitespace-nowrap block">
              {/* Source name with tier badge */}
              <span className="font-medium truncate flex items-center gap-1.5">
                <span className="truncate">{displayData.name}</span>
                {isTier1 && (
                  <span className="px-1 py-0.5 text-[9px] font-medium rounded bg-violet-500/30 text-violet-200 flex-shrink-0">
                    Decision Grade
                  </span>
                )}
              </span>

              {/* Provider short name if different from display name */}
              {displayData.providerShortName && displayData.providerShortName !== displayData.name && (
                <span className="text-slate-400 text-[10px] block">
                  via {displayData.providerShortName}
                </span>
              )}

              {/* Snippet preview - one line only */}
              {displayData.snippet && (
                <span className="text-slate-400 mt-0.5 truncate text-[10px] block">
                  {displayData.snippet}
                </span>
              )}

              {/* Tooltip arrow */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] block">
                <span className="border-4 border-transparent border-b-slate-800 block" />
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

// ============================================
// HELPERS
// ============================================

interface DisplayData {
  name: string;
  snippet?: string;
  url?: string;
  domain?: string;
  category?: string;
  // Provider metadata
  providerShortName?: string;
  providerColor?: string;
  reliabilityTier?: 'tier1' | 'tier2' | 'tier3';
  providerId?: string;
}

/**
 * Extract display data from various citation formats
 * Now includes provider metadata for enhanced display
 */
function extractDisplayData(
  citation: Citation | WebSource | InternalSource,
  citationId: string
): DisplayData {
  // Citation type (from hybridResponse)
  if ('id' in citation && citation.id) {
    return {
      name: citation.name || `Source ${citationId}`,
      snippet: (citation as Citation).snippet,
      url: (citation as Citation).url,
      category: (citation as Citation).category,
    };
  }

  // WebSource type
  if ('url' in citation && 'domain' in citation) {
    return {
      name: citation.name || (citation as WebSource).domain,
      snippet: (citation as WebSource).snippet,
      url: (citation as WebSource).url,
      domain: (citation as WebSource).domain,
    };
  }

  // InternalSource type - extract provider metadata if available
  if ('type' in citation) {
    const internalSource = citation as InternalSource;
    return {
      name: internalSource.providerShortName || internalSource.name || `${internalSource.type} Source`,
      snippet: internalSource.summary,
      category: internalSource.category,
      // Provider metadata
      providerShortName: internalSource.providerShortName,
      providerColor: internalSource.providerColor,
      reliabilityTier: internalSource.reliabilityTier,
      providerId: internalSource.providerId,
    };
  }

  // Fallback
  return {
    name: citation.name || `Source ${citationId}`,
  };
}

export default CitationBadge;
