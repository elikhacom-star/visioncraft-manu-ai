import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Volume2, Headphones, Sliders, RotateCcw, Waves, Gauge } from "lucide-react";

export default function AudioEffectsPanel({ track, onUpdate }) {
    const [activeTab, setActiveTab] = useState("volume");
    
    const volume = track?.volume ?? 1;
    const pan = track?.pan ?? 0;
    const fadeIn = track?.fadeIn ?? 0;
    const fadeOut = track?.fadeOut ?? 0;
    const eq = track?.eq ?? { low: 0, mid: 0, high: 0 };
    const ducking = track?.ducking ?? false;
    const duckingAmount = track?.duckingAmount ?? 0.3;

    const handleReset = () => {
        onUpdate?.({
            volume: 1,
            pan: 0,
            fadeIn: 0,
            fadeOut: 0,
            eq: { low: 0, mid: 0, high: 0 },
            ducking: false
        });
    };

    return (
        <Card className="bg-slate-900 border-slate-700 text-white">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        Effets Audio
                    </CardTitle>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleReset}
                        className="h-7 text-xs text-slate-400 hover:text-white"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full bg-slate-800 border-slate-700">
                        <TabsTrigger value="volume" className="flex-1 text-xs">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Volume
                        </TabsTrigger>
                        <TabsTrigger value="pan" className="flex-1 text-xs">
                            <Headphones className="w-3 h-3 mr-1" />
                            Pan
                        </TabsTrigger>
                        <TabsTrigger value="eq" className="flex-1 text-xs">
                            <Waves className="w-3 h-3 mr-1" />
                            EQ
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="volume" className="space-y-4 mt-4">
                        {/* Main Volume */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs text-slate-300">Volume Principal</Label>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                    {Math.round(volume * 100)}%
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-slate-400" />
                                <Slider
                                    value={[volume]}
                                    onValueChange={([v]) => onUpdate?.({ volume: v })}
                                    min={0}
                                    max={2}
                                    step={0.05}
                                    className="flex-1 [&_[role=slider]]:bg-green-500"
                                />
                                <Gauge className="w-4 h-4 text-slate-400" />
                            </div>
                            {volume > 1 && (
                                <p className="text-[10px] text-amber-400">⚠️ Volume amplifié - risque de distorsion</p>
                            )}
                        </div>

                        {/* Ducking */}
                        {track?.type === 'music' && (
                            <div className="p-3 bg-slate-800 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-xs text-slate-300">Auto-Ducking</Label>
                                        <p className="text-[10px] text-slate-500">Baisse automatique pendant la voix</p>
                                    </div>
                                    <Switch
                                        checked={ducking}
                                        onCheckedChange={(checked) => onUpdate?.({ ducking: checked })}
                                    />
                                </div>
                                {ducking && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Réduction</span>
                                            <span>{Math.round(duckingAmount * 100)}%</span>
                                        </div>
                                        <Slider
                                            value={[duckingAmount]}
                                            onValueChange={([v]) => onUpdate?.({ duckingAmount: v })}
                                            min={0.1}
                                            max={0.9}
                                            step={0.05}
                                            className="[&_[role=slider]]:bg-amber-500"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fades */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-300">Fade In</span>
                                    <span className="text-slate-500">{fadeIn.toFixed(1)}s</span>
                                </div>
                                <Slider
                                    value={[fadeIn]}
                                    onValueChange={([v]) => onUpdate?.({ fadeIn: v })}
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    className="[&_[role=slider]]:bg-cyan-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-300">Fade Out</span>
                                    <span className="text-slate-500">{fadeOut.toFixed(1)}s</span>
                                </div>
                                <Slider
                                    value={[fadeOut]}
                                    onValueChange={([v]) => onUpdate?.({ fadeOut: v })}
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    className="[&_[role=slider]]:bg-purple-500"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="pan" className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs text-slate-300">Balance Stéréo</Label>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                    {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}
                                </Badge>
                            </div>

                            {/* Visual Pan Display */}
                            <div className="relative h-12 bg-slate-800 rounded-lg overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1 h-full bg-slate-600" />
                                </div>
                                <div 
                                    className="absolute top-2 bottom-2 w-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                                    style={{ left: `calc(50% + ${pan * 45}% - 8px)` }}
                                />
                                <div className="absolute inset-0 flex items-end justify-between px-2 pb-1 text-[9px] text-slate-500">
                                    <span>L</span>
                                    <span>C</span>
                                    <span>R</span>
                                </div>
                            </div>

                            <Slider
                                value={[pan]}
                                onValueChange={([v]) => onUpdate?.({ pan: v })}
                                min={-1}
                                max={1}
                                step={0.05}
                                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-purple-500"
                            />

                            <div className="flex justify-center">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => onUpdate?.({ pan: 0 })}
                                    className="text-xs text-slate-400"
                                >
                                    Centrer
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="eq" className="space-y-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Bass */}
                            <div className="space-y-2 text-center">
                                <Label className="text-xs text-slate-300">Basses</Label>
                                <div className="relative h-32 bg-slate-800 rounded-lg flex items-end justify-center pb-2">
                                    <div 
                                        className="w-8 bg-gradient-to-t from-red-500 to-orange-400 rounded-t transition-all"
                                        style={{ height: `${50 + eq.low * 50}%` }}
                                    />
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-600" />
                                </div>
                                <Slider
                                    orientation="horizontal"
                                    value={[eq.low]}
                                    onValueChange={([v]) => onUpdate?.({ eq: { ...eq, low: v } })}
                                    min={-1}
                                    max={1}
                                    step={0.1}
                                    className="[&_[role=slider]]:bg-red-500"
                                />
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {eq.low > 0 ? '+' : ''}{(eq.low * 12).toFixed(0)}dB
                                </span>
                            </div>

                            {/* Mid */}
                            <div className="space-y-2 text-center">
                                <Label className="text-xs text-slate-300">Médiums</Label>
                                <div className="relative h-32 bg-slate-800 rounded-lg flex items-end justify-center pb-2">
                                    <div 
                                        className="w-8 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all"
                                        style={{ height: `${50 + eq.mid * 50}%` }}
                                    />
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-600" />
                                </div>
                                <Slider
                                    value={[eq.mid]}
                                    onValueChange={([v]) => onUpdate?.({ eq: { ...eq, mid: v } })}
                                    min={-1}
                                    max={1}
                                    step={0.1}
                                    className="[&_[role=slider]]:bg-green-500"
                                />
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {eq.mid > 0 ? '+' : ''}{(eq.mid * 12).toFixed(0)}dB
                                </span>
                            </div>

                            {/* Treble */}
                            <div className="space-y-2 text-center">
                                <Label className="text-xs text-slate-300">Aigus</Label>
                                <div className="relative h-32 bg-slate-800 rounded-lg flex items-end justify-center pb-2">
                                    <div 
                                        className="w-8 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all"
                                        style={{ height: `${50 + eq.high * 50}%` }}
                                    />
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-600" />
                                </div>
                                <Slider
                                    value={[eq.high]}
                                    onValueChange={([v]) => onUpdate?.({ eq: { ...eq, high: v } })}
                                    min={-1}
                                    max={1}
                                    step={0.1}
                                    className="[&_[role=slider]]:bg-blue-500"
                                />
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {eq.high > 0 ? '+' : ''}{(eq.high * 12).toFixed(0)}dB
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onUpdate?.({ eq: { low: 0, mid: 0, high: 0 } })}
                                className="text-xs text-slate-400"
                            >
                                Flat
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onUpdate?.({ eq: { low: 0.3, mid: 0, high: 0.2 } })}
                                className="text-xs text-slate-400"
                            >
                                Voix
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onUpdate?.({ eq: { low: 0.4, mid: -0.1, high: 0.3 } })}
                                className="text-xs text-slate-400"
                            >
                                Musique
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}