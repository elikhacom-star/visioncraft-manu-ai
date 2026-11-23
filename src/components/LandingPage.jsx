import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Film, Sparkles, Video, Mic, Languages, Zap, CheckCircle2, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LandingPage({ onTryDemo }) {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const features = [
        {
            icon: <Sparkles className="w-6 h-6 text-amber-500" />,
            title: "Scénarisation IA",
            desc: "Transformez une simple idée en un script vidéo complet et engageant en quelques secondes."
        },
        {
            icon: <Video className="w-6 h-6 text-blue-500" />,
            title: "Génération Visuelle",
            desc: "Créez des scènes cinématographiques époustouflantes grâce à nos modèles d'image et de vidéo IA de pointe."
        },
        {
            icon: <Mic className="w-6 h-6 text-purple-500" />,
            title: "Voix Off Réalistes",
            desc: "Accédez à des centaines de voix ultra-réalistes dans de multiples langues pour donner vie à votre histoire."
        },
        {
            icon: <Languages className="w-6 h-6 text-green-500" />,
            title: "Multilingue",
            desc: "Créez du contenu pour une audience mondiale avec un support natif pour plus de 15 langues."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-medium text-sm mb-8 border border-amber-100"
                        >
                            <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span>La révolution de la création vidéo IA est là</span>
                        </motion.div>
                        
                        <motion.h1 
                            {...fadeIn}
                            className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight"
                        >
                            Créez des Vidéos Cinématographiques avec <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">l'Intelligence Artificielle</span>
                        </motion.h1>
                        
                        <motion.p 
                            {...fadeIn}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
                        >
                            Visioncraft AI transforme vos textes en vidéos professionnelles. De l'écriture du script au montage final, automatisez votre production de contenu sans compromis sur la qualité.
                        </motion.p>
                        
                        <motion.div 
                            {...fadeIn}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button 
                                size="lg" 
                                onClick={() => base44.auth.redirectToLogin()}
                                className="w-full sm:w-auto h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all"
                            >
                                Commencer Gratuitement
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                onClick={onTryDemo}
                                className="w-full sm:w-auto h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Démo Live
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Tout ce dont vous avez besoin</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Une suite complète d'outils créatifs propulsés par l'IA pour donner vie à votre vision.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12">Pourquoi choisir Visioncraft AI ?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6">
                            <div className="text-4xl font-bold text-amber-500 mb-2">10x</div>
                            <div className="text-slate-600 font-medium">Plus Rapide</div>
                            <p className="text-sm text-slate-400 mt-2">Générez en minutes ce qui prenait des jours.</p>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl font-bold text-blue-500 mb-2">4K</div>
                            <div className="text-slate-600 font-medium">Qualité Cinema</div>
                            <p className="text-sm text-slate-400 mt-2">Export haute résolution prêt pour la diffusion.</p>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl font-bold text-purple-500 mb-2">100%</div>
                            <div className="text-slate-600 font-medium">Personnalisable</div>
                            <p className="text-sm text-slate-400 mt-2">Gardez le contrôle total sur votre création.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à créer votre première vidéo ?</h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">Rejoignez les créateurs qui utilisent Visioncraft AI pour produire du contenu exceptionnel.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button 
                            size="lg" 
                            onClick={() => base44.auth.redirectToLogin()}
                            className="bg-amber-500 hover:bg-amber-600 text-white border-0 h-14 px-8 text-lg rounded-xl"
                        >
                            Créer mon compte gratuit
                        </Button>
                    </div>
                    <p className="mt-6 text-slate-500 text-sm">Pas de carte de crédit requise pour commencer.</p>
                </div>
            </section>
        </div>
    );
}