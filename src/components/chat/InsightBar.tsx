import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, ChevronRight } from 'lucide-react';

interface InsightBarProps {
    text: string;
    detail?: string;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    delay?: number;
}

export const InsightBar = ({ text, detail, trend = 'neutral', onClick, delay = 0.4 }: InsightBarProps) => {
    const TrendIcon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : Minus;

    return (
        <motion.button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3.5
                bg-teal-50 border border-teal-100 rounded-xl
                ${onClick ? 'hover:bg-teal-100/70 hover:shadow-md cursor-pointer' : ''}
                transition-all text-left origin-left overflow-hidden group
            `}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
                delay,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
        >
            {/* Trend Icon */}
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
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trend === 'down' ? 'bg-teal-100' :
                    trend === 'up' ? 'bg-amber-100' :
                    'bg-slate-100'
                }`}>
                    <TrendIcon
                        size={16}
                        className={
                            trend === 'down' ? 'text-teal-600' :
                            trend === 'up' ? 'text-amber-600' :
                            'text-slate-500'
                        }
                        strokeWidth={2}
                    />
                </div>
            </motion.div>

            {/* Text Content */}
            <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    delay: delay + 0.15,
                    duration: 0.3,
                }}
            >
                <div className="text-sm font-medium text-slate-900">{text}</div>
                {detail && (
                    <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
                )}
            </motion.div>

            {/* Chevron for clickable */}
            {onClick && (
                <motion.div
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                >
                    <ChevronRight className="w-4 h-4 text-teal-500" strokeWidth={1.5} />
                </motion.div>
            )}
        </motion.button>
    );
};
