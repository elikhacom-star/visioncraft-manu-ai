import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Clock, CheckCircle2, XCircle, Trash2, RefreshCw, Film, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const STATUS_CONFIG = {
  queued: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-800', icon: XCircle }
};

function RenderJobItem({ job, onRefresh }) {
  const [polling, setPolling] = useState(false);
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
  const StatusIcon = config.icon;

  // Auto-poll for active jobs
  useEffect(() => {
    if (job.status === 'queued' || job.status === 'processing') {
      setPolling(true);
      const interval = setInterval(async () => {
        onRefresh();
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setPolling(false);
    }
  }, [job.status]);

  const handleCancel = async () => {
    try {
      await base44.functions.invoke('renderVideo', {
        action: 'cancel',
        jobId: job.id
      });
      toast.success("Rendu annulé");
      onRefresh();
    } catch (e) {
      toast.error("Erreur: " + e.message);
    }
  };

  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState(0);

  const handleDownload = async () => {
    if (!job.output_url) return;
    
    setIsAssembling(true);
    setAssemblyProgress(5);
    const toastId = toast.loading("Préparation de la vidéo...");

    try {
      // Fetch the manifest
      const resp = await fetch(job.output_url);
      const manifest = await resp.json();

      if (!manifest.scenes || manifest.scenes.length === 0) {
        throw new Error("Aucune scène dans le rendu");
      }

      // Determine canvas size from resolution
      let canvasW = 1280, canvasH = 720;
      if (manifest.resolution === '1080p') { canvasW = 1920; canvasH = 1080; }
      else if (manifest.resolution === '4k') { canvasW = 3840; canvasH = 2160; }

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      canvas.style.position = 'fixed';
      canvas.style.left = '-9999px';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      // Audio context for voiceovers
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioDest = audioCtx.createMediaStreamDestination();

      // Silent oscillator to keep audio track alive
      const silentOsc = audioCtx.createOscillator();
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0.00001;
      silentOsc.connect(silentGain);
      silentGain.connect(audioDest);
      silentOsc.start();

      const canvasStream = canvas.captureStream(30);
      const combined = new MediaStream();
      canvasStream.getVideoTracks().forEach(t => combined.addTrack(t));
      audioDest.stream.getAudioTracks().forEach(t => combined.addTrack(t));

      // Select codec
      const mimeTypes = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      let selectedMime = '';
      for (const m of mimeTypes) { if (MediaRecorder.isTypeSupported(m)) { selectedMime = m; break; } }

      const recorder = new MediaRecorder(combined, selectedMime ? {
        mimeType: selectedMime,
        videoBitsPerSecond: (manifest.bitrate || 8) * 1000000
      } : undefined);

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const videoReady = new Promise((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
          resolve(blob);
        };
      });

      recorder.start();

      // Render each scene
      const scenes = manifest.scenes;
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        setAssemblyProgress(Math.round(10 + (i / scenes.length) * 80));
        toast.loading(`Scène ${i + 1}/${scenes.length}...`, { id: toastId });

        // Load image
        let img = null;
        if (scene.url) {
          try {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = scene.url;
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; setTimeout(rej, 10000); });
          } catch { img = null; }
        }

        // Play voiceover audio if exists
        if (scene.audioUrl) {
          try {
            const audioResp = await fetch(scene.audioUrl);
            const audioBuf = await audioCtx.decodeAudioData(await audioResp.arrayBuffer());
            const src = audioCtx.createBufferSource();
            src.buffer = audioBuf;
            src.connect(audioDest);
            src.start();
          } catch (e) { console.warn("Audio failed for scene", i, e); }
        }

        // Render frames for this scene
        const fps = 24;
        const duration = scene.duration || 5;
        const totalFrames = Math.ceil(duration * fps);

        for (let f = 0; f < totalFrames; f++) {
          const progress = f / Math.max(totalFrames - 1, 1);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvasW, canvasH);

          if (img) {
            // Simple zoom-in effect
            const scale = 1 + progress * 0.08;
            const sw = canvasW / scale;
            const sh = canvasH / scale;
            const sx = (img.width - sw * (img.width / canvasW)) / 2;
            const sy = (img.height - sh * (img.height / canvasH)) / 2;
            ctx.drawImage(img, 0, 0, img.width, img.height, 
              canvasW * (1 - scale) / 2, canvasH * (1 - scale) / 2, canvasW * scale, canvasH * scale);
          } else {
            // Placeholder
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Scène ${i + 1}`, canvasW / 2, canvasH / 2);
          }

          await new Promise(r => setTimeout(r, 1000 / fps));
        }
      }

      setAssemblyProgress(95);
      toast.loading("Finalisation...", { id: toastId });

      await new Promise(r => setTimeout(r, 500));
      recorder.stop();

      const videoBlob = await videoReady;

      // Cleanup
      silentOsc.stop();
      audioCtx.close();
      document.body.removeChild(canvas);

      // Download
      const ext = (selectedMime || '').includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(videoBlob);
      a.download = `visioncraft_render_${job.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);

      setAssemblyProgress(100);
      toast.success("Vidéo téléchargée !", { id: toastId });
    } catch (e) {
      console.error("Assembly failed:", e);
      toast.error("Erreur d'assemblage: " + e.message, { id: toastId });
    } finally {
      setIsAssembling(false);
      setAssemblyProgress(0);
    }
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2 rounded-lg ${job.status === 'processing' ? 'bg-blue-50' : 'bg-slate-50'}`}>
              <Film className="w-4 h-4 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-slate-900 truncate">
                  {job.scene_count || '?'} scènes • {job.resolution || '1080p'} • {job.format?.toUpperCase() || 'MP4'}
                </span>
                <Badge className={`${config.color} text-xs`}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {moment(job.created_date).fromNow()}
                {job.total_duration ? ` • ~${Math.round(job.total_duration)}s de vidéo` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {(job.status === 'queued' || job.status === 'processing') && (
              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-red-500 hover:text-red-700">
                <XCircle className="w-4 h-4" />
              </Button>
            )}
            {job.status === 'completed' && job.output_url && (
              <Button size="sm" onClick={handleDownload} disabled={isAssembling} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                {isAssembling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isAssembling ? `${assemblyProgress}%` : 'Télécharger'}
              </Button>
            )}
          </div>
        </div>

        {(job.status === 'processing' || job.status === 'queued') && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{job.status === 'queued' ? 'En attente...' : 'Assemblage en cours...'}</span>
              <span>{Math.round(job.progress || 0)}%</span>
            </div>
            <Progress value={job.progress || 0} className="h-1.5" />
          </div>
        )}

        {job.status === 'failed' && job.error_message && (
          <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
            {job.error_message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function RenderQueue({ className }) {
  const { data: jobsData, isLoading, refetch } = useQuery({
    queryKey: ['renderJobs'],
    queryFn: async () => {
      const res = await base44.functions.invoke('renderVideo', { action: 'list' });
      return res.data?.jobs || [];
    },
    refetchInterval: 5000 // Auto-refresh every 5s
  });

  const jobs = jobsData || [];
  const activeJobs = jobs.filter(j => j.status === 'queued' || j.status === 'processing');

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-500" />
          File de rendu
          {activeJobs.length > 0 && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">{activeJobs.length} actif{activeJobs.length > 1 ? 's' : ''}</Badge>
          )}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
          <RefreshCw className="w-3 h-3 mr-1" />
          Rafraîchir
        </Button>
      </div>
      <div className="space-y-2">
        {jobs.slice(0, 10).map(job => (
          <RenderJobItem key={job.id} job={job} onRefresh={refetch} />
        ))}
      </div>
    </div>
  );
}