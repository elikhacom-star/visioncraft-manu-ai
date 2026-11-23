import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Trash2, PlugZap } from 'lucide-react';

export default function OfflineQueueIndicator({ offlineMode, queue, onSync, onClear, onRemove }) {
  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-amber-800">
        <PlugZap className="w-4 h-4" />
        <span className="text-sm font-medium">
          Mode hors-ligne {offlineMode ? 'activé' : 'désactivé'}
        </span>
        <Badge className="bg-amber-500">{queue.length} en attente</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onSync} disabled={queue.length === 0} className="h-8">
          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Synchroniser
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={queue.length === 0} className="h-8 text-red-600">
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Vider
        </Button>
      </div>
    </div>
  );
}