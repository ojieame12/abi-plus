/* eslint-disable react-refresh/only-export-components -- Exports multiple related badge components and utilities */
/* eslint-disable react-hooks/static-components -- Icon lookup from constant map is safe */
// LayerBadge - Content provenance indicator for the three-tier architecture
// L1: AI Generated, L2a: Analyst Verified, L2b: Decision Grade, L3: Bespoke

import { motion } from 'framer-motion';
import { Bot, CheckCircle, Star, Crown, Info } from 'lucide-react';
import { useState } from 'react';
import { type ContentLayer, LAYER_CONFIGS, getLayerConfig } from '../../types/layers';

// Icon mapping
const LAYER_ICONS = {
  Bot,
  CheckCircle,
  Star,
  Crown,
} as const;

function getLayerIcon(iconName: string) {
  return LAYER_ICONS[iconName as keyof typeof LAYER_ICONS] || Bot;
}

// Size variants
type BadgeSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<BadgeSize, {
  container: string;
  icon: string;
  text: string;
  tooltip: string;
}> = {
  sm: {
    container: 'px-2 py-0.5 gap-1 rounded',
    icon: 'w-3 h-3',
    text: 'text-[10px] font-medium',
    tooltip: 'text-xs',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5 rounded-md',
    icon: 'w-3.5 h-3.5',
    text: 'text-xs font-medium',
    tooltip: 'text-xs',
  },
  lg: {
    container: 'px-3 py-1.5 gap-2 rounded-lg',
    icon: 'w-4 h-4',
    text: 'text-sm font-medium',
    tooltip: 'text-sm',
  },
};

// Badge variants
type BadgeVariant = 'default' | 'subtle' | 'outline' | 'tag';

interface LayerBadgeProps {
  layer: ContentLayer;
  size?: BadgeSize;
  variant?: BadgeVariant;
  showIcon?: boolean;
  showLabel?: boolean;
  showTooltip?: boolean;
  analystName?: string;
  expertName?: string;
  animate?: boolean;
  className?: string;
}

export function LayerBadge({
  layer,
  size = 'md',
  variant = 'default',
  showIcon = true,
  showLabel = true,
  showTooltip = true,
  analystName,
  expertName,
  animate = true,
  className = '',
}: LayerBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = getLayerConfig(layer);
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = getLayerIcon(config.badgeIcon);

  // Build tooltip text
  const getTooltipText = () => {
    let text = config.provenanceCopy;
    if (analystName && (layer === 'L2a' || layer === 'L2b')) {
      text = `Validated by ${analystName}`;
    }
    if (expertName && layer === 'L3') {
      text = `Strategic brief by ${expertName}`;
    }
    return text;
  };

  // Variant-specific styles
  const getVariantClasses = () => {
    const { bg, bgHover, border, text, tagBg, tagText } = config.colorScheme;

    switch (variant) {
      case 'subtle':
        return `${bg} ${bgHover} ${text}`;
      case 'outline':
        return `bg-transparent border ${border} ${text}`;
      case 'tag':
        return `${tagBg} ${tagText}`;
      default:
        return `${bg} ${bgHover} border ${border} ${text}`;
    }
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.15 },
    whileHover: { scale: 1.02 },
  } : {};

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Wrapper
        {...wrapperProps}
        className={`
          inline-flex items-center cursor-default
          transition-colors duration-150
          ${sizeClasses.container}
          ${getVariantClasses()}
          ${className}
        `}
      >
        {showIcon && (
          <Icon className={`${sizeClasses.icon} ${config.colorScheme.icon} flex-shrink-0`} />
        )}
        {showLabel && (
          <span className={sizeClasses.text}>
            {config.badgeText}
          </span>
        )}
      </Wrapper>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className={`
            absolute z-50 left-0 top-full mt-1.5
            px-3 py-2 rounded-lg
            bg-slate-900 text-white shadow-lg
            whitespace-nowrap
            ${sizeClasses.tooltip}
          `}
        >
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{getTooltipText()}</span>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45" />
        </motion.div>
      )}
    </div>
  );
}

// Compact inline variant for use in text
interface InlineLayerBadgeProps {
  layer: ContentLayer;
  className?: string;
}

export function InlineLayerBadge({ layer, className = '' }: InlineLayerBadgeProps) {
  const config = getLayerConfig(layer);
  const Icon = getLayerIcon(config.badgeIcon);

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded
        text-[10px] font-medium
        ${config.colorScheme.bg} ${config.colorScheme.text}
        ${className}
      `}
    >
      <Icon className={`w-2.5 h-2.5 ${config.colorScheme.icon}`} />
      {config.shortName}
    </span>
  );
}

// Layer indicator dot (minimal variant)
interface LayerDotProps {
  layer: ContentLayer;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function LayerDot({ layer, size = 'md', pulse = false, className = '' }: LayerDotProps) {
  const config = getLayerConfig(layer);

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <span
        className={`
          ${dotSizes[size]} rounded-full
          ${config.colorScheme.tagBg}
        `}
      />
      {pulse && (
        <span
          className={`
            absolute inset-0 ${dotSizes[size]} rounded-full
            ${config.colorScheme.tagBg} opacity-75
            animate-ping
          `}
        />
      )}
    </span>
  );
}

// Layer badge with provenance details (expanded variant)
interface LayerProvenanceProps {
  layer: ContentLayer;
  analystName?: string;
  expertName?: string;
  validatedAt?: string;
  className?: string;
}

export function LayerProvenance({
  layer,
  analystName,
  expertName,
  validatedAt,
  className = '',
}: LayerProvenanceProps) {
  const config = getLayerConfig(layer);
  const Icon = getLayerIcon(config.badgeIcon);

  const personName = layer === 'L3' ? expertName : analystName;
  const roleLabel = layer === 'L3' ? 'Expert' : 'Analyst';

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg
        ${config.colorScheme.bg} border ${config.colorScheme.border}
        ${className}
      `}
    >
      <div className={`p-2 rounded-lg ${config.colorScheme.tagBg}`}>
        <Icon className={`w-4 h-4 ${config.colorScheme.tagText}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.colorScheme.text}`}>
            {config.name}
          </span>
          <LayerBadge layer={layer} size="sm" variant="tag" showIcon={false} showTooltip={false} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {config.description}
        </p>
        {personName && (
          <p className="text-xs text-slate-600 mt-1">
            {roleLabel}: <span className="font-medium">{personName}</span>
          </p>
        )}
        {validatedAt && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            {new Date(validatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// Export layer configs for external use
export { LAYER_CONFIGS, getLayerConfig, type ContentLayer };
