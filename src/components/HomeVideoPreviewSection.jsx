import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Play, Download, Save, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from './LanguageProvider';

export default function HomeVideoPreviewSection({
    videoUrl,
    isVideoPlaying,
    setIsVideoPlaying,
    handlePreviewVideo,
    handleDownloadVideo,
    handleSaveProject,
    currentProjectId,
    isSaving,
    resetApp,
    openHelp
}) {
    const { t } = useLanguage();

    if (!videoUrl) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/60 border-gray-200 backdrop-blur-sm shadow-2xl border-amber-300">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-800 flex items-center gap-3">
                            <Video className="w-5 h-5 text-amber-500" />
                            {t('card_video_title')}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                        {isVideoPlaying ? (
                            <video controls autoPlay className="w-full h-full object-cover"
                                onError={() => setIsVideoPlaying(false)}>
                                <source src={videoUrl} type="video/webm" />
                            </video>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 cursor-pointer" onClick={handlePreviewVideo}>
                                <div className="text-center">
                                    <div className="relative mb-4">
                                        <Video className="w-16 h-16 mx-auto text-amber-500" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white bg-amber-500 rounded-full p-1" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-medium">{t('video_ready')}</p>
                                    <p className="text-sm text-gray-500">{t('video_ready_desc')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handlePreviewVideo} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                            <Play className="w-4 h-4 mr-2" />{t('btn_preview')}
                        </Button>
                        <Button onClick={handleDownloadVideo} variant="outline" className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white">
                            <Download className="w-4 h-4 mr-2" />{t('btn_download')}
                        </Button>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleSaveProject(false)} disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />{currentProjectId ? 'Mettre à jour' : 'Sauvegarder'}</>}
                        </Button>
                        {currentProjectId && <Button onClick={() => handleSaveProject(true)} disabled={isSaving} variant="outline" className="border-indigo-300 text-indigo-600" size="sm"><Plus className="w-4 h-4 mr-1" />Nouveau projet</Button>}
                        <Button variant="ghost" onClick={resetApp} className="text-gray-500 hover:text-gray-800" size="sm">{t('btn_create_another')}</Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}