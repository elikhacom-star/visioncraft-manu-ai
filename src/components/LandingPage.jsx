import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Film, Sparkles, Video, Mic, Languages, Zap, Image as ImageIcon, Wand2, ShieldCheck, ChevronDown, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LandingPage({ onTryDemo }) {
    const [openFaq, setOpenFaq] = useState(0);
    const hasBase44 = Boolean(import.meta.env.VITE_BASE44_APP_ID && import.meta.env.VITE_BASE44_BACKEND_URL);
    const handleStart = () => hasBase44 ? base44.auth.redirectToLogin() : onTryDemo();
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const features = [
        { icon: <Sparkles className="w-6 h-6 text-amber-500" />, title: "Scénarisation IA", desc: "Transformez une simple idée en un script vidéo complet et engageant en quelques secondes." },
        { icon: <Video className="w-6 h-6 text-blue-500" />, title: "Génération Visuelle", desc: "Créez des scènes cinématographiques grâce à vos prompts et vos images de référence." },
        { icon: <Mic className="w-6 h-6 text-purple-500" />, title: "Voix Off Réalistes", desc: "Accédez à des voix naturelles dans plusieurs langues pour donner vie à vos histoires." },
        { icon: <Languages className="w-6 h-6 text-green-500" />, title: "Multilingue", desc: "Créez du contenu pour une audience mondiale avec un support natif de nombreuses langues." }
    ];

    const workflow = [
        { icon: <Wand2 className="w-6 h-6" />, title: 'Décrivez votre idée', text: 'Écrivez un prompt, importez une image ou combinez les deux.' },
        { icon: <ImageIcon className="w-6 h-6" />, title: 'Composez vos scènes', text: 'Ajustez le style, le cadrage, la narration et les transitions.' },
        { icon: <ShieldCheck className="w-6 h-6" />, title: 'Exportez en sécurité', text: 'Votre quota et vos clés fournisseur restent protégés côté serveur.' }
    ];

    const faqs = [
        ['Puis-je commencer sans compte ?', 'Oui. Le bouton Démo Live ouvre l’éditeur public afin de découvrir le flux avant de connecter les services IA.'],
        ['Puis-je utiliser une image et un prompt ?', 'Oui. VisionCraft est conçu pour les modes texte-vers-vidéo, image-vers-vidéo et hybrides.'],
        ['Mes clés Replicate sont-elles visibles ?', 'Non. La clé Replicate est destinée au Worker Cloudflare et ne doit jamais être placée dans le navigateur.']
    ];

    return (
        <div className="min-h-screen bg-white">
            <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-medium text-sm mb-8 border border-amber-100">
                            <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span>La révolution de la création vidéo IA est là</span>
                        </motion.div>
                        <motion.h1 {...fadeIn} className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                            Créez des Vidéos Cinématographiques avec <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">l'Intelligence Artificielle</span>
                        </motion.h1>
                        <motion.p {...fadeIn} transition={{ delay: 0.2 }} className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Visioncraft AI transforme vos textes et vos images en vidéos professionnelles. De l’écriture du script au montage final, automatisez votre production de contenu.
                        </motion.p>
                        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" onClick={handleStart} className="w-full sm:w-auto h-14 px-8 text-lg bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all">Commencer Gratuitement</Button>
                            <Button size="lg" variant="outline" onClick={onTryDemo} className="w-full sm:w-auto h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl">
                                <Play className="w-5 h-5 mr-2" /> Démo Live
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Tout ce dont vous avez besoin</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Une suite complète d’outils créatifs propulsés par l’IA pour donner vie à votre vision.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4">{feature.icon}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-14">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 mb-3">Un flux simple</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">De l’idée à la vidéo en 3 étapes</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Commencez gratuitement, testez l’éditeur et connectez ensuite votre génération vidéo IA.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {workflow.map((step, index) => (
                            <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
                                <span className="absolute right-5 top-5 text-4xl font-black text-slate-200">0{index + 1}</span>
                                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">{step.icon}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-600">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12">Pourquoi choisir Visioncraft AI ?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[['10x', 'Plus Rapide', 'Générez en minutes ce qui prenait des jours.', 'text-amber-500'], ['4K', 'Qualité Cinema', 'Export haute résolution prêt pour la diffusion.', 'text-blue-500'], ['100%', 'Personnalisable', 'Gardez le contrôle total sur votre création.', 'text-purple-500']].map(([value, title, text, color]) => (
                            <div key={title} className="p-6"><div className={`text-4xl font-bold ${color} mb-2`}>{value}</div><div className="text-slate-600 font-medium">{title}</div><p className="text-sm text-slate-400 mt-2">{text}</p></div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-10"><h2 className="text-3xl font-bold text-slate-900 mb-3">Questions fréquentes</h2><p className="text-slate-600">Les réponses essentielles avant votre première création.</p></div>
                    <div className="space-y-3">
                        {faqs.map(([question, answer], index) => (
                            <div key={question} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="w-full flex items-center justify-between gap-4 p-5 text-left font-semibold text-slate-900"><span>{question}</span><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button>
                                {openFaq === index && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à créer votre première vidéo ?</h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">Rejoignez les créateurs qui utilisent Visioncraft AI pour produire du contenu exceptionnel.</p>
                    <Button size="lg" onClick={handleStart} className="bg-amber-500 hover:bg-amber-600 text-white border-0 h-14 px-8 text-lg rounded-xl">Créer mon compte gratuit</Button>
                    <p className="mt-6 text-slate-500 text-sm">Pas de carte de crédit requise pour commencer.</p>
                </div>
            </section>
        </div>
    );
}
