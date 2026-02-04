import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Compass, Coins } from 'lucide-react';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import type { CompanySubscription } from '../../types/subscription';
import { formatCredits } from '../../types/subscription';

// Shared icon-button base styles per variant
const ICON_BTN = {
    home: 'w-9 h-9 rounded-full bg-white/40 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center text-slate-500 hover:bg-white/60 transition-all',
    conversation: 'w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-all',
} as const;

// Indicator dot — no numbers, just a colored dot
function IndicatorDot({ visible, color = 'emerald' }: { visible: boolean; color?: 'emerald' | 'violet' }) {
    if (!visible) return null;
    const bg = color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500';
    return (
        <span className={`absolute -top-0.5 -right-0.5 w-[10px] h-[10px] ${bg} rounded-full border-2 border-white`} />
    );
}

// Credit pill — glassmorphic on home, solid on conversation
function CreditPill({
    subscription,
    onClick,
    variant,
}: {
    subscription: CompanySubscription;
    onClick?: () => void;
    variant: 'home' | 'conversation';
}) {
    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-2 px-3.5 py-2 rounded-full transition-all
                ${variant === 'home'
                    ? 'bg-white/40 backdrop-blur-sm border-2 border-white/80 hover:bg-white/60'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }
            `}
        >
            <Coins className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-slate-600 tabular-nums">
                {formatCredits(subscription.remainingCredits)}
            </span>
        </button>
    );
}

interface MainHeaderProps {
    variant?: 'home' | 'conversation' | 'transitioning';
    isSidebarExpanded?: boolean;
    conversationTitle?: string;
    notificationCount?: number;
    interestCount?: number;
    isLoading?: boolean;
    // Subscription/credits (Phase 2)
    subscription?: CompanySubscription;
    onCreditsClick?: () => void;
    onWorldviewClick?: () => void;
    onNotificationsClick?: () => void;
    onLogoClick?: () => void;
    artifactCount?: number;
}

export const MainHeader = ({
    variant = 'home',
    isSidebarExpanded = false,
    conversationTitle = '',
    notificationCount = 0,
    interestCount = 0,
    isLoading = false,
    subscription,
    onCreditsClick,
    onWorldviewClick,
    onNotificationsClick,
    onLogoClick,
}: MainHeaderProps) => {
    const isHome = variant === 'home';
    const showLogo = isHome && !isSidebarExpanded;
    const btnStyle = isHome ? ICON_BTN.home : ICON_BTN.conversation;

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
                            <button
                                onClick={onLogoClick}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <img
                                    src="/logo-white.svg"
                                    alt="Abi"
                                    className="h-[45px]"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                                />
                            </button>
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
                            <button
                                onClick={onLogoClick}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <img
                                    src="/logo-white.svg%20fill.svg"
                                    alt="Abi"
                                    className="h-[22px]"
                                />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                    {isHome ? (
                        <motion.div
                            key="home-actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2"
                        >
                            {subscription && (
                                <CreditPill
                                    subscription={subscription}
                                    onClick={onCreditsClick}
                                    variant="home"
                                />
                            )}
                            <button
                                onClick={onWorldviewClick}
                                className={`relative ${btnStyle}`}
                                aria-label="Open worldview"
                            >
                                <Compass size={16} strokeWidth={1.5} />
                                <IndicatorDot visible={interestCount > 0} color="emerald" />
                            </button>
                            <button
                                onClick={onNotificationsClick}
                                className={`relative ${btnStyle}`}
                                aria-label="Notifications"
                            >
                                <Bell size={16} strokeWidth={1.5} />
                                <IndicatorDot visible={notificationCount > 0} color="violet" />
                            </button>
                        </motion.div>
                    ) : (
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
                                    <SkeletonLoader width={100} height={36} rounded="full" />
                                    <SkeletonLoader width={36} height={36} rounded="full" />
                                    <SkeletonLoader width={36} height={36} rounded="full" />
                                </>
                            ) : (
                                <>
                                    {subscription && (
                                        <CreditPill
                                            subscription={subscription}
                                            onClick={onCreditsClick}
                                            variant="conversation"
                                        />
                                    )}
                                    <button
                                        onClick={onWorldviewClick}
                                        className={`relative ${btnStyle}`}
                                        aria-label="Open worldview"
                                    >
                                        <Compass size={16} strokeWidth={1.5} />
                                        <IndicatorDot visible={interestCount > 0} color="emerald" />
                                    </button>
                                    <button
                                        onClick={onNotificationsClick}
                                        className={`relative ${btnStyle}`}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={16} strokeWidth={1.5} />
                                        <IndicatorDot visible={notificationCount > 0} color="violet" />
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
