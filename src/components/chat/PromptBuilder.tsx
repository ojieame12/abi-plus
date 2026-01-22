import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  TrendingUp,
  Building2,
  Zap,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  type BuilderSelection,
  type BuilderDomain,
  type BuilderOption,
  BUILDER_DOMAINS,
  getSubjectsForDomain,
  getActionsForSubject,
  getModifiersForPath,
  buildPrompt,
} from '../../services/promptBuilder';
import { routeBuilderSelection, isSelectionComplete } from '../../services/promptBuilder/BuilderRouter';

// ============================================
// TYPES
// ============================================

interface PromptBuilderProps {
  onSubmit: (prompt: string, routeResult: ReturnType<typeof routeBuilderSelection>) => void;
  isDisabled?: boolean;
}

// ============================================
// ICON MAPPING
// ============================================

const domainIcons: Record<string, typeof Shield> = {
  risk: Shield,
  market: TrendingUp,
  suppliers: Building2,
  actions: Zap,
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

const levelVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
};

// ============================================
// CHIP COMPONENT
// ============================================

interface ChipProps {
  option: BuilderOption;
  isSelected: boolean;
  onClick: () => void;
  Icon?: typeof Shield;
  variant?: 'default' | 'domain';
}

const Chip = ({ option, isSelected, onClick, Icon, variant = 'default' }: ChipProps) => {
  const baseClasses = `
    inline-flex items-center gap-2 px-3 py-1.5 rounded-full
    text-sm font-medium cursor-pointer select-none
    transition-all duration-200 ease-out
    border
  `;

  const selectedClasses = `
    bg-violet-50 border-violet-200 text-violet-700
    shadow-sm
  `;

  const unselectedClasses = `
    bg-white/80 border-slate-200 text-slate-600
    hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700
  `;

  const domainSelectedClasses = `
    bg-gradient-to-r from-violet-500 to-purple-500
    border-transparent text-white shadow-md
  `;

  const domainUnselectedClasses = `
    bg-white border-slate-200 text-slate-600
    hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600
  `;

  const classes = variant === 'domain'
    ? `${baseClasses} ${isSelected ? domainSelectedClasses : domainUnselectedClasses}`
    : `${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`;

  return (
    <motion.button
      variants={chipVariants}
      onClick={onClick}
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {option.label}
    </motion.button>
  );
};

// ============================================
// MODIFIER INPUT COMPONENT
// ============================================

interface ModifierInputProps {
  config: ReturnType<typeof getModifiersForPath>[0];
  value: string;
  onChange: (value: string) => void;
}

const ModifierInput = ({ config, value, onChange }: ModifierInputProps) => {
  if (config.type === 'text') {
    return (
      <motion.div variants={chipVariants} className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{config.label}:</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="
            px-3 py-1.5 rounded-lg text-sm
            border border-slate-200 bg-white/80
            focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
            placeholder:text-slate-300
            min-w-[160px]
          "
        />
      </motion.div>
    );
  }

  return (
    <motion.div variants={chipVariants} className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{config.label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          px-3 py-1.5 rounded-lg text-sm font-medium
          border border-slate-200 bg-white/80 text-slate-600
          focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300
          cursor-pointer appearance-none
          pr-8
        "
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          backgroundSize: '16px',
        }}
      >
        <option value="">Select...</option>
        {config.options?.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </motion.div>
  );
};

// ============================================
// SELECTION BREADCRUMB
// ============================================

interface SelectionBreadcrumbProps {
  selection: BuilderSelection;
  onReset: () => void;
  onResetToLevel: (level: 'domain' | 'subject' | 'action') => void;
}

