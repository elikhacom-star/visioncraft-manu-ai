import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from "@/api/base44Client";

export default function AccountDeleteDialog({ open, onOpenChange }) {
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;
        setDeleting(true);
        await base44.auth.updateMe({ account_deletion_requested: true, deletion_requested_at: new Date().toISOString() });
        base44.auth.logout();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <p className="text-sm text-slate-600">
                        Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                    </p>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="border-red-200 focus:ring-red-500"
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        disabled={confirmText !== 'DELETE' || deleting}
                        onClick={handleDelete}
                    >
                        {deleting ? 'Deleting...' : 'Delete My Account'}
                        {!deleting && <Trash2 className="w-4 h-4 ml-1" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}