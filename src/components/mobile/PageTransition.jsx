import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export default function PageTransition({ children, pageKey }) {
    return (
        <motion.div
            key={pageKey}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
            {children}
        </motion.div>
    );
}