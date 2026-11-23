import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function MobileBottomSheet({ isOpen, onClose, title, children, maxHeight = '85vh' }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // On desktop, render children directly (no sheet wrapper)
    if (!isMobile) return children;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col"
                        style={{ maxHeight }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 500) {
                                onClose();
                            }
                        }}
                    >
                        {/* Handle */}
                        <div className="flex flex-col items-center pt-3 pb-2 shrink-0 select-none cursor-grab active:cursor-grabbing">
                            <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                                <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-safe">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}