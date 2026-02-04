// StarterChips — cloud of popular domain chips derived from managed categories
// Toggle behavior: click adds interest, shows checkmark when added

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// 12 domains from managed category catalog
const STARTER_DOMAINS = [
  'Metals',
  'Packaging',
  'IT Services',
  'Chemicals',
  'Energy',
  'MRO',
  'Marketing',
  'HR Services',
  'Facilities',
  'Travel',
  'Fleet',
  'Logistics',
];

interface StarterChipsProps {
  addedDomains: Set<string>;
  onChipClick: (domain: string) => void;
}

export function StarterChips({ addedDomains, onChipClick }: StarterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center" data-testid="starter-chips">
      {STARTER_DOMAINS.map((domain, index) => {
        const isAdded = addedDomains.has(domain.toLowerCase());

        return (
          <motion.button
            key={domain}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
            onClick={() => onChipClick(domain)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-[7px]
              rounded-full text-[13px] font-normal
              transition-all cursor-pointer
              ${isAdded
                ? 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
            aria-label={isAdded ? `${domain} added` : `Add ${domain} to your interests`}
            data-testid={`starter-chip-${domain.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {isAdded && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 14, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </motion.span>
            )}
            {domain}
          </motion.button>
        );
      })}
    </div>
  );
}
