import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Globe, X, Paperclip, Brain, Zap, FileText, Database, Search, MessageSquare, Sparkles, Puzzle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    type BuilderSelection,
    type BuilderDomain,
    BUILDER_DOMAINS,
    getSubjectsForDomain,
    getActionsForSubject,
    buildPrompt,
} from '../../services/promptBuilder';

interface AttachedFile {
    id: string;
    name: string;
    size: string;
    type: 'csv' | 'xlsx' | 'pdf' | 'doc' | 'other';
}

interface SourceCount {
    web?: number;
    internal?: number;
}

export type InputMode = 'ask' | 'find';

interface ChatInputProps {
    onSend?: (message: string, files: AttachedFile[], inputMode: InputMode) => void;
    onFocusChange?: (focused: boolean) => void;
    onMessageChange?: (message: string) => void;
    onModeChange?: (mode: 'fast' | 'reasoning') => void;
    onWebSearchChange?: (enabled: boolean) => void;
    onInputModeChange?: (mode: InputMode) => void;
    placeholder?: string;
    value?: string;
    mode?: 'fast' | 'reasoning';
    webSearchEnabled?: boolean;
    inputMode?: InputMode;
    disabled?: boolean;
    variant?: 'default' | 'compact';
    sources?: SourceCount;
    showModeToggle?: boolean; // Show Ask/Find toggle (only on home/new chat)
}

