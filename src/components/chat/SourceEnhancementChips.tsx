/* eslint-disable react-refresh/only-export-components -- Exports type alongside component */
// SourceEnhancementChips - Smart follow-up suggestions for source expansion
// Shown when user queries only use Beroe data, suggesting broader coverage

import { motion } from 'framer-motion';
import { Globe, Search, UserCircle, Sparkles, Lightbulb, Info } from 'lucide-react';
import type { SourceEnhancement, SourceEnhancementType } from '../../types/aiResponse';

interface SourceEnhancementChipsProps {
  sourceEnhancement: SourceEnhancement;
  onSelect: (type: SourceEnhancementType) => void;
  className?: string;
}

const getIcon = (icon: string) => {
  switch (icon) {
    case 'globe':
      return <Globe className="w-3.5 h-3.5" />;
    case 'search':
      return <Search className="w-3.5 h-3.5" />;
    case 'user':
      return <UserCircle className="w-3.5 h-3.5" />;
    case 'sparkles':
      return <Sparkles className="w-3.5 h-3.5" />;
    default:
      return <Lightbulb className="w-3.5 h-3.5" />;
  }
};

const getChipStyles = (type: SourceEnhancementType): string => {
  switch (type) {
    case 'add_web':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200';
    case 'deep_research':
      return 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200';
    case 'analyst':
      return 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200';
    case 'expert':
      return 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
  }
};

export const SourceEnhancementChips = ({
  sourceEnhancement,
  onSelect,
  className = '',
}: SourceEnhancementChipsProps) => {
  const { suggestions, currentSourceType } = sourceEnhancement;

  if (!suggestions || suggestions.length === 0) return null;

  // Only show if using limited sources
  if (currentSourceType === 'all') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className={`mt-3 pt-3 border-t border-slate-100 ${className}`}
    >
      {/* Context indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">
          {currentSourceType === 'beroe_only'
            ? 'Results from Beroe data only'
            : currentSourceType === 'beroe_plus_partners'
            ? 'Results from Beroe + trusted partners'
            : currentSourceType === 'web_only'
            ? 'Results from web sources only'
            : 'Results from Beroe + web sources'}
        </span>
      </div>

      {/* Enhancement chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Enhance:</span>
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.type}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={() => onSelect(suggestion.type)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full
              text-xs font-medium border transition-all
              hover:shadow-sm
              ${getChipStyles(suggestion.type)}
            `}
            title={suggestion.description}
          >
            {getIcon(suggestion.icon)}
            <span>{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Inline variant - shows as part of the response text flow
export const SourceEnhancementInline = ({
  sourceEnhancement,
  onSelect,
}: SourceEnhancementChipsProps) => {
  const { suggestions, currentSourceType } = sourceEnhancement;

  if (!suggestions || suggestions.length === 0 || currentSourceType === 'all') {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 ml-1">
      <span className="text-slate-400">|</span>
      {suggestions.slice(0, 2).map((suggestion) => (
        <button
          key={suggestion.type}
          onClick={() => onSelect(suggestion.type)}
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            text-xs font-medium transition-colors
            ${getChipStyles(suggestion.type)}
          `}
        >
          {getIcon(suggestion.icon)}
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  );
};

// Helper to generate source enhancement suggestions based on current state
export const generateSourceEnhancementSuggestions = (
  currentSourceType: SourceEnhancement['currentSourceType'],
  intent?: string
): SourceEnhancement => {
  const suggestions: SourceEnhancement['suggestions'] = [];

  // If Beroe only, suggest web sources
  if (currentSourceType === 'beroe_only') {
    suggestions.push({
      type: 'add_web',
      text: 'Add web sources',
      description: 'Include recent news, filings, and market reports',
      icon: 'globe',
    });
  }

  // If not using deep research, suggest it
  if (currentSourceType !== 'all') {
    suggestions.push({
      type: 'deep_research',
      text: 'Deep research',
      description: 'Multi-source analysis with verification',
      icon: 'search',
    });
  }

  // For complex intents, suggest expert
  const complexIntents = ['market_context', 'comparison', 'explanation_why'];
  if (intent && complexIntents.includes(intent)) {
    suggestions.push({
      type: 'expert',
      text: 'Ask an expert',
      description: 'Connect with industry specialists',
      icon: 'sparkles',
    });
  }

  return {
    currentSourceType,
    suggestions,
  };
};

export default SourceEnhancementChips;
