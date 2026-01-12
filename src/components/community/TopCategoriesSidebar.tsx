import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShoppingCart,
  ClipboardCheck,
  PiggyBank,
  Search,
  FileText,
  Truck,
  Leaf,
  Zap,
  Battery,
  Sun,
  Package,
  type LucideIcon,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon?: string;
}

interface TopCategoriesSidebarProps {
  categories: Category[];
  selectedCategory?: string | null;
  onCategoryClick?: (slug: string) => void;
}

// Map category slugs/names to icons
const categoryIcons: Record<string, LucideIcon> = {
  'supplier-risk': ShieldAlert,
  'procurement': ShoppingCart,
  'compliance': ClipboardCheck,
  'cost-savings': PiggyBank,
  'due-diligence': Search,
  'contracts': FileText,
  'carbon-steel': Truck,
  'cocoa': Leaf,
  'electrical-building-materials': Zap,
  'lithium': Battery,
  'lead-batteries': Battery,
  'solar-panel': Sun,
  // Default fallback handled in component
};

function getCategoryIcon(category: Category): LucideIcon {
  // Try slug first, then lowercase name
  return (
    categoryIcons[category.slug] ||
    categoryIcons[category.name.toLowerCase().replace(/\s+/g, '-')] ||
    Package
  );
}

export function TopCategoriesSidebar({
  categories,
  selectedCategory,
  onCategoryClick,
}: TopCategoriesSidebarProps) {
  const displayCategories = categories.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
    >
      {/* Header */}
      <div className="px-5 py-3 bg-[#FAFBFD]">
        <h3 className="text-sm font-normal text-slate-700">Top Categories</h3>
      </div>

      {/* Categories list */}
      <div className="px-5 py-3">
        {displayCategories.map((category, index) => {
          const Icon = getCategoryIcon(category);
          const isSelected = selectedCategory === category.slug;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.03 }}
              onClick={() => onCategoryClick?.(category.slug)}
              className={`w-full flex items-center justify-between py-4
                         transition-colors text-left group ${
                           isSelected
                             ? 'text-violet-700'
                             : 'text-slate-700 hover:text-violet-600'
                         }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={`${isSelected ? 'text-violet-600' : 'text-violet-500'}`}
                  strokeWidth={1.5}
                />
                <span className="text-sm font-normal">{category.name}</span>
              </div>
              <span
                className={`text-xs font-normal tabular-nums px-2.5 py-1 rounded-lg bg-[#FAFBFD] ${
                  isSelected ? 'text-violet-600' : 'text-slate-500'
                }`}
              >
                {category.count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
