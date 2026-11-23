import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Loader2, Scissors, Check, AlertCircle, Eye, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SCENE_KEYWORDS_FR = [
  /^sc[eè]ne\s*\d+/i,
  /^acte\s*\d+/i,
  /^chapitre\s*\d+/i,
  /^s[eé]quence\s*\d+/i,
  /^partie\s*\d+/i,
  /^int\.\s/i,
  /^ext\.\s/i,
  /^int\s*[-–—]/i,
  /^ext\s*[-–—]/i,
];

const SCENE_KEYWORDS_EN = [
  /^scene\s*\d+/i,
  /^act\s*\d+/i,
  /^chapter\s*\d+/i,
  /^sequence\s*\d+/i,
  /^part\s*\d+/i,
  /^int\.\s/i,
  /^ext\.\s/i,
  /^int\s*[-–—]/i,
  /^ext\s*[-–—]/i,
  /^fade\s*in/i,
  /^fade\s*out/i,
  /^cut\s*to/i,
];

function splitIntoScenes(text, mode = 'auto', customKeywords = '') {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n');
  const allKeywords = [...SCENE_KEYWORDS_FR, ...SCENE_KEYWORDS_EN];

  if (customKeywords.trim()) {
    customKeywords.split(',').map(k => k.trim()).filter(Boolean).forEach(k => {
      allKeywords.push(new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
    });
  }

  const scenes = [];
  let currentScene = { title: '', lines: [] };

  const isPageBreak = (line) => {
    return /^[-_=\s]{10,}$/.test(line) ||
      /^\f/.test(line) ||
      /^(page\s*\d+|---+|===+|\*\*\*+)$/i.test(line.trim());
  };

  const isSceneHeader = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return allKeywords.some(rx => rx.test(trimmed));
  };

  const pushScene = () => {
    const text = currentScene.lines.join('\n').trim();
    if (text.length > 10) {
      scenes.push({
        title: currentScene.title || `Scène ${scenes.length + 1}`,
        text: text,
        wordCount: text.split(/\s+/).filter(Boolean).length
      });
    }
  };

  for (const line of lines) {
    if (mode === 'auto' || mode === 'keywords') {
      if (isSceneHeader(line)) {
        pushScene();
        currentScene = { title: line.trim(), lines: [] };
        continue;
      }
    }

    if (mode === 'auto' || mode === 'pagebreaks') {
      if (isPageBreak(line)) {
        pushScene();
        currentScene = { title: '', lines: [] };
        continue;
      }
    }

    currentScene.lines.push(line);
  }

  pushScene();

  // If no splits found, split by paragraph blocks
  if (scenes.length <= 1 && text.length > 300) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    if (paragraphs.length > 1) {
      return paragraphs.map((p, i) => ({
        title: `Scène ${i + 1}`,
        text: p.trim(),
        wordCount: p.trim().split(/\s+/).filter(Boolean).length
      }));
    }
  }

  return scenes.length > 0 ? scenes : [{
    title: 'Scène 1',
    text: text.trim(),
    wordCount: text.trim().split(/\s+/).filter(Boolean).length
  }];
}

