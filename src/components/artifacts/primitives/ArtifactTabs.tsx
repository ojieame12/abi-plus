// Artifact Tabs Primitive
// Tab navigation for artifact content sections

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface ArtifactTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface ArtifactTabsProps {
  tabs: ArtifactTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export const ArtifactTabs = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className = '',
}: ArtifactTabsProps) => {
  const sizeStyles = {
    sm: 'text-xs py-2',
    md: 'text-[13px] py-3',
  };

  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 px-5 py-3 ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="text-[10px] bg-white/60 px-1 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default: underline variant
  return (
    <div className={`px-5 border-b border-slate-100 bg-white ${className}`}>
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              relative flex items-center gap-1.5 ${sizeStyles[size]} font-medium transition-all
              ${activeTab === tab.id
                ? 'text-violet-700'
                : 'text-slate-500 hover:text-slate-800'
              }
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${activeTab === tab.id ? 'bg-violet-100' : 'bg-slate-100'}
              `}>
                {tab.badge}
              </span>
            )}

            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtifactTabs;
