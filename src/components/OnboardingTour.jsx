import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingTour({ steps, isOpen, onClose, initialStep = 0 }) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(initialStep);
        }
    }, [isOpen, initialStep]);
    const [placement, setPlacement] = useState('bottom');
    const tooltipRef = useRef(null);

    // Effect to scroll to element when step changes
    useEffect(() => {
        if (!isOpen) return;
        const step = steps[currentStep];
        if (!step || !step.targetId) return;

        const element = document.getElementById(step.targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, isOpen, steps]);

    // Effect to update position on scroll/resize
    useEffect(() => {
        if (!isOpen) return;
        
        const updatePosition = () => {
            const step = steps[currentStep];
            if (!step || !step.targetId) return;

            const element = document.getElementById(step.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                
                // Use viewport coordinates (fixed positioning)
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });

                // Determine placement based on available space
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const tooltipHeight = 200; // Estimated height

                if (spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
                    setPlacement('top');
                } else {
                    setPlacement('bottom');
                }
            }
        };

        // Initial update
        updatePosition();
        
        // Update on scroll and resize
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
        
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, { capture: true });
        };
    }, [currentStep, isOpen, steps]);

    if (!isOpen) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Darken Background Overlay with hole */}
            <div className="absolute inset-0 bg-black/50 transition-all duration-300" 
                 style={{
                     clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        100% 100%, 
                        100% 0%, 
                        0% 0%, 
                        ${position.left}px ${position.top}px, 
                        ${position.left + position.width}px ${position.top}px, 
                        ${position.left + position.width}px ${position.top + position.height}px, 
                        ${position.left}px ${position.top + position.height}px, 
                        ${position.left}px ${position.top}px
                     )`
                 }}
            />

            {/* Highlight Border */}
            <motion.div 
                className="absolute border-4 border-amber-500 rounded-lg pointer-events-none transition-all duration-300 ease-out"
                style={{
                    top: position.top - 4,
                    left: position.left - 4,
                    width: position.width + 8,
                    height: position.height + 8
                }}
                initial={false}
                animate={{
                    top: position.top - 4,
                    left: position.left - 4,
                    width: position.width + 8,
                    height: position.height + 8
                }}
            />

            {/* Tooltip Card */}
            <div 
                className="absolute w-full flex justify-center pointer-events-auto transition-all duration-300 ease-out" 
                style={{ 
                    top: placement === 'bottom' ? position.top + position.height + 20 : 'auto',
                    bottom: placement === 'top' ? (window.innerHeight - position.top) + 20 : 'auto',
                    left: 0 
                }}
            >
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentStep}
                    className="max-w-md w-full mx-4"
                >
                    <Card className="shadow-2xl border-amber-200 bg-white">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg text-amber-600">{step.title}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">{step.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                            <div className="flex gap-2">
                                <span className="text-xs text-slate-400 flex items-center">
                                    {currentStep + 1} / {steps.length}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                    disabled={currentStep === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-amber-500 hover:bg-amber-600"
                                    onClick={() => {
                                        if (currentStep < steps.length - 1) {
                                            setCurrentStep(currentStep + 1);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                >
                                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}