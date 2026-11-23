import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Settings2, ArrowRight, X, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ScriptImprover({ originalScript, onGenerate, onApply, isProcessing, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState("cinematic");
  const [length, setLength] = useState("maintain");
  const [dialogue, setDialogue] = useState("natural");
  
  const [improvedScript, setImprovedScript] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const result = await onGenerate({ tone, length, dialogue });
        setImprovedScript(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onApply(improvedScript);
    setIsOpen(false);
    setImprovedScript(null);
  };

  const handleCancel = () => {
    setImprovedScript(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) setImprovedScript(null);
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Improve with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-500" />
              AI Script Refinement
          </DialogTitle>
          <DialogDescription>
            {improvedScript ? "Compare and review the changes before applying." : "Customize how the AI should enhance your script."}
          </DialogDescription>
        </DialogHeader>

        {!improvedScript ? (
            // Settings View
            <div className="grid gap-6 py-4">
            <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    Tone & Style
                </Label>
                <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="cinematic">Cinematic & Epic</SelectItem>
                    <SelectItem value="formal">Formal & Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="persuasive">Persuasive & Sales</SelectItem>
                    <SelectItem value="humorous">Humorous & Witty</SelectItem>
                    <SelectItem value="dramatic">Dramatic & Intense</SelectItem>
                    <SelectItem value="minimalist">Minimalist & Clean</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Length Control</Label>
                <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="maintain">Maintain Length (Optimize)</SelectItem>
                    <SelectItem value="summarize">Summarize (Shorten)</SelectItem>
                    <SelectItem value="expand">Expand (Add Detail)</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Dialogue Style</Label>
                <Select value={dialogue} onValueChange={setDialogue}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="natural">Natural Flow</SelectItem>
                    <SelectItem value="punchy">Punchy & Fast</SelectItem>
                    <SelectItem value="descriptive">Descriptive (Narration)</SelectItem>
                    <SelectItem value="character">Character-Driven</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </div>
        ) : (
            // Comparison View
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 py-4">
                <div className="flex flex-col gap-2 min-h-0">
                    <Label className="text-slate-500">Original Script</Label>
                    <ScrollArea className="h-64 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
                        {originalScript}
                    </ScrollArea>
                </div>
                <div className="flex flex-col gap-2 min-h-0">
                    <Label className="text-amber-600 font-semibold flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        AI Improved
                    </Label>
                    <ScrollArea className="h-64 rounded-md border border-amber-200 bg-amber-50/50 p-4 text-sm text-slate-800 leading-relaxed shadow-inner">
                        {improvedScript}
                    </ScrollArea>
                </div>
            </div>
        )}

        <DialogFooter className="mt-auto">
            {!improvedScript ? (
                <>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={isGenerating} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]">
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Refining...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Preview
                            </>
                        )}
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="ghost" onClick={handleCancel} className="mr-auto text-slate-500">
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Back to Settings
                    </Button>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Discard</Button>
                    <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Apply Changes
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}