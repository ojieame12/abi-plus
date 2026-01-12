import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface TopMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
  answerCount: number;
  reputation?: number;
}

interface TopMembersSidebarProps {
  members: TopMember[];
  onMemberClick?: (memberId: string) => void;
}

// Generate avatar colors based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TopMembersSidebar({
  members,
  onMemberClick,
}: TopMembersSidebarProps) {
  const displayMembers = members.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.06)' }}
    >
      {/* Header */}
      <div className="px-5 py-3 bg-[#FAFBFD]">
        <h3 className="text-sm font-normal text-slate-700">Top Members</h3>
      </div>

      {/* Members list */}
      <div className="px-5 py-3">
        {displayMembers.map((member, index) => (
          <motion.button
            key={member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.03 }}
            onClick={() => onMemberClick?.(member.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                       hover:bg-slate-50 transition-colors text-left group"
          >
            {/* Avatar with badge */}
            <div className="relative flex-shrink-0 w-10 h-10">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                             text-white text-sm font-light ${getAvatarColor(member.displayName)}`}
                >
                  {getInitials(member.displayName)}
                </div>
              )}
              {/* Badge */}
              {(member.reputation ?? 0) > 100 && (
                <img
                  src={`/badges/badge-${((member.reputation ?? 0) % 5) + 1}.png`}
                  alt="Badge"
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 object-contain"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-normal text-slate-900 truncate">
                {member.displayName}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MessageCircle size={12} className="text-violet-500" />
                <span>{member.answerCount} Answers</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
