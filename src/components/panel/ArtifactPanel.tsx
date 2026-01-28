import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { ReactNode } from 'react';
import { ICON } from '../../utils/iconSizes';
import { LayerBadge } from '../ui/LayerBadge';
import type { ContentLayer, LayerMetadata } from '../../types/layers';

interface ArtifactPanelProps {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    defaultWidth?: '40%' | '45%' | '50%' | '60%' | '100%';
    allowExpand?: boolean;
    // Content layer provenance
    contentLayer?: ContentLayer;
    layerMetadata?: LayerMetadata;
}

export const ArtifactPanel = ({
    isOpen,
    title,
    children,
    onClose,
    isExpanded = false,
    onToggleExpand,
    defaultWidth = '40%',
    allowExpand = true,
    contentLayer,
    layerMetadata,
}: ArtifactPanelProps) => {
    // Only show expand button if allowExpand is true
    const showExpandButton = allowExpand && onToggleExpand;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                        width: isExpanded ? '100%' : defaultWidth,
                        opacity: 1,
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{
                        duration: 0.5,
                        ease: [0.32, 0.72, 0, 1], // Smooth custom ease matching MainLayout
                    }}
                    className="h-full flex flex-col overflow-hidden relative z-20 shrink-0"
                >
                    {/* Inset panel container */}
                    <div className={`relative w-full h-full flex flex-col bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-slate-200/50 overflow-hidden ${isExpanded ? 'rounded-none' : 'rounded-2xl'}`}>
                        {/* Inner inset shadow */}
                        <div className={`absolute inset-0 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)] pointer-events-none z-20 ${isExpanded ? 'rounded-none' : 'rounded-2xl'}`} />

                        {/* Header - compact */}
                        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                            <div className="flex items-center gap-2 min-w-0">
                                <h2 className="text-sm font-medium text-primary truncate">{title}</h2>
                                {/* Layer badge only shown for non-L1 (upgraded/managed/bespoke content) */}
                                {contentLayer && contentLayer !== 'L1' && (
                                    <LayerBadge
                                        layer={contentLayer}
                                        size="sm"
                                        variant="subtle"
                                        showTooltip={true}
                                        analystName={layerMetadata?.analystName}
                                        expertName={layerMetadata?.expertName}
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                                {showExpandButton && (
                                    <button
                                        onClick={onToggleExpand}
                                        className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? <Minimize2 size={ICON.size.md} strokeWidth={ICON.stroke} /> : <Maximize2 size={ICON.size.md} strokeWidth={ICON.stroke} />}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={ICON.size.md} strokeWidth={ICON.stroke} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto relative bg-slate-50/30">
                            <div className={`h-full ${isExpanded ? 'max-w-5xl mx-auto' : ''}`}>
                                {children}
                            </div>
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};
