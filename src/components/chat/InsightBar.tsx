// Insight Bar - Animated version with motion effects
import { motion } from 'framer-motion';

interface InsightBarProps {
    text: string;
    detail?: string;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    delay?: number;
}

export const InsightBar = ({ text, detail, onClick, delay = 0.4 }: InsightBarProps) => {
    return (
        <motion.button
            onClick={onClick}
            className={`
                w-full relative overflow-hidden rounded-2xl text-left
                bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600
                ${onClick ? 'hover:shadow-lg cursor-pointer' : ''}
                transition-all origin-left
            `}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
                delay,
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
        >
            {/* Background jellyfish image */}
            <img
                src="/Content Element4.png"
                alt=""
                className="absolute -right-4 -top-2 -bottom-2 h-[calc(100%+16px)] w-auto object-cover pointer-events-none"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 from-40% via-blue-600/70 via-60% to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex items-start gap-3.5 px-5 py-5">
                {/* Sparkle icon */}
                <motion.div
                    className="flex-shrink-0 mt-1"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        delay: delay + 0.2,
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                    }}
                >
                    <img
                        src="/sparkel.svg"
                        alt=""
                        className="w-5 h-5"
                    />
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
                    <div className="font-normal text-white text-lg leading-snug">{text}</div>
                    {detail && (
                        <div className="text-[13px] text-white/60 mt-1.5 leading-normal line-clamp-2">{detail}</div>
                    )}
                </motion.div>
            </div>
        </motion.button>
    );
};
