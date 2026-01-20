import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageSquare, Globe, LayoutGrid } from 'lucide-react';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { CreditTicker } from '../subscription/CreditTicker';
import type { CompanySubscription } from '../../types/subscription';

interface MainHeaderProps {
    variant?: 'home' | 'conversation' | 'transitioning';
    isSidebarExpanded?: boolean;
    conversationTitle?: string;
    artifactCount?: number;
    notificationCount?: number;
    isLoading?: boolean;
    // Subscription/credits (Phase 2)
    subscription?: CompanySubscription;
    onCreditsClick?: () => void;
}

export const MainHeader = ({
    variant = 'home',
    isSidebarExpanded = false,
    conversationTitle = '',
    artifactCount = 0,
    notificationCount = 0,
    isLoading = false,
    subscription,
    onCreditsClick,
}: MainHeaderProps) => {
    const isHome = variant === 'home';
    const showLogo = isHome && !isSidebarExpanded;

    return (
        <header
            className={`sticky top-0 z-30 pt-4 pb-3 pl-4 pr-4 flex items-center justify-between transition-all duration-500 ${
                isHome
                    ? 'bg-transparent'
                    : 'bg-white/70 backdrop-blur-md border-b border-slate-100'
            }`}
        >
            {/* Left Section */}
            <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                    {isHome ? (
                        /* Home: Logo (hidden when sidebar expanded) */
                        <motion.div
                            key="home-logo"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: showLogo ? 1 : 0, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className={showLogo ? '' : 'pointer-events-none'}
                        >
                            <img
                                src="/logo-white.svg"
                                alt="Abi"
                                className="h-[45px]"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            />
                        </motion.div>
                    ) : (
                        /* Conversation: Pin Icon + Title (or skeleton) */
                        <motion.div
                            key="conversation-title"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                                className="shrink-0"
                            >
                                <img src="/Abi.svg" alt="" className="w-5 h-5" />
                            </motion.div>

                            {isLoading ? (
                                <SkeletonLoader width={220} height={18} rounded="md" />
                            ) : (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="text-sm font-medium text-primary truncate max-w-[300px]"
                                >
                                    {conversationTitle}
                                </motion.span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                    {isHome ? (
                        /* Home: Credits, Bell, Sources, Worldview */
                        <motion.div
                            key="home-actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2"
                        >
                            {subscription && (
                                <CreditTicker
                                    subscription={subscription}
                                    onClick={onCreditsClick}
                                    variant="default"
                                />
                            )}
                            <button className="relative w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors">
                                <Bell size={16} strokeWidth={1.5} />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full flex items-center justify-center border border-slate-200">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            <HeaderPill icon={MessageSquare} label="Sources" variant="light" />
                            <HeaderPill icon={Globe} label="Worldview" variant="light" />
                        </motion.div>
                    ) : (
                        /* Conversation: Credits (compact), Artifacts, Worldview */
                        <motion.div
                            key="conversation-actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <SkeletonLoader width={100} height={32} rounded="full" />
                                    <SkeletonLoader width={90} height={32} rounded="full" />
                                </>
                            ) : (
                                <>
                                    {subscription && (
                                        <CreditTicker
                                            subscription={subscription}
                                            onClick={onCreditsClick}
                                            variant="compact"
                                        />
                                    )}
                                    <HeaderPill icon={LayoutGrid} label={`${artifactCount} Artifacts`} variant="dark" />
                                    <HeaderPill icon={Globe} label="Worldview" variant="dark" />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

interface HeaderPillProps {
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    label: string;
    variant: 'light' | 'dark';
    onClick?: () => void;
}

const HeaderPill = ({ icon: Icon, label, variant, onClick }: HeaderPillProps) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            variant === 'light'
                ? 'text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-600'
                : 'bg-white text-secondary hover:bg-slate-50 border border-slate-200'
        }`}
    >
        <Icon size={15} strokeWidth={1.5} />
        <span>{label}</span>
    </button>
);
