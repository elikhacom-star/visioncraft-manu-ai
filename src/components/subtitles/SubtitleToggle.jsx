import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Subtitles, MessageSquareOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SubtitleToggle({ enabled, onToggle, onOpenManager }) {
    return (
        <TooltipProvider>
            <div className="flex items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={enabled ? "default" : "outline"}
                            size="sm"
                            onClick={onOpenManager}
                            className={`h-10 gap-1.5 text-xs ${
                                enabled 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {enabled ? <Subtitles className="w-3.5 h-3.5" /> : <MessageSquareOff className="w-3.5 h-3.5" />}
                            Sous-titres
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Gérer les sous-titres (style, texte, export)</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Switch
                                checked={enabled}
                                onCheckedChange={onToggle}
                                className="data-[state=checked]:bg-amber-500"
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{enabled ? 'Désactiver' : 'Activer'} les sous-titres</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}