// Unified Insight Header Component
// Reusable banner for insights across chat, widgets, and artifact panels

import { ChevronRight } from 'lucide-react';

interface InsightHeaderProps {
  headline: string;
  description?: string;
  variant?: 'banner' | 'panel' | 'compact';
  onClick?: () => void;
  className?: string;
}

export const InsightHeader = ({
  headline,
  description,
  variant = 'banner',
  onClick,
  className = '',
}: InsightHeaderProps) => {
  const isCompact = variant === 'compact';
  const isPanel = variant === 'panel';

  const padding = isCompact ? 'px-4 py-3' : isPanel ? 'px-5 py-4' : 'px-5 py-5';
  const headlineSize = isCompact ? 'text-[15px]' : 'text-lg';
  const descriptionSize = isCompact ? 'text-xs' : 'text-[13px]';
  const iconSize = isCompact ? 'w-4 h-4' : 'w-5 h-5';
  const gap = isCompact ? 'gap-2.5' : 'gap-3.5';

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        w-full relative overflow-hidden rounded-2xl text-left
        ${onClick ? 'hover:shadow-lg cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
      style={{ backgroundColor: '#0039FF' }}
    >
      {/* Background jellyfish image - full opacity, larger */}
      <img
        src="/Content Element4.png"
        alt=""
        className="absolute -right-8 -top-6 -bottom-6 h-[calc(100%+48px)] w-auto object-cover pointer-events-none"
      />

      {/* Content */}
      <div className={`relative z-10 flex items-center ${gap} ${padding}`}>
        {/* Sparkle icon */}
        <div className="flex-shrink-0 self-start mt-1">
          <img
            src="/sparkel.svg"
            alt=""
            className={iconSize}
          />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 pr-8">
          <div className={`font-normal text-white ${headlineSize} leading-snug`}>
            {headline}
          </div>
          {description && (
            <div
              className={`${descriptionSize} mt-1.5 leading-normal ${isCompact ? 'line-clamp-1' : 'line-clamp-2'}`}
              style={{ color: '#D5D5D5' }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Chevron arrow - only show when clickable */}
        {onClick && (
          <div className="flex-shrink-0 self-center">
            <ChevronRight className="w-6 h-6" strokeWidth={2} style={{ color: '#FFFFFF' }} />
          </div>
        )}
      </div>
    </Component>
  );
};

export default InsightHeader;
