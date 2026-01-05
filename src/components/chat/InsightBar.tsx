import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface InsightBarProps {
    text: string;
    detail?: string;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    delay?: number; // Delay in seconds before animation starts
}

export const InsightBar = ({ text, detail, onClick, delay = 0.4 }: InsightBarProps) => {
    return (
        <motion.button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl
                ${onClick ? 'hover:bg-violet-100/70 hover:shadow-md cursor-pointer' : ''}
                transition-all text-left origin-left overflow-hidden group
            `}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
                delay,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
            }}
        >
            <motion.div
                className="flex-shrink-0"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    delay: delay + 0.2,
                    type: 'spring',
                    stiffness: 400,
                    damping: 15,
                }}
            >
                <img src="/grf.svg" alt="" className="w-5 h-5" />
            </motion.div>
            <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    delay: delay + 0.15,
                    duration: 0.3,
                }}
            >
                <div className="text-sm font-normal text-slate-900">{text}</div>
                {detail && (
                    <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
                )}
            </motion.div>
            {onClick && (
                <motion.div
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                >
                    <ChevronRight className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
                </motion.div>
            )}
        </motion.button>
    );
};
