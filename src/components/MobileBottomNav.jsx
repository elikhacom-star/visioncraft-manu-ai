import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Film, FolderOpen, Heart, CreditCard } from 'lucide-react';

const tabs = [
    { label: 'Home', path: 'Home', icon: Film },
    { label: 'Projects', path: 'Projects', icon: FolderOpen },
    { label: 'Favorites', path: 'Favorites', icon: Heart },
    { label: 'Pricing', path: 'Pricing', icon: CreditCard },
];

export default function MobileBottomNav({ currentPageName }) {
    const isActive = (path) => {
        if (path === 'Home' && (currentPageName === 'Home' || !currentPageName)) return true;
        return currentPageName === path;
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 mobile-bottom-nav select-none">
            <div className="flex justify-around items-center h-14 px-2">
                {tabs.map((tab) => {
                    const active = isActive(tab.path);
                    return (
                        <Link
                            key={tab.path}
                            to={createPageUrl(tab.path)}
                            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors ${
                                active
                                    ? 'text-amber-600'
                                    : 'text-slate-400 active:text-slate-600'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                            <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}