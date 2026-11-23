import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Film, Lightbulb, CreditCard, ShieldCheck, LogIn, LogOut, FolderOpen, Menu, X, Music, Heart, ChevronLeft, Trash2, BookOpen, Users, Images } from 'lucide-react';
import { LanguageProvider, useLanguage } from './components/LanguageProvider';
import LanguageSelector from './components/LanguageSelector';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { AnimatePresence } from 'framer-motion';
import MobileBottomNav from './components/MobileBottomNav';
import AccountDeleteDialog from './components/AccountDeleteDialog';
import PageTransition from './components/mobile/PageTransition';

export default function LayoutWrapper(props) {
    return (
        <LanguageProvider>
            <LayoutContent {...props} />
            <Toaster position="bottom-right" theme="light" />
        </LanguageProvider>
    );
}

const CHILD_PAGES = ['IdeaGenerator', 'MyCreations', 'AdminDashboard', 'Contact', 'Tasks', 'Landing', 'Characters'];

function LayoutContent({ children, currentPageName }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const { t } = useLanguage();
    const navigate = useNavigate();
    const currentPath = '/' + (currentPageName === 'Home' ? '' : currentPageName);
    const isChildPage = CHILD_PAGES.includes(currentPageName);

    const { data: user } = useQuery({
        queryKey: ['userMe'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    // Dark mode: sync with system preference
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = (e) => {
            document.documentElement.classList.toggle('dark', e.matches);
        };
        apply(mq);
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    // Log visit once per session
    useEffect(() => {
        if (user && !sessionStorage.getItem('visit_logged')) {
            base44.entities.ActivityLog.create({
                action: 'visit',
                details: `User visited the app`,
                metadata: { path: window.location.pathname, user_agent: navigator.userAgent }
            }).then(() => {
                sessionStorage.setItem('visit_logged', 'true');
            }).catch(console.error);
        }
    }, [user]);

    useEffect(() => {
        document.title = "Visioncraft AI";
        const updateMeta = (name, content) => {
            let element = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };
        updateMeta('og:title', 'Visioncraft AI');
        updateMeta('og:site_name', 'Visioncraft AI');
        updateMeta('application-name', 'Visioncraft AI');
        updateMeta('apple-mobile-web-app-title', 'Visioncraft AI');
        updateMeta('description', t('seo_description'));
        updateMeta('keywords', t('seo_keywords'));
    }, [t]);

    const isActive = (path) => {
        if (path === '/' && currentPath === '/') return true;
        if (path !== '/' && currentPath.includes(path)) return true;
        return false;
    };

    let navItems = [
        { label: t('nav_storyboard'), path: 'Home', icon: Film },
        { label: t('nav_pricing'), path: 'Pricing', icon: CreditCard },
    ];

    if (user) {
        navItems = [
            { label: t('nav_storyboard'), path: 'Home', icon: Film },
            { label: t('nav_projects'), path: 'Projects', icon: FolderOpen },
            { label: 'Mes Créations', path: 'MyCreations', icon: Music },
            { label: 'Favoris', path: 'Favorites', icon: Heart },
            { label: t('nav_idea_lab'), path: 'IdeaGenerator', icon: Lightbulb },
            { label: t('nav_pricing'), path: 'Pricing', icon: CreditCard },
            { label: 'Personnages', path: 'Characters', icon: Users },
            { label: 'Galerie', path: 'Gallery', icon: Images },
            { label: 'Guide', path: 'Guide', icon: BookOpen },
        ];
        if (user.role === 'admin' || user.email === 'elikhacom@gmail.com') {
            navItems.push({ label: t('nav_admin'), path: 'AdminDashboard', icon: ShieldCheck });
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 mobile-header-safe select-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            {/* Mobile back button for child pages */}
                            {isChildPage && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 mr-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm">
                                    <Film className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                                    Visioncraft AI
                                </span>
                            </Link>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex gap-1 items-center">
                            <LanguageSelector />
                            {navItems.map((item) => (
                                <Link 
                                    key={item.path}
                                    to={createPageUrl(item.path)}
                                    className={`
                                        flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive(item.path === 'Home' ? '/' : item.path) 
                                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-700/50' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </Link>
                            ))}
                            
                            <div className="ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{user.full_name || "User"}</span>
                                            {user.role === 'admin' && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Admin</span>}
                                        </div>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => base44.auth.logout()}
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            {t('btn_logout')}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button 
                                        size="sm"
                                        onClick={() => base44.auth.redirectToLogin()}
                                        className="bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                                    >
                                        <LogIn className="w-4 h-4 mr-2" />
                                        {t('btn_login')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center gap-3">
                            <LanguageSelector />
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className="flex items-center gap-2 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                <span className="font-bold text-sm">Menu</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl z-50 animate-in slide-in-from-top-2">
                        <div className="flex flex-col p-4 gap-2">
                            {navItems.map((item) => (
                                <Link 
                                    key={item.path}
                                    to={createPageUrl(item.path)}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`
                                        flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                                        ${isActive(item.path === 'Home' ? '/' : item.path) 
                                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </Link>
                            ))}
                            
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                            
                            {user ? (
                                <div className="flex flex-col gap-3 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{user.full_name || "User"}</span>
                                            {user.role === 'admin' && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Admin</span>}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            base44.auth.logout();
                                        }}
                                        className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t('btn_logout')}
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setShowDeleteAccount(true);
                                        }}
                                        className="w-full justify-start text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs"
                                    >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Delete Account
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        base44.auth.redirectToLogin();
                                    }}
                                    className="w-full bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    <LogIn className="w-4 h-4 mr-2" />
                                    {t('btn_login')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Content — add bottom padding on mobile for bottom nav */}
            <main className="flex-1 relative pb-0 md:pb-0">
                <AnimatePresence mode="wait">
                    <PageTransition pageKey={currentPageName}>
                        {children}
                    </PageTransition>
                </AnimatePresence>
            </main>

            {/* Mobile bottom spacer so content isn't hidden behind bottom nav */}
            <div className="md:hidden mobile-bottom-spacer" />

            {/* Footer (hidden on mobile to avoid conflict with bottom nav) */}
            <footer className="hidden md:block bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>{t('footer_text').replace('2024', new Date().getFullYear())}</p>
                </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav currentPageName={currentPageName} />

            {/* Account Deletion Dialog */}
            <AccountDeleteDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
        </div>
    );
}