import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const SkeletonLoader = ({
    width = '100%',
    height = 20,
    className = '',
    rounded = 'md',
}: SkeletonLoaderProps) => {
    const roundedClass = {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
    };

    return (
        <div
            className={`relative overflow-hidden bg-slate-200 ${roundedClass[rounded]} ${className}`}
            style={{ width, height }}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
};

// Skeleton for header title that resolves to actual text
interface SkeletonTextProps {
    text: string;
    isLoading: boolean;
    className?: string;
}

export const SkeletonText = ({ text, isLoading, className = '' }: SkeletonTextProps) => {
    return (
        <div className={`relative ${className}`}>
            {isLoading ? (
                <SkeletonLoader width={200} height={20} rounded="md" />
            ) : (
                <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {text}
                </motion.span>
            )}
        </div>
    );
};
