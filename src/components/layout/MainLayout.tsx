import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MainHeader } from './MainHeader';

interface MainLayoutProps {
    children: ReactNode;
    panel?: ReactNode;
    isPanelOpen?: boolean;
    isArtifactExpanded?: boolean; // When true, main panel hides and artifact fills space
    headerVariant?: 'home' | 'conversation' | 'transitioning';
    conversationTitle?: string;
    artifactCount?: number;
    notificationCount?: number;
    backgroundOpacity?: number; // 0-100, controls gradient/decoration opacity
    isHeaderLoading?: boolean;
    onNewChat?: () => void;
    onNavigateToHistory?: () => void;
}

export const MainLayout = ({
    children,
    panel,
    isPanelOpen = false,
    isArtifactExpanded = false,
    headerVariant = 'home',
    conversationTitle = '',
    artifactCount = 0,
    notificationCount = 2,
    backgroundOpacity = 100,
    isHeaderLoading = false,
    onNewChat,
    onNavigateToHistory,
}: MainLayoutProps) => {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Calculate opacity multiplier (0-1)
    const opacityMultiplier = backgroundOpacity / 100;

    return (
        <div className="flex w-full h-screen bg-white overflow-hidden font-sans p-2 gap-1.5">
            {/* Column 1: Navigation Sidebar */}
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                onNewChat={onNewChat}
                onNavigateToHistory={onNavigateToHistory}
            />

            {/* Column 2: Main Content - Animates out when artifact is expanded */}
            <motion.main
                initial={false}
                animate={{
                    width: isArtifactExpanded ? 0 : 'auto',
                    opacity: isArtifactExpanded ? 0 : 1,
                    flex: isArtifactExpanded ? 0 : 1,
                    padding: isArtifactExpanded ? 0 : undefined,
                }}
                transition={{
                    duration: 0.5,
                    ease: [0.32, 0.72, 0, 1], // Custom smooth ease
                }}
                className="h-full min-w-0 flex flex-col relative z-0 overflow-hidden"
                style={{ display: isArtifactExpanded ? 'none' : 'flex' }}
            >
                        <div className="flex-1 h-full bg-white rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-slate-200/50 relative overflow-hidden">
                            {/* Inner inset shadow */}
                            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)] pointer-events-none z-20" />

                            {/* Ethereal gradient layers - with transition */}
                            <div
                                className="transition-opacity duration-500 ease-out"
                                style={{ opacity: opacityMultiplier }}
                            >
                                {/* Top left - violet */}
                                <div
                                    className="absolute -top-[100px] -left-[200px] w-[800px] h-[800px] rounded-full pointer-events-none z-0 blur-3xl opacity-50"
                                    style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)' }}
                                />
                                {/* Center left - lavender */}
                                <div
                                    className="absolute top-[100px] -left-[100px] w-[600px] h-[600px] rounded-full pointer-events-none z-0 blur-3xl opacity-40"
                                    style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(221,214,254,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Top center - soft pink */}
                                <div
                                    className="absolute -top-[150px] left-[30%] w-[600px] h-[600px] rounded-full pointer-events-none z-0 blur-3xl opacity-30"
                                    style={{ background: 'radial-gradient(circle, rgba(245,208,254,0.5) 0%, rgba(253,230,255,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Top right - light violet */}
                                <div
                                    className="absolute -top-[50px] right-[-50px] w-[600px] h-[600px] rounded-full pointer-events-none z-0 blur-3xl opacity-40"
                                    style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(167,139,250,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Center right - violet */}
                                <div
                                    className="absolute top-[25%] right-[5%] w-[550px] h-[550px] rounded-full pointer-events-none z-0 blur-3xl opacity-35"
                                    style={{ background: 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, rgba(196,181,253,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Bottom right - pink */}
                                <div
                                    className="absolute bottom-[-100px] right-[0%] w-[600px] h-[600px] rounded-full pointer-events-none z-0 blur-3xl opacity-35"
                                    style={{ background: 'radial-gradient(circle, rgba(251,207,232,0.5) 0%, rgba(245,208,254,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Bottom center - subtle lavender */}
                                <div
                                    className="absolute bottom-[-50px] left-[30%] w-[700px] h-[700px] rounded-full pointer-events-none z-0 blur-3xl opacity-30"
                                    style={{ background: 'radial-gradient(circle, rgba(221,214,254,0.5) 0%, rgba(237,233,254,0.3) 50%, transparent 70%)' }}
                                />
                                {/* Far right edge - accent */}
                                <div
                                    className="absolute top-[50%] right-[-150px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 blur-3xl opacity-30"
                                    style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.4) 0%, rgba(251,207,232,0.2) 50%, transparent 70%)' }}
                                />
                            </div>

                            {/* Gradient ring decoration - clipped by panel */}
                            <img
                                src="/Subtract.svg"
                                alt=""
                                className="absolute -top-[20px] -left-[380px] w-[950px] h-[950px] pointer-events-none z-[1] transition-opacity duration-500 ease-out"
                                style={{ opacity: (isSidebarExpanded ? 0.4 : 0.85) * opacityMultiplier }}
                            />

                            <div className="flex-1 h-full relative z-10 overflow-hidden flex flex-col">
                                {/* Header */}
                                <MainHeader
                                    variant={headerVariant}
                                    isSidebarExpanded={isSidebarExpanded}
                                    conversationTitle={conversationTitle}
                                    artifactCount={artifactCount}
                                    notificationCount={notificationCount}
                                    isLoading={isHeaderLoading}
                                />

                                {/* Content */}
                                <div className="flex-1 overflow-auto">
                                    {children}
                                </div>
                            </div>
                        </div>
            </motion.main>

            {/* Column 3: Artifact Panel - grows to fill when expanded */}
            {panel}
        </div>
    );
};
