import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { ReactNode } from 'react';
import { ICON } from '../../utils/iconSizes';

interface ArtifactPanelProps {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export const ArtifactPanel = ({
    isOpen,
    title,
    children,
    onClose,
    isExpanded = false,
    onToggleExpand,
}: ArtifactPanelProps) => {

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: isExpanded ? '50%' : 420, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                    className="h-full flex flex-col shrink-0 overflow-hidden relative z-20"
                >
                    {/* Inset panel container */}
                    <div className="relative w-full h-full flex flex-col bg-white rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-slate-200/50 overflow-hidden">
                        {/* Inner inset shadow */}
                        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)] pointer-events-none z-20" />

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm z-10">
                            <h2 className="font-medium text-primary truncate pr-4">{title}</h2>
                            <div className="flex items-center gap-1 shrink-0">
                                {onToggleExpand && (
                                    <button
                                        onClick={onToggleExpand}
                                        className="p-2 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? <Minimize2 size={ICON.size.md} strokeWidth={ICON.stroke} /> : <Maximize2 size={ICON.size.md} strokeWidth={ICON.stroke} />}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={ICON.size.md} strokeWidth={ICON.stroke} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto relative bg-slate-50/30">
                            {children}
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};
