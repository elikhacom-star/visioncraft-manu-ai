import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, User, BookOpen, Loader2, ArrowRight, Copy, Check, Film } from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from '../utils';
import { useLanguage } from '../components/LanguageProvider';

export default function IdeaGenerator() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState("generate");
    
    // Generator State
    const [keywords, setKeywords] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    
    // Trending State
    const [isFetchingTrends, setIsFetchingTrends] = useState(false);
    const [trendingTopics, setTrendingTopics] = useState(null);

    // Copy State
    const [copiedSection, setCopiedSection] = useState(null);

    const handleCopy = (text, section) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const generateContent = async () => {
        if (!keywords.trim()) return;
        setIsGenerating(true);
        setGeneratedContent(null);

        try {
            const prompt = `
                Act as a professional hollywood screenwriter and creative director.
                Based on these keywords/plot points: "${keywords}"
                
                Generate a comprehensive movie concept package containing:
                1. A Catchy Title
                2. A Logline (1-2 sentences)
                3. A Detailed Synopsis (2 paragraphs)
                4. 3 Main Characters with brief backstories (Name, Role, Backstory)
                
                Make it creative, engaging, and ready for production.
            `;

            const response = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        logline: { type: "string" },
                        synopsis: { type: "string" },
                        characters: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    role: { type: "string" },
                                    backstory: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setGeneratedContent(response);
        } catch (error) {
            console.error("Generation failed:", error);
            // Handle error appropriately
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchTrendingTopics = async () => {
        setIsFetchingTrends(true);
        try {
            const prompt = `
                Find current trending topics, news, and cultural phenomena suitable for movie adaptation or content creation.
                Search the internet for what's capturing public attention right now.
                
                Return 5 distinct trending topics.
                For each, provide:
                1. The Topic Name
                2. Why it's trending (context)
                3. A creative Movie/Content Angle (how to spin it into a story)
            `;

            const response = await InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        trends: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                    context: { type: "string" },
                                    creative_angle: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setTrendingTopics(response?.trends || []);
        } catch (error) {
            console.error("Fetching trends failed:", error);
        } finally {
            setIsFetchingTrends(false);
        }
    };

    // Force title update on mount
    React.useEffect(() => {
        document.title = "Visioncraft AI";
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    {t('idea_creative')} <span className="text-amber-500">{t('idea_lab_title_gen')}</span>
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    {t('idea_desc')}
                </p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/50 backdrop-blur-sm p-1 shadow-md rounded-xl">
                        <TabsTrigger value="generate" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <Sparkles className="w-4 h-4 mr-2" />
                            {t('tab_concept_generator')}
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            {t('tab_trending_topics')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* CONCEPT GENERATOR TAB */}
                <TabsContent value="generate">
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Input Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>{t('card_input_concept')}</CardTitle>
                                    <CardDescription>
                                        {t('card_input_concept_desc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder={t('placeholder_concept_keywords')}
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        className="min-h-[150px] resize-none focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <Button 
                                        onClick={generateContent}
                                        disabled={!keywords.trim() || isGenerating}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md transition-all"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                {t('btn_generating_concept')}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                {t('btn_generate_concept')}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Output Section */}
                        <div className="lg:col-span-3">
                            <AnimatePresence mode="wait">
                                {generatedContent ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <Card className="border-0 shadow-xl overflow-hidden">
                                            <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                                            <CardHeader className="bg-white">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Badge variant="outline" className="mb-2 border-amber-200 text-amber-700 bg-amber-50">{t('badge_generated_concept')}</Badge>
                                                        <CardTitle className="text-2xl text-slate-800">{generatedContent.title}</CardTitle>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(generatedContent.title, 'title')}>
                                                        {copiedSection === 'title' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="bg-slate-50/50 space-y-6 pt-6">
                                                {/* Logline */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> {t('label_logline')}
                                                    </h3>
                                                    <p className="text-slate-700 font-medium leading-relaxed">
                                                        {generatedContent.logline}
                                                    </p>
                                                </div>

                                                {/* Synopsis */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('label_synopsis')}</h3>
                                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                        {generatedContent.synopsis}
                                                    </p>
                                                </div>

                                                {/* Characters */}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <User className="w-4 h-4" /> {t('label_characters')}
                                                    </h3>
                                                    <div className="grid sm:grid-cols-1 gap-4">
                                                        {generatedContent.characters?.map((char, idx) => (
                                                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="font-bold text-slate-800">{char.name}</span>
                                                                    <Badge variant="secondary" className="text-xs">{char.role}</Badge>
                                                                </div>
                                                                <p className="text-sm text-slate-600">{char.backstory}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8">
                                        <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                                        <p className="text-lg font-medium text-slate-500">{t('empty_state_title')}</p>
                                        <p className="text-sm">{t('empty_state_desc')}</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </TabsContent>

                {/* TRENDING TOPICS TAB */}
                <TabsContent value="trends">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{t('trending_title')}</h2>
                                <p className="text-slate-600">{t('trending_desc')}</p>
                            </div>
                            <Button 
                                onClick={fetchTrendingTopics} 
                                disabled={isFetchingTrends}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            >
                                {isFetchingTrends ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('btn_scanning_web')}
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        {t('btn_refresh_trends')}
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {trendingTopics?.map((trend, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-indigo-500 group">
                                            <CardHeader>
                                                <Badge className="w-fit mb-2 bg-indigo-50 text-indigo-700 border-indigo-100 group-hover:bg-indigo-100">
                                                    {t('badge_trending_topic')}
                                                </Badge>
                                                <CardTitle className="text-xl text-slate-800">{trend.topic}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('label_context')}</h4>
                                                    <p className="text-sm text-slate-600">{trend.context}</p>
                                                </div>
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" /> {t('label_creative_angle')}
                                                    </h4>
                                                    <p className="text-sm text-slate-700 italic">"{trend.creative_angle}"</p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    className="w-full mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 group-hover:translate-x-1 transition-all"
                                                    onClick={() => {
                                                        setActiveTab("generate");
                                                        setKeywords(trend.creative_angle);
                                                    }}
                                                >
                                                    {t('btn_use_concept')} <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {!trendingTopics && !isFetchingTrends && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>{t('empty_trends_desc')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}