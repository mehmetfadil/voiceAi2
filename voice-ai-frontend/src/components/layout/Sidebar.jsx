import React from 'react';
import { LayoutDashboard, Mic, BarChart3, Settings, Database, FlaskConical } from 'lucide-react'; // Flask ikonu eklendi
import { useLocation, Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Mic, label: 'Clone Voice', path: '/clone' },
    { icon: FlaskConical, label: 'Test Lab', path: '/test' }, // Yeni Menü
    { icon: Database, label: 'Knowledge', path: '/knowledge' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="w-20 lg:w-64 border-r border-white/10 flex flex-col justify-between bg-background-surface/30 backdrop-blur-sm z-20 h-screen sticky top-0">
            <div>
                {/* Logo Alanı */}
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10">
                    <div className="w-8 h-8 bg-primary flex items-center justify-center text-black font-bold text-xl mr-0 lg:mr-3 shadow-pixel-primary">
                        V
                    </div>
                    <span className="hidden lg:block font-bold text-xl tracking-tight text-white">
                        VOICE.OS
                    </span>
                </div>

                {/* Menü Linkleri */}
                <nav className="flex flex-col gap-2 p-4">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-4 px-3 py-3 rounded group transition-all duration-200 border-l-2",
                                    isActive
                                        ? "bg-white/5 border-primary text-white"
                                        : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20"
                                )}
                            >
                                <Icon size={20} className={cn(isActive ? "text-primary" : "group-hover:text-white")} />
                                <span className="hidden lg:block text-sm font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3">
                    <div className="w-2 h-2 bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="hidden lg:block text-xs text-green-500 font-mono uppercase">System Online</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;