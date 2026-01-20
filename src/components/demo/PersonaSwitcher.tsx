// PersonaSwitcher - Demo mode persona selection UI
import { useState, useRef, useEffect } from 'react';
import { User, Shield, Users, ChevronDown, Check } from 'lucide-react';
import { useSession, type DemoPersona } from '../../hooks/useSession';

// ══════════════════════════════════════════════════════════════════
// Persona Configuration
// ══════════════════════════════════════════════════════════════════

interface PersonaConfig {
  id: DemoPersona;
  label: string;
  description: string;
  icon: typeof User;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Sarah Chen - Full access',
    icon: Shield,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    id: 'approver',
    label: 'Approver',
    description: 'Michael Torres - Can approve requests',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'member',
    label: 'Member',
    description: 'Emily Watson - Standard user',
    icon: User,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
];

// ══════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════

export function PersonaSwitcher() {
  const { persona, switchPersona, isLoading, user, isDemoMode } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  // NOTE: This hook must be called before any early returns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if not in demo mode (after all hooks)
  if (!isDemoMode) {
    return null;
  }

  const currentPersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[2];
  const Icon = currentPersona.icon;

  // Handle persona switch
  async function handleSwitch(newPersona: DemoPersona) {
    if (newPersona === persona || isSwitching) return;

    setIsSwitching(true);
    setIsOpen(false);

    try {
      await switchPersona(newPersona);
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div ref={dropdownRef} className="fixed bottom-4 right-4 z-50">
      {/* Demo mode badge */}
      <div className="absolute -top-6 left-0 right-0 text-center">
        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          DEMO MODE
        </span>
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isSwitching}
        className={`
          flex items-center gap-2 px-3 py-2.5 rounded-xl
          ${currentPersona.bgColor} ${currentPersona.borderColor}
          border shadow-lg hover:shadow-xl transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className={`w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center`}>
          <Icon size={18} strokeWidth={1.5} className={currentPersona.color} />
        </div>
        <div className="text-left">
          <div className={`text-[13px] font-medium ${currentPersona.color}`}>
            {currentPersona.label}
          </div>
          <div className="text-[11px] text-slate-500 max-w-[140px] truncate">
            {user?.profile?.displayName || currentPersona.description}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`${currentPersona.color} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Switch Persona
            </div>
          </div>

          <div className="py-1">
            {PERSONAS.map((p) => {
              const PersonaIcon = p.icon;
              const isActive = p.id === persona;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSwitch(p.id)}
                  disabled={isSwitching}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left
                    hover:bg-slate-50 transition-colors
                    ${isActive ? 'bg-slate-50' : ''}
                    disabled:opacity-50
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg ${p.bgColor} flex items-center justify-center`}>
                    <PersonaIcon size={16} strokeWidth={1.5} className={p.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium ${p.color}`}>{p.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.description}</div>
                  </div>
                  {isActive && (
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
            <div className="text-[10px] text-slate-400">
              Switching persona creates a new session
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
