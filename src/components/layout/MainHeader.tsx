import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { CreditTicker } from '../subscription/CreditTicker';
import type { CompanySubscription } from '../../types/subscription';

interface MainHeaderProps {
    variant?: 'home' | 'conversation' | 'transitioning';
    isSidebarExpanded?: boolean;
    conversationTitle?: string;
    notificationCount?: number;
    isLoading?: boolean;
    // Subscription/credits (Phase 2)
    subscription?: CompanySubscription;
    onCreditsClick?: () => void;
    onNotificationsClick?: () => void;
}

export const MainHeader = ({
    variant = 'home',
    isSidebarExpanded = false,
    conversationTitle = '',
    notificationCount = 0,
    isLoading = false,
    subscription,
    onCreditsClick,
    onNotificationsClick,
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
                        /* Other pages: Filled logo */
                        <motion.div
                            key="page-logo"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <img
                                src="/logo-white.svg fill.svg"
                                alt="Abi"
                                className="h-[22px]"
                            />
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
                            <button
                                onClick={onNotificationsClick}
                                className="relative w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors"
                            >
                                <Bell size={16} strokeWidth={1.5} />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-violet-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>
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
                                    <button
                                        onClick={onNotificationsClick}
                                        className="relative w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        <Bell size={16} strokeWidth={1.5} />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-violet-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                                                {notificationCount > 9 ? '9+' : notificationCount}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};
