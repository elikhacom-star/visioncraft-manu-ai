import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
    const [refreshing, setRefreshing] = useState(false);
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, THRESHOLD], [0, 1]);
    const rotate = useTransform(y, [0, THRESHOLD], [0, 360]);
    const scale = useTransform(y, [0, THRESHOLD / 2, THRESHOLD], [0.5, 0.8, 1]);
    const startY = useRef(null);
    const scrollRef = useRef(null);

    const handleTouchStart = (e) => {
        if (refreshing) return;
        const el = scrollRef.current;
        if (el && el.scrollTop <= 0) {
            startY.current = e.touches[0].clientY;
        } else {
            startY.current = null;
        }
    };

    const handleTouchMove = (e) => {
        if (startY.current === null || refreshing) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0) {
            y.set(Math.min(delta * 0.5, THRESHOLD + 20));
        }
    };

    const handleTouchEnd = async () => {
        if (startY.current === null || refreshing) return;
        const current = y.get();
        if (current >= THRESHOLD) {
            setRefreshing(true);
            y.set(50);
            await onRefresh();
            setRefreshing(false);
        }
        y.set(0);
        startY.current = null;
    };

    return (
        <div
            ref={scrollRef}
            className="relative overflow-auto h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <motion.div
                className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
                style={{ height: y, opacity }}
            >
                <motion.div style={{ rotate: refreshing ? undefined : rotate, scale }}>
                    <RefreshCw className={`w-6 h-6 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.div>
            </motion.div>

            <motion.div style={{ y: refreshing ? 50 : y }}>
                {children}
            </motion.div>
        </div>
    );
}