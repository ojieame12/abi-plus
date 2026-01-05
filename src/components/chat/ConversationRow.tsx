import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Star, Trash2, Archive, Edit3 } from 'lucide-react';

interface ConversationRowProps {
  id: string;
  title: string;
  timestamp: string;
  onClick?: () => void;
  onStar?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRename?: (id: string) => void;
}

export const ConversationRow = ({
  id,
  title,
  timestamp,
  onClick,
  onStar,
  onDelete,
  onArchive,
  onRename,
}: ConversationRowProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <motion.div
      className="relative group"
      onMouseLeave={() => setShowMenu(false)}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/60 hover:bg-white border border-slate-100 hover:border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 text-left group"
      >
        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-medium text-primary truncate">
            {title}
          </h3>
          <p className="text-xs text-muted mt-0.5">{timestamp}</p>
        </div>

        {/* More Menu */}
        <div
          onClick={handleMenuClick}
          className="p-1.5 -mr-1 text-muted hover:text-secondary opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-slate-100"
        >
          <MoreVertical size={16} strokeWidth={1.5} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <motion.div
          className="absolute right-4 top-full mt-1 z-50 w-44 py-1.5 bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <MenuButton
            icon={Star}
            label="Add star"
            onClick={handleMenuAction(() => onStar?.(id))}
          />
          <MenuButton
            icon={Edit3}
            label="Rename"
            onClick={handleMenuAction(() => onRename?.(id))}
          />
          <MenuButton
            icon={Archive}
            label="Archive"
            onClick={handleMenuAction(() => onArchive?.(id))}
          />
          <div className="my-1.5 border-t border-slate-100" />
          <MenuButton
            icon={Trash2}
            label="Delete"
            onClick={handleMenuAction(() => onDelete?.(id))}
            variant="danger"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

interface MenuButtonProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

const MenuButton = ({ icon: Icon, label, onClick, variant = 'default' }: MenuButtonProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
      variant === 'danger'
        ? 'text-red-600 hover:bg-red-50'
        : 'text-secondary hover:bg-slate-50 hover:text-primary'
    }`}
  >
    <Icon size={15} strokeWidth={1.5} />
    <span>{label}</span>
  </button>
);
