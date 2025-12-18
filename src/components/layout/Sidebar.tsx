import { useState } from 'react';
import { MessageSquare, Compass, Bot, Settings, HelpCircle, PanelLeft, Search, Plus, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface SidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    onNewChat?: () => void;
}

export const Sidebar = ({ isExpanded, onToggle, onNewChat }: SidebarProps) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'Today': true,
        'Yesterday': false,
        'Earlier': false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <aside
            className={`relative h-full shrink-0 flex transition-all duration-300 ease-out z-30 ${isExpanded ? 'w-60' : 'w-14'
                }`}
        >
            {/* Main Sidebar Content - No rounded edges, blends with bg */}
            <div className="relative w-full h-full bg-transparent flex flex-col overflow-hidden">
                {/* Header with Logo/Toggle */}
                <div className={`h-14 flex items-center shrink-0 ${isExpanded ? 'px-3 justify-between' : 'px-2 justify-center'}`}>
                    {isExpanded ? (
                        /* Expanded: Logo + Drawer toggle */
                        <>
                            <img src="/logo expanded.svg" alt="Abi" className="h-6" />
                            <button
                                onClick={onToggle}
                                className="w-8 h-8 rounded-lg text-muted hover:text-primary hover:bg-slate-200/50 flex items-center justify-center transition-colors shrink-0"
                            >
                                <PanelLeft size={18} strokeWidth={1.5} />
                            </button>
                        </>
                    ) : (
                        /* Collapsed: Just drawer toggle */
                        <button
                            onClick={onToggle}
                            className="w-10 h-10 rounded-xl text-secondary hover:text-primary hover:bg-slate-200/50 flex items-center justify-center transition-colors"
                        >
                            <PanelLeft size={20} strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Primary Nav */}
                <nav className={`flex flex-col gap-1 mt-6 ${isExpanded ? 'px-2' : 'px-1'}`}>
                    {/* New Chat - Special colored button */}
                    <NewChatButton isExpanded={isExpanded} onClick={onNewChat} />
                    <NavItem icon={MessageSquare} label="Conversations" isExpanded={isExpanded} />
                    <NavItem icon={Compass} label="Discovery" isExpanded={isExpanded} />
                    <NavItem icon={Bot} label="Agents" isExpanded={isExpanded} />
                </nav>

                {/* Search */}
                <div className={`mt-4 ${isExpanded ? 'px-2' : 'px-1'}`}>
                    {isExpanded ? (
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/60 border border-slate-200/50 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Sparkles size={14} className="text-muted" strokeWidth={1.5} />
                            </div>
                        </div>
                    ) : (
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-secondary hover:bg-slate-200/50 hover:text-primary transition-colors">
                            <Search size={20} strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Conversation History (only when expanded) */}
                {isExpanded && (
                    <div className="flex-1 overflow-y-auto px-2 mt-4">
                        <HistorySection
                            title="Today"
                            isOpen={expandedSections['Today']}
                            onToggle={() => toggleSection('Today')}
                            items={[
                                "Caustic Soda Research",
                                "Sodium Hydroxide Inno...",
                                "Procurement Analysis Re...",
                                "Negotiation Strategy S...",
                                "Research Initiative",
                                "Engagement Opportunities"
                            ]}
                        />
                        <HistorySection
                            title="Yesterday"
                            isOpen={expandedSections['Yesterday']}
                            onToggle={() => toggleSection('Yesterday')}
                            items={[]}
                        />
                        <HistorySection
                            title="Earlier"
                            isOpen={expandedSections['Earlier']}
                            onToggle={() => toggleSection('Earlier')}
                            items={[]}
                        />
                    </div>
                )}

                {/* Spacer when collapsed */}
                {!isExpanded && <div className="flex-1" />}

                {/* Footer */}
                <div className={`flex flex-col gap-1 mt-auto pb-2 ${isExpanded ? 'px-2' : 'px-1'}`}>
                    <NavItem icon={Settings} label="Settings" isExpanded={isExpanded} />
                    <NavItem icon={HelpCircle} label="Help" isExpanded={isExpanded} />

                    {/* User Profile */}
                    <div className={`mt-3 pt-3 border-t border-slate-200/50 flex items-center ${isExpanded ? 'gap-3 px-1.5' : 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium text-sm shrink-0">
                            S
                        </div>
                        {isExpanded && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-primary truncate">Stephen Mosser</span>
                                <span className="text-xs text-secondary truncate">Step56@outlook.com</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

interface NavItemProps {
    icon: any;
    label: string;
    isExpanded: boolean;
    isActive?: boolean;
    isHighlighted?: boolean;
}

const NewChatButton = ({ isExpanded, onClick }: { isExpanded: boolean; onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`h-10 rounded-xl flex items-center transition-all duration-200 ${
            isExpanded ? 'w-full gap-3 px-1.5' : 'w-10 justify-center mx-auto'
        }`}
    >
        <div className="w-8 h-8 rounded-full bg-[#4A00F8] flex items-center justify-center shrink-0 shadow-sm">
            <Plus size={18} strokeWidth={2} color="white" />
        </div>
        {isExpanded && (
            <span className="text-sm font-medium text-primary whitespace-nowrap truncate">
                New Chat
            </span>
        )}
    </button>
);

const NavItem = ({ icon: Icon, label, isExpanded, isActive }: NavItemProps) => (
    <button
        className={`h-10 rounded-xl flex items-center transition-all duration-200 ${
            isActive
                ? 'bg-slate-200/50 text-primary'
                : 'text-secondary hover:bg-slate-200/50 hover:text-primary'
        } ${isExpanded ? 'w-full gap-3 px-2.5' : 'w-10 justify-center mx-auto'}`}
    >
        <div className="shrink-0 flex items-center justify-center">
            <Icon size={20} strokeWidth={1.5} />
        </div>
        {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap truncate">
                {label}
            </span>
        )}
    </button>
);

interface HistorySectionProps {
    title: string;
    items: string[];
    isOpen: boolean;
    onToggle: () => void;
}

const HistorySection = ({ title, items, isOpen, onToggle }: HistorySectionProps) => (
    <div className="mb-2">
        <button
            onClick={onToggle}
            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-200/50 rounded-lg transition-colors group"
        >
            <span className="text-muted group-hover:text-secondary transition-colors">
                {isOpen ? (
                    <ChevronDown size={14} strokeWidth={2} />
                ) : (
                    <ChevronRight size={14} strokeWidth={2} />
                )}
            </span>
            <span className="text-xs font-medium text-secondary group-hover:text-primary transition-colors">{title}</span>
        </button>
        {isOpen && items.length > 0 && (
            <div className="ml-1 mt-1">
                {items.map((item, index) => (
                    <button
                        key={index}
                        className="w-full text-left px-3 py-1.5 text-sm text-secondary hover:bg-slate-200/50 hover:text-primary rounded-lg truncate transition-colors"
                    >
                        {item}
                    </button>
                ))}
            </div>
        )}
    </div>
);