const SelectionBreadcrumb = ({ selection, onReset, onResetToLevel }: SelectionBreadcrumbProps) => {
  const parts: { level: 'domain' | 'subject' | 'action'; label: string }[] = [];

  if (selection.domain) {
    const domain = BUILDER_DOMAINS.find(d => d.id === selection.domain);
    if (domain) parts.push({ level: 'domain', label: domain.label });
  }

  if (selection.subject) {
    const subjects = selection.domain ? getSubjectsForDomain(selection.domain) : [];
    const subject = subjects.find(s => s.id === selection.subject);
    if (subject) parts.push({ level: 'subject', label: subject.label });
  }

  if (selection.action) {
    const actions = selection.domain && selection.subject
      ? getActionsForSubject(selection.domain, selection.subject)
      : [];
    const action = actions.find(a => a.id === selection.action);
    if (action) parts.push({ level: 'action', label: action.label });
  }

  if (parts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
      {parts.map((part, index) => (
        <div key={part.level} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={12} className="text-slate-300" />}
          <button
            onClick={() => onResetToLevel(part.level)}
            className="hover:text-violet-500 transition-colors"
          >
            {part.label}
          </button>
        </div>
      ))}
      <button
        onClick={onReset}
        className="ml-2 p-0.5 rounded hover:bg-slate-100 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ============================================
// MAIN PROMPT BUILDER COMPONENT
// ============================================

export const PromptBuilder = ({ onSubmit, isDisabled = false }: PromptBuilderProps) => {
  const [selection, setSelection] = useState<BuilderSelection>({
    domain: null,
    subject: null,
    action: null,
    modifiers: {},
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Get current level options
  const subjects = selection.domain ? getSubjectsForDomain(selection.domain) : [];
  const actions = selection.domain && selection.subject
    ? getActionsForSubject(selection.domain, selection.subject)
    : [];
  const modifiers = selection.domain && selection.subject && selection.action
    ? getModifiersForPath(selection.domain, selection.subject, selection.action)
    : [];

  // Current level to show
  const currentLevel = useMemo(() => {
    if (!selection.domain) return 'domain';
    if (!selection.subject) return 'subject';
    if (!selection.action) return 'action';
    return 'modifiers';
  }, [selection.domain, selection.subject, selection.action]);

  // Check if we can submit
  const canSubmit = isSelectionComplete(selection);

  // Generate preview prompt
  const previewPrompt = useMemo(() => {
    if (!canSubmit) return '';
    return buildPrompt(selection);
  }, [selection, canSubmit]);

  // Handlers
  const handleDomainSelect = useCallback((domain: BuilderDomain) => {
    setSelection({
      domain,
      subject: null,
      action: null,
      modifiers: {},
    });
  }, []);

  const handleSubjectSelect = useCallback((subject: string) => {
    setSelection(prev => ({
      ...prev,
      subject,
      action: null,
      modifiers: {},
    }));
  }, []);

  const handleActionSelect = useCallback((action: string) => {
    setSelection(prev => ({
      ...prev,
      action,
    }));
  }, []);

  const handleModifierChange = useCallback((key: string, value: string) => {
    setSelection(prev => ({
      ...prev,
      modifiers: {
        ...prev.modifiers,
        [key]: value,
      },
    }));
  }, []);

  const handleReset = useCallback(() => {
    setSelection({
      domain: null,
      subject: null,
      action: null,
      modifiers: {},
    });
  }, []);

  const handleResetToLevel = useCallback((level: 'domain' | 'subject' | 'action') => {
    if (level === 'domain') {
      setSelection(prev => ({
        ...prev,
        subject: null,
        action: null,
        modifiers: {},
      }));
    } else if (level === 'subject') {
      setSelection(prev => ({
        ...prev,
        action: null,
        modifiers: {},
      }));
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isDisabled) return;

    const routeResult = routeBuilderSelection(selection);
    const prompt = previewPrompt;

    onSubmit(prompt, routeResult);

    // Reset after submit
    handleReset();
    setIsExpanded(false);
  }, [canSubmit, isDisabled, selection, previewPrompt, onSubmit, handleReset]);

  // Collapsed state - show trigger button
  if (!isExpanded) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsExpanded(true)}
        className="
          inline-flex items-center gap-2 px-4 py-2 rounded-full
          bg-gradient-to-r from-violet-500/10 to-purple-500/10
          border border-violet-200/50
          text-violet-600 text-sm font-medium
          hover:from-violet-500/20 hover:to-purple-500/20
          hover:border-violet-300/50
          transition-all duration-200
          shadow-sm
        "
      >
        <Sparkles size={16} strokeWidth={2} />
        <span>Build a prompt</span>
      </motion.button>
    );
  }

  // Expanded state - show builder
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-slate-700">Prompt Builder</span>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            handleReset();
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Breadcrumb */}
      {(selection.domain || selection.subject || selection.action) && (
        <div className="px-4 pt-3">
          <SelectionBreadcrumb
            selection={selection}
            onReset={handleReset}
            onResetToLevel={handleResetToLevel}
          />
        </div>
      )}

      {/* Builder Levels */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {/* Level 1: Domain */}
          {currentLevel === 'domain' && (
            <motion.div
              key="domain"
              variants={levelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-xs text-slate-400 mb-3">What area do you want to explore?</p>
              <motion.div
                variants={containerVariants}
                className="flex flex-wrap gap-2"
              >
                {BUILDER_DOMAINS.map((domain) => {
                  const Icon = domainIcons[domain.id];
                  return (
                    <Chip
                      key={domain.id}
                      option={domain}
                      isSelected={selection.domain === domain.id}
                      onClick={() => handleDomainSelect(domain.id as BuilderDomain)}
                      Icon={Icon}
                      variant="domain"
                    />
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* Level 2: Subject */}
          {currentLevel === 'subject' && (
            <motion.div
              key="subject"
              variants={levelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-xs text-slate-400 mb-3">What specifically?</p>
              <motion.div
                variants={containerVariants}
                className="flex flex-wrap gap-2"
              >
                {subjects.map((subject) => (
                  <Chip
                    key={subject.id}
                    option={subject}
                    isSelected={selection.subject === subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Level 3: Action */}
          {currentLevel === 'action' && (
            <motion.div
              key="action"
              variants={levelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-xs text-slate-400 mb-3">What would you like to do?</p>
              <motion.div
                variants={containerVariants}
                className="flex flex-wrap gap-2"
              >
                {actions.map((action) => (
                  <Chip
                    key={action.id}
                    option={action}
                    isSelected={selection.action === action.id}
                    onClick={() => handleActionSelect(action.id)}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Level 4: Modifiers */}
          {currentLevel === 'modifiers' && (
            <motion.div
              key="modifiers"
              variants={levelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {modifiers.length > 0 && (
                <>
                  <p className="text-xs text-slate-400 mb-3">Add details (optional)</p>
                  <motion.div
                    variants={containerVariants}
                    className="flex flex-wrap gap-3 mb-4"
                  >
                    {modifiers.map((mod) => (
                      <ModifierInput
                        key={mod.id}
                        config={mod}
                        value={selection.modifiers[mod.id] || ''}
                        onChange={(value) => handleModifierChange(mod.id, value)}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview & Submit */}
      <AnimatePresence>
        {canSubmit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100"
          >
            <div className="px-4 py-3">
              {/* Preview */}
              <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Preview</p>
                <p className="text-sm text-slate-700 font-medium">{previewPrompt}</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                className="
                  w-full flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl
                  bg-gradient-to-r from-violet-500 to-purple-500
                  text-white text-sm font-medium
                  hover:from-violet-600 hover:to-purple-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  shadow-md shadow-violet-500/20
                "
              >
                <span>Ask Abi</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
