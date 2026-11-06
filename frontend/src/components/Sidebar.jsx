import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Home, 
    Dumbbell, 
    Utensils, 
    TrendingUp, 
    MessageCircle, 
    LogOut, 
    User, 
    Zap, 
    Menu, 
    X,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useSidebarStore from '../stores/sidebarStore';
import useWellnessStore from '../stores/wellnessStore';

const navLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
    { to: '/progress', icon: TrendingUp, label: 'Progress & Rewards' },
    { to: '/ai-coach', icon: MessageCircle, label: 'AI Wellness Coach' },
];

export default function Sidebar() {
    const location = useLocation();
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);
    const { isCollapsed, toggleSidebar } = useSidebarStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    const userXp = useWellnessStore((s) => s.userXp);
    const currentLevel = Math.floor(userXp / 250) + 1;
    const levelXpProgress = userXp % 250;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    return (
        <>
            {/* Mobile Top Navigation Bar */}
            <div className="lg:hidden sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4 flex items-center justify-between shadow-lg">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                        <Zap size={16} className="text-slate-950 fill-slate-950" />
                    </div>
                    <span className="font-semibold text-base tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Arogya<span className="text-emerald-400">Mitra</span>
                    </span>
                </Link>

                <div className="flex items-center gap-2.5">
                    <div className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-slate-300">
                        Lv.{currentLevel}
                    </div>
                    <Link 
                        to="/profile" 
                        className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-200"
                    >
                        {(user?.full_name?.[0] || 'U').toUpperCase()}
                    </Link>
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity"
                    onClick={() => setMobileOpen(false)}
                >
                    <div 
                        className="w-72 max-w-[80vw] h-full bg-[#0B0F19] border-r border-white/[0.06] p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                                        <Zap size={16} className="text-slate-950 fill-slate-950" />
                                    </div>
                                    <span className="font-semibold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                                        Arogya<span className="text-emerald-400">Mitra</span>
                                    </span>
                                </Link>
                                <button 
                                    onClick={() => setMobileOpen(false)} 
                                    className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/[0.05] transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Mobile User Level Card */}
                            <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-amber-400" />
                                        Level {currentLevel}
                                    </span>
                                    <span className="text-slate-400 font-mono">{userXp} XP</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(levelXpProgress / 250) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <nav className="space-y-1.5">
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.to;
                                    return (
                                        <Link 
                                            key={link.to} 
                                            to={link.to} 
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                                                isActive 
                                                    ? 'bg-white text-slate-950 font-semibold shadow-md' 
                                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            <link.icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                                            <span>{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="pt-5 border-t border-white/[0.06] space-y-2">
                            <Link 
                                to="/profile" 
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                                    location.pathname === '/profile' 
                                        ? 'bg-white text-slate-950 font-semibold' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                                <User size={18} />
                                <span>Profile & Settings</span>
                            </Link>
                            <button 
                                onClick={() => { setMobileOpen(false); logout(); }} 
                                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Collapsible Sidebar */}
            <aside 
                className={`hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 bg-[#0B0F19]/95 backdrop-blur-2xl border-r border-white/[0.06] justify-between z-30 transition-all duration-300 ease-in-out font-['Inter',sans-serif] overflow-y-auto ${
                    isCollapsed ? 'w-20 p-4' : 'w-64 p-6'
                }`}
                aria-label="Sidebar navigation"
            >
                <div className="space-y-6">
                    {/* Header: Logo & Collapse Toggle */}
                    <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4 justify-center' : 'justify-between'}`}>
                        <Link 
                            to="/dashboard" 
                            className="flex items-center gap-3 group"
                            title="ArogyaMitra Dashboard"
                        >
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md flex-shrink-0">
                                <Zap size={18} className="text-slate-950 fill-slate-950" />
                            </div>
                            {!isCollapsed && (
                                <span className="font-semibold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
                                    Arogya<span className="text-emerald-400">Mitra</span>
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={toggleSidebar}
                            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition ${
                                isCollapsed ? 'mt-1' : ''
                            }`}
                            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
                        >
                            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                        </button>
                    </div>

                    {/* Member Level Indicator */}
                    {!isCollapsed && (
                        <div className="p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    <Sparkles size={13} className="text-amber-400" />
                                    <span>Level {currentLevel} Member</span>
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">{userXp} XP</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(8, (levelXpProgress / 250) * 100))}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="space-y-1.5">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.to;
                            return (
                                <Link 
                                    key={link.to} 
                                    to={link.to} 
                                    className={`flex items-center transition-all duration-200 ${
                                        isCollapsed 
                                            ? 'justify-center w-11 h-11 mx-auto rounded-2xl' 
                                            : 'gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium'
                                    } ${
                                        isActive 
                                            ? 'bg-white text-slate-950 font-semibold shadow-lg shadow-white/5' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                    }`}
                                    title={isCollapsed ? link.label : undefined}
                                >
                                    <link.icon 
                                        size={18} 
                                        className={`flex-shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} 
                                    />
                                    {!isCollapsed && (
                                        <span className="whitespace-nowrap truncate">{link.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom User Actions */}
                <div className={`pt-5 border-t border-white/[0.06] space-y-1.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                    <Link 
                        to="/profile" 
                        className={`flex items-center transition-all ${
                            isCollapsed 
                                ? 'justify-center w-11 h-11 mx-auto rounded-2xl' 
                                : 'gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium'
                        } ${
                            location.pathname === '/profile' 
                                ? 'bg-white text-slate-950 font-semibold' 
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                        title={isCollapsed ? user?.full_name || 'My Profile' : undefined}
                    >
                        {isCollapsed ? (
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-semibold text-slate-200">
                                {(user?.full_name?.[0] || 'U').toUpperCase()}
                            </div>
                        ) : (
                            <>
                                <User size={18} className="flex-shrink-0 text-slate-400" />
                                <span className="truncate text-slate-200">{user?.full_name || 'My Profile'}</span>
                            </>
                        )}
                    </Link>
                    
                    <button 
                        onClick={logout} 
                        className={`flex items-center transition-colors text-left ${
                            isCollapsed 
                                ? 'justify-center w-11 h-11 mx-auto rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                                : 'w-full gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={isCollapsed ? "Sign Out" : undefined}
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