export default function ScriptFileImporter({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState('');
  const [scenes, setScenes] = useState([]);
  const [splitMode, setSplitMode] = useState('auto');
  const [customKeywords, setCustomKeywords] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [step, setStep] = useState(1); // 1: upload, 2: review scenes
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      toast.error("Format non supporté. Utilisez PDF, Word (.doc/.docx), TXT ou RTF.");
      return;
    }

    setFile(selected);
    setIsExtracting(true);
    setRawText('');
    setScenes([]);

    try {
      if (ext === 'txt') {
        const text = await selected.text();
        setRawText(text);
        const parsed = splitIntoScenes(text, splitMode, customKeywords);
        setScenes(parsed);
        setStep(2);
      } else {
        // Upload and extract via LLM/ExtractData
        const uploadRes = await base44.integrations.Core.UploadFile({ file: selected });
        if (!uploadRes?.file_url) throw new Error("Échec de l'upload du fichier");

        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadRes.file_url,
          json_schema: {
            type: "object",
            properties: {
              full_text: { type: "string", description: "The complete extracted text content of the document, preserving paragraph breaks with newlines" },
              detected_scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    text: { type: "string" }
                  }
                },
                description: "Scenes detected from the document based on headings, page breaks, or scene markers (INT./EXT., Scene X, etc.)"
              }
            }
          }
        });

        if (extractRes?.status === 'success' && extractRes.output) {
          const fullText = extractRes.output.full_text || '';
          setRawText(fullText);

          // Use AI-detected scenes if available and meaningful
          if (extractRes.output.detected_scenes?.length > 1) {
            const aiScenes = extractRes.output.detected_scenes.map((s, i) => ({
              title: s.title || `Scène ${i + 1}`,
              text: s.text?.trim() || '',
              wordCount: (s.text || '').split(/\s+/).filter(Boolean).length
            })).filter(s => s.text.length > 10);

            if (aiScenes.length > 1) {
              setScenes(aiScenes);
              setStep(2);
              setIsExtracting(false);
              return;
            }
          }

          // Fallback to local splitting
          const parsed = splitIntoScenes(fullText, splitMode, customKeywords);
          setScenes(parsed);
          setStep(2);
        } else {
          throw new Error(extractRes?.details || "Échec de l'extraction du texte");
        }
      }
    } catch (err) {
      console.error("File extraction error:", err);
      toast.error("Erreur d'extraction: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReSplit = () => {
    if (!rawText) return;
    const parsed = splitIntoScenes(rawText, splitMode, customKeywords);
    setScenes(parsed);
  };

  const handleDeleteScene = (index) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const handleMergeWithNext = (index) => {
    if (index >= scenes.length - 1) return;
    const merged = [...scenes];
    merged[index] = {
      ...merged[index],
      text: merged[index].text + '\n\n' + merged[index + 1].text,
      wordCount: merged[index].wordCount + merged[index + 1].wordCount
    };
    merged.splice(index + 1, 1);
    setScenes(merged);
  };

  const handleSplitScene = (index) => {
    const scene = scenes[index];
    const mid = Math.floor(scene.text.length / 2);
    const splitPoint = scene.text.indexOf('\n', mid);
    const point = splitPoint > 0 ? splitPoint : mid;

    const part1 = scene.text.substring(0, point).trim();
    const part2 = scene.text.substring(point).trim();

    const newScenes = [...scenes];
    newScenes.splice(index, 1,
      { title: scene.title, text: part1, wordCount: part1.split(/\s+/).filter(Boolean).length },
      { title: `Scène ${index + 2}`, text: part2, wordCount: part2.split(/\s+/).filter(Boolean).length }
    );
    // Renumber
    setScenes(newScenes.map((s, i) => ({ ...s, title: s.title.match(/^(INT|EXT|Scène|Scene|Act|Chapitre)/i) ? s.title : `Scène ${i + 1}` })));
  };

  const handleUpdateSceneText = (index, newText) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], text: newText, wordCount: newText.split(/\s+/).filter(Boolean).length };
    setScenes(updated);
    setEditingScene(null);
  };

  const handleImport = () => {
    if (scenes.length === 0) return;
    const fullScript = scenes.map(s => s.text).join('\n\n');
    const sceneData = scenes.map((s, i) => ({
      scene_number: i + 1,
      title: s.title,
      dialogue: s.text,
      duration: Math.max(3, Math.min(15, Math.ceil(s.wordCount / 2.5))),
      visual_description: s.text.substring(0, 120)
    }));
    onImport({ fullScript, scenes: sceneData, rawText });
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setRawText('');
    setScenes([]);
    setStep(1);
    setShowRawText(false);
    setEditingScene(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);
  const estimatedDuration = Math.ceil(totalWords / 2.5);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleReset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Importer un script (PDF / Word / TXT)
          </DialogTitle>
          <DialogDescription>
            Importez un fichier et découpez-le automatiquement en scènes pour votre storyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors cursor-pointer bg-white/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    <p className="text-sm text-slate-600 font-medium">Extraction du contenu en cours...</p>
                    <p className="text-xs text-slate-400">Analyse du fichier et détection des scènes</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-amber-100 rounded-full">
                      <Upload className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Glissez ou cliquez pour importer</p>
                      <p className="text-sm text-slate-500 mt-1">PDF, Word (.doc/.docx), TXT, RTF</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Split options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mode de découpe</Label>
                  <Select value={splitMode} onValueChange={setSplitMode}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (mots-clés + sauts)</SelectItem>
                      <SelectItem value="keywords">Mots-clés uniquement</SelectItem>
                      <SelectItem value="pagebreaks">Sauts de page uniquement</SelectItem>
                      <SelectItem value="paragraphs">Par paragraphes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mots-clés personnalisés (séparés par ,)</Label>
                  <Input
                    value={customKeywords}
                    onChange={e => setCustomKeywords(e.target.value)}
                    placeholder="ex: PLAN, SHOT, ---"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review scenes */}
          {step === 2 && (
            <div className="space-y-3">
              {/* Summary bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">{scenes.length} scènes</Badge>
                  <Badge variant="outline" className="text-xs">{totalWords} mots</Badge>
                  <Badge variant="outline" className="text-xs">~{estimatedDuration}s estimé</Badge>
                  {file && <span className="text-xs text-slate-500 truncate max-w-[150px]">{file.name}</span>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setShowRawText(!showRawText)} className="h-7 text-xs text-slate-500">
                    {showRawText ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    Texte brut
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReSplit} className="h-7 text-xs">
                    <Scissors className="w-3 h-3 mr-1" /> Re-découper
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { handleReset(); setStep(1); }} className="h-7 text-xs text-red-500 hover:text-red-700">
                    Nouveau fichier
                  </Button>
                </div>
              </div>

              {/* Raw text preview */}
              {showRawText && (
                <Textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  className="h-32 text-xs font-mono bg-slate-50"
                  placeholder="Texte brut extrait..."
                />
              )}

              {/* Re-split options */}
              <div className="grid grid-cols-2 gap-2">
                <Select value={splitMode} onValueChange={setSplitMode}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="keywords">Mots-clés</SelectItem>
                    <SelectItem value="pagebreaks">Sauts de page</SelectItem>
                    <SelectItem value="paragraphs">Paragraphes</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={customKeywords}
                  onChange={e => setCustomKeywords(e.target.value)}
                  placeholder="Mots-clés perso..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Scene list */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {scenes.map((scene, i) => (
                  <div key={i} className="border rounded-lg bg-white p-3 space-y-2 group hover:border-amber-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{i + 1}</Badge>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{scene.title}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="outline" className="text-[9px]">{scene.wordCount} mots</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingScene(editingScene === i ? null : i)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSplitScene(i)} title="Diviser">
                          <Scissors className="w-3 h-3" />
                        </Button>
                        {i < scenes.length - 1 && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMergeWithNext(i)} title="Fusionner avec suivante">
                            <Plus className="w-3 h-3 rotate-45" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDeleteScene(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {editingScene === i ? (
                      <div className="space-y-2">
                        <Textarea
                          defaultValue={scene.text}
                          className="text-xs h-24"
                          id={`scene-edit-${i}`}
                        />
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingScene(null)}>Annuler</Button>
                          <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => {
                            const el = document.getElementById(`scene-edit-${i}`);
                            if (el) handleUpdateSceneText(i, el.value);
                          }}>
                            <Check className="w-3 h-3 mr-1" /> Appliquer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 line-clamp-2">{scene.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => { handleReset(); onClose(); }}>Annuler</Button>
          {step === 2 && (
            <Button
              onClick={handleImport}
              disabled={scenes.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Importer {scenes.length} scène{scenes.length > 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}