export const ChatInput = ({
    onSend,
    onFocusChange,
    onMessageChange,
    onModeChange,
    onWebSearchChange,
    onInputModeChange,
    placeholder,
    value,
    mode: externalMode,
    webSearchEnabled: externalWebSearch,
    inputMode: externalInputMode,
    disabled = false,
    variant = 'default',
    sources,
    showModeToggle = false,
}: ChatInputProps) => {
    const [internalMessage, setInternalMessage] = useState('');
    const message = value !== undefined ? value : internalMessage;
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [internalWebSearch, setInternalWebSearch] = useState(false);
    const [internalMode, setInternalMode] = useState<'fast' | 'reasoning'>('fast');
    const [internalInputMode, setInternalInputMode] = useState<InputMode>('ask');
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [builderMode, setBuilderMode] = useState(false);
    const [builderSelection, setBuilderSelection] = useState<BuilderSelection>({
        domain: null,
        subject: null,
        action: null,
        modifiers: {},
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use external state if provided, otherwise use internal
    const webSearchEnabled = externalWebSearch !== undefined ? externalWebSearch : internalWebSearch;
    const mode = externalMode !== undefined ? externalMode : internalMode;
    const inputMode = externalInputMode !== undefined ? externalInputMode : internalInputMode;

    // Dynamic placeholder based on input mode
    const dynamicPlaceholder = placeholder ?? (inputMode === 'ask'
        ? "Ask anything about your suppliers..."
        : "Search for reports, charts, documents...");

    const handleWebSearchToggle = () => {
        const newValue = !webSearchEnabled;
        if (externalWebSearch === undefined) {
            setInternalWebSearch(newValue);
        }
        onWebSearchChange?.(newValue);
    };

    const handleModeChange = (newMode: 'fast' | 'reasoning') => {
        if (externalMode === undefined) {
            setInternalMode(newMode);
        }
        onModeChange?.(newMode);
    };

    const handleInputModeChange = (newMode: InputMode) => {
        if (externalInputMode === undefined) {
            setInternalInputMode(newMode);
        }
        onInputModeChange?.(newMode);
    };

    const handleFocus = () => {
        setIsFocused(true);
        onFocusChange?.(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        onFocusChange?.(false);
    };

    const handleMessageChange = (newValue: string) => {
        if (value === undefined) {
            setInternalMessage(newValue);
        }
        onMessageChange?.(newValue);
    };

    const handleSend = () => {
        if (message.trim() || attachedFiles.length > 0) {
            onSend?.(message, attachedFiles, inputMode);
            if (value === undefined) {
                setInternalMessage('');
            }
            setAttachedFiles([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles: AttachedFile[] = Array.from(files).map((file, index) => ({
                id: `${Date.now()}-${index}`,
                name: file.name,
                size: formatFileSize(file.size),
                type: getFileType(file.name),
            }));
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
        setShowPlusMenu(false);
    };

    const removeFile = (id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    };

    // Builder mode handlers
    const handleBuilderToggle = () => {
        if (builderMode) {
            // Turning off - reset builder state
            setBuilderSelection({ domain: null, subject: null, action: null, modifiers: {} });
        }
        setBuilderMode(!builderMode);
    };

    const handleDomainSelect = (domain: BuilderDomain) => {
        setBuilderSelection({ domain, subject: null, action: null, modifiers: {} });
    };

    const handleSubjectSelect = (subject: string) => {
        setBuilderSelection(prev => ({ ...prev, subject, action: null, modifiers: {} }));
    };

    const handleActionSelect = (action: string) => {
        const newSelection = { ...builderSelection, action };
        setBuilderSelection(newSelection);
        // Generate and set the prompt
        const prompt = buildPrompt(newSelection);
        if (prompt) {
            handleMessageChange(prompt);
            // Auto-exit builder mode after selection complete
            setTimeout(() => {
                setBuilderMode(false);
                setBuilderSelection({ domain: null, subject: null, action: null, modifiers: {} });
            }, 100);
        }
    };

    const handleBuilderReset = () => {
        setBuilderSelection({ domain: null, subject: null, action: null, modifiers: {} });
    };

    const handleBuilderBack = () => {
        if (builderSelection.action) {
            setBuilderSelection(prev => ({ ...prev, action: null }));
        } else if (builderSelection.subject) {
            setBuilderSelection(prev => ({ ...prev, subject: null }));
        } else if (builderSelection.domain) {
            setBuilderSelection(prev => ({ ...prev, domain: null }));
        }
    };

    // Builder derived state
    const builderSubjects = builderSelection.domain ? getSubjectsForDomain(builderSelection.domain) : [];
    const builderActions = builderSelection.domain && builderSelection.subject
        ? getActionsForSubject(builderSelection.domain, builderSelection.subject)
        : [];
    const builderLevel = !builderSelection.domain ? 'domain'
        : !builderSelection.subject ? 'subject'
        : !builderSelection.action ? 'action'
        : 'complete';

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + 'b';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + 'kb';
        return (bytes / (1024 * 1024)).toFixed(1) + 'mb';
    };

    const getFileType = (filename: string): AttachedFile['type'] => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'csv') return 'csv';
        if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
        if (ext === 'pdf') return 'pdf';
        if (ext === 'doc' || ext === 'docx') return 'doc';
        return 'other';
    };

    // Compact variant
    if (variant === 'compact') {
        return (
            <div className="w-full relative">
                {/* Gradient fade above input - fades content into white */}
                <div className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none" />

                <div className={`bg-white/80 backdrop-blur-xl rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] transition-all ${
                    isFocused ? 'border-violet-300 shadow-[0_8px_30px_rgb(0,0,0,0.08)]' : 'border-white/60'
                }`}>
                    {/* File Attachments - shows above input if any */}
                    {attachedFiles.length > 0 && (
                        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 border-b border-slate-100">
                            {attachedFiles.map(file => (
                                <FileChipCompact key={file.id} file={file} onRemove={() => removeFile(file.id)} />
                            ))}
                        </div>
                    )}

                    {/* Single row compact layout */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                        {/* Plus Button with Dropdown - opens UPWARD */}
                        <div className="relative">
                            <ToolbarButton
                                icon={Plus}
                                onClick={() => setShowPlusMenu(!showPlusMenu)}
                                isActive={showPlusMenu}
                            />
                            {showPlusMenu && (
                                <DropdownMenuUp onClose={() => setShowPlusMenu(false)}>
                                    <DropdownItem
                                        icon={Paperclip}
                                        label="Attach File"
                                        onClick={() => fileInputRef.current?.click()}
                                    />
                                </DropdownMenuUp>
                            )}
                        </div>

                        {/* Input Field */}
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => handleMessageChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />

                        {/* Right side controls - same as default variant */}
                        <div className="flex items-center gap-1.5">
                            {/* Web Search Toggle - same component as default */}
                            <div className="relative group">
                                <ToolbarButton
                                    icon={Globe}
                                    onClick={handleWebSearchToggle}
                                    isActive={webSearchEnabled}
                                />
                                <Tooltip>Include Internet Sources</Tooltip>
                            </div>

                            {/* Thinking Mode Toggle - same component as default */}
                            <ThinkingModeToggle mode={mode} onModeChange={handleModeChange} />

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() && attachedFiles.length === 0}
                                className="w-9 h-9 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.2731 10.786C17.6085 10.6183 17.8203 10.2755 17.8203 9.90048C17.8203 9.52549 17.6085 9.18269 17.2731 9.015L3.41305 2.085C3.0619 1.90942 2.64017 1.95794 2.33806 2.20867C2.03595 2.45939 1.91055 2.86496 2.0184 3.24245L3.43269 8.19244C3.55412 8.61745 3.94258 8.91047 4.38459 8.91047H8.91031C9.45707 8.91047 9.90031 9.35371 9.90031 9.90047C9.90031 10.4472 9.45707 10.8905 8.91031 10.8905H4.3846C3.94258 10.8905 3.55412 11.1835 3.43269 11.6085L2.0184 16.5585C1.91055 16.936 2.03595 17.3416 2.33806 17.5923C2.64017 17.843 3.0619 17.8915 3.41305 17.716L17.2731 10.786Z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        );
    }

    // Default variant
    return (
        <div className="w-full overflow-visible">
            <div className={`bg-white rounded-2xl border shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] transition-colors overflow-visible ${
                isFocused ? 'border-violet-500' : 'border-slate-200/60'
            }`}>
                {/* File Attachments */}
                {attachedFiles.length > 0 && (
                    <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2 border-b border-slate-100">
                        {attachedFiles.map(file => (
                            <FileChip key={file.id} file={file} onRemove={() => removeFile(file.id)} />
                        ))}
                    </div>
                )}

                {/* Text Input / Builder Area */}
                <div className={`px-5 pt-4 pb-3 relative transition-all duration-200 ${builderMode ? 'min-h-[140px]' : ''}`} style={{ minHeight: builderMode ? '140px' : '100px' }}>
                    <AnimatePresence mode="wait">
                        {builderMode ? (
                            <motion.div
                                key="builder"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="w-full"
                            >
                                {/* Breadcrumb trail */}
                                {builderSelection.domain && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                                        <button
                                            onClick={handleBuilderReset}
                                            className="hover:text-violet-500 transition-colors"
                                        >
                                            {BUILDER_DOMAINS.find(d => d.id === builderSelection.domain)?.label}
                                        </button>
                                        {builderSelection.subject && (
                                            <>
                                                <ChevronRight size={12} className="text-slate-300" />
                                                <button
                                                    onClick={() => setBuilderSelection(prev => ({ ...prev, action: null }))}
                                                    className="hover:text-violet-500 transition-colors"
                                                >
                                                    {builderSubjects.find(s => s.id === builderSelection.subject)?.label}
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={handleBuilderBack}
                                            className="ml-2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                {/* Level chips */}
                                <div className="flex flex-wrap gap-2.5">
                                    {builderLevel === 'domain' && BUILDER_DOMAINS.map(domain => (
                                        <BuilderChip
                                            key={domain.id}
                                            label={domain.label}
                                            onClick={() => handleDomainSelect(domain.id as BuilderDomain)}
                                        />
                                    ))}
                                    {builderLevel === 'subject' && builderSubjects.map(subject => (
                                        <BuilderChip
                                            key={subject.id}
                                            label={subject.label}
                                            onClick={() => handleSubjectSelect(subject.id)}
                                        />
                                    ))}
                                    {builderLevel === 'action' && builderActions.map(action => (
                                        <BuilderChip
                                            key={action.id}
                                            label={action.label}
                                            onClick={() => handleActionSelect(action.id)}
                                        />
                                    ))}
                                </div>

                                {/* Helper text */}
                                <p className="text-[15px] text-slate-400 mt-4">
                                    {builderLevel === 'domain' && 'What area do you want to explore?'}
                                    {builderLevel === 'subject' && 'What specifically?'}
                                    {builderLevel === 'action' && 'What would you like to do?'}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="textarea"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                <textarea
                                    value={message}
                                    onChange={(e) => handleMessageChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    placeholder={dynamicPlaceholder}
                                    rows={3}
                                    className="w-full resize-none bg-transparent text-primary placeholder:text-muted focus:outline-none text-[15px] pr-14"
                                    style={{ minHeight: '72px', maxHeight: '180px' }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floating Search Toggle - positioned top right */}
                    {showModeToggle && !builderMode && (
                        <div className="absolute right-5 top-4">
                            <InputModeToggle
                                mode={inputMode}
                                onModeChange={handleInputModeChange}
                            />
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    {/* Left Actions */}
                    <div className="flex items-center gap-1.5">
                        {/* Plus Button with Dropdown */}
                        <div className="relative">
                            <ToolbarButton
                                icon={Plus}
                                onClick={() => setShowPlusMenu(!showPlusMenu)}
                                isActive={showPlusMenu}
                            />
                            {showPlusMenu && (
                                <DropdownMenu onClose={() => setShowPlusMenu(false)}>
                                    <DropdownItem
                                        icon={Paperclip}
                                        label="Upload Files"
                                        onClick={() => fileInputRef.current?.click()}
                                    />
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Web Search Toggle */}
                        <div className="relative group">
                            <ToolbarButton
                                icon={Globe}
                                onClick={handleWebSearchToggle}
                                isActive={webSearchEnabled}
                            />
                            <Tooltip>Include Internet Sources</Tooltip>
                        </div>

                        {/* Builder Mode Toggle */}
                        <div className="relative group">
                            <ToolbarButton
                                icon={Puzzle}
                                onClick={handleBuilderToggle}
                                isActive={builderMode}
                            />
                            <Tooltip>{builderMode ? 'Exit builder' : 'Build a prompt'}</Tooltip>
                        </div>

                        {/* Thinking Mode Toggle */}
                        <ThinkingModeToggle mode={mode} onModeChange={handleModeChange} />
                    </div>

                    {/* Send Button - color changes based on mode, icon stays the same */}
                    <button
                        onClick={handleSend}
                        disabled={!message.trim() && attachedFiles.length === 0}
                        className={`w-9 h-9 rounded-xl text-white flex items-center justify-center transition-colors shadow-sm ${
                            inputMode === 'find'
                                ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'
                                : 'bg-[#4A00F8] hover:bg-[#3D00D4] disabled:bg-[#4A00F8]/40'
                        } disabled:cursor-not-allowed`}
                    >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.2731 10.786C17.6085 10.6183 17.8203 10.2755 17.8203 9.90048C17.8203 9.52549 17.6085 9.18269 17.2731 9.015L3.41305 2.085C3.0619 1.90942 2.64017 1.95794 2.33806 2.20867C2.03595 2.45939 1.91055 2.86496 2.0184 3.24245L3.43269 8.19244C3.55412 8.61745 3.94258 8.91047 4.38459 8.91047H8.91031C9.45707 8.91047 9.90031 9.35371 9.90031 9.90047C9.90031 10.4472 9.45707 10.8905 8.91031 10.8905H4.3846C3.94258 10.8905 3.55412 11.1835 3.43269 11.6085L2.0184 16.5585C1.91055 16.936 2.03595 17.3416 2.33806 17.5923C2.64017 17.843 3.0619 17.8915 3.41305 17.716L17.2731 10.786Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

// Toolbar Button Component
const ToolbarButton = ({ icon: Icon, onClick, isActive }: { icon: any; onClick: () => void; isActive?: boolean }) => (
    <button
        onClick={onClick}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
            isActive
                ? 'bg-violet-50 text-violet-600 border-violet-600'
                : 'text-secondary hover:text-primary hover:bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
    >
        <Icon size={18} strokeWidth={1.5} />
    </button>
);

// File Chip Component
const FileChip = ({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) => {
    const getFileBadge = () => {
        switch (file.type) {
            case 'csv':
            case 'xlsx':
                return (
                    <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
                        <span className="text-[8px] font-medium text-white leading-none">XLS</span>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center">
                        <span className="text-[8px] font-medium text-white leading-none">PDF</span>
                    </div>
                );
            default:
                return (
                    <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
                        <span className="text-[8px] font-medium text-white leading-none">FILE</span>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            {getFileBadge()}
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-primary leading-tight truncate max-w-[120px]">{file.name}</span>
                <span className="text-xs text-muted">{file.size}</span>
            </div>
            <button
                onClick={onRemove}
                className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-slate-100 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

// Compact File Chip Component
const FileChipCompact = ({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) => (
    <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
        <span className="text-slate-600 truncate max-w-[100px]">{file.name}</span>
        <button
            onClick={onRemove}
            className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
            <X size={10} strokeWidth={2} />
        </button>
    </div>
);

// Dropdown Menu Component (opens downward)
const DropdownMenu = ({ children, onClose, align = 'left' }: { children: React.ReactNode; onClose: () => void; align?: 'left' | 'right' }) => (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 min-w-[160px]`}>
            {children}
        </div>
    </>
);

// Dropdown Menu Component (opens UPWARD - for bottom-pinned inputs)
const DropdownMenuUp = ({ children, onClose, align = 'left' }: { children: React.ReactNode; onClose: () => void; align?: 'left' | 'right' }) => (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className={`absolute bottom-full mb-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 min-w-[160px]`}>
            {children}
        </div>
    </>
);

// Dropdown Item Component
const DropdownItem = ({ icon: Icon, label, onClick, isSelected }: { icon?: any; label: string; onClick: () => void; isSelected?: boolean }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
            isSelected ? 'text-violet-600 font-medium' : 'text-primary'
        }`}
    >
        {Icon && <Icon size={16} strokeWidth={1.5} />}
        <span>{label}</span>
    </button>
);

// Tooltip Component
const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-900 rotate-45" />
    </div>
);

// Thinking Mode Toggle Component
interface ThinkingModeToggleProps {
    mode?: 'fast' | 'reasoning';
    onModeChange?: (mode: 'fast' | 'reasoning') => void;
}

const ThinkingModeToggle = ({ mode = 'fast', onModeChange }: ThinkingModeToggleProps) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Outer container - matches toolbar button height */}
            <div className="relative flex items-center h-9 p-0.5 bg-slate-50 border border-slate-200 rounded-xl">
                {/* Sliding indicator */}
                <div
                    className={`absolute top-1 h-7 w-8 bg-white rounded-lg shadow-sm border border-slate-200/80 transition-all duration-200 ease-out ${
                        mode === 'fast' ? 'left-1' : 'left-[calc(50%)]'
                    }`}
                />

                {/* Fast Mode */}
                <button
                    onClick={() => onModeChange?.('fast')}
                    className={`relative z-10 w-9 h-8 flex items-center justify-center transition-colors duration-200 ${
                        mode === 'fast' ? 'text-primary' : 'text-muted hover:text-secondary'
                    }`}
                >
                    <Zap size={18} strokeWidth={1.5} />
                </button>

                {/* Reasoning Mode */}
                <button
                    onClick={() => onModeChange?.('reasoning')}
                    className={`relative z-10 w-9 h-8 flex items-center justify-center transition-colors duration-200 ${
                        mode === 'reasoning' ? 'text-violet-600' : 'text-muted hover:text-secondary'
                    }`}
                >
                    <Brain size={18} strokeWidth={1.5} />
                </button>
            </div>

            {/* Hover Tooltip */}
            {hovered && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none">
                    {mode === 'fast' ? 'Fast Response' : 'Deep Research'}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
            )}
        </div>
    );
};

// Search Mode Toggle - Single icon button (default is Ask mode)
interface InputModeToggleProps {
    mode: InputMode;
    onModeChange: (mode: InputMode) => void;
}

const InputModeToggle = ({ mode, onModeChange }: InputModeToggleProps) => {
    const isSearchMode = mode === 'find';

    return (
        <div className="relative group">
            <button
                onClick={() => onModeChange(isSearchMode ? 'ask' : 'find')}
                className={`
                    w-9 h-9 rounded-xl flex items-center justify-center transition-all border
                    ${isSearchMode
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-500'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }
                `}
            >
                <Search size={18} strokeWidth={1.5} />
            </button>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {isSearchMode ? 'Switch to Ask mode' : 'Search documents'}
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
        </div>
    );
};

// Builder Chip Component
const BuilderChip = ({ label, onClick, isSelected }: { label: string; onClick: () => void; isSelected?: boolean }) => (
    <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={onClick}
        className={`
            inline-flex items-center px-3.5 py-1.5 rounded-full
            text-sm font-medium cursor-pointer select-none
            transition-all duration-150 ease-out border
            ${isSelected
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
            }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        {label}
    </motion.button>
);
