import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export default function SaveTemplateDialog({
    isOpen, onClose, 
    newTemplateName, setNewTemplateName,
    newTemplateCategory, setNewTemplateCategory,
    newTemplateTags, setNewTemplateTags,
    onSave, isSaving
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Custom Template</DialogTitle>
                    <DialogDescription>
                        Save your current style settings (voice, art style, effects) as a reusable template.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="t-name">Template Name</Label>
                        <Input id="t-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="e.g. My Cinematic Style" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="t-category">Category</Label>
                        <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Personal">Personal</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Social Media">Social Media</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Showcase">Showcase</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="t-tags">Tags (comma separated)</Label>
                        <Input id="t-tags" value={newTemplateTags} onChange={(e) => setNewTemplateTags(e.target.value)} placeholder="e.g. dark, moody, fast" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white">
                        {isSaving ? (<><RefreshCw className="w-3 h-3 mr-2 animate-spin" />Saving...</>) : 'Save Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}