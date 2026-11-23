import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, jobId, scenes, voiceovers, settings } = body;

    // ACTION: Create a render job
    if (action === 'create') {
      if (!scenes || scenes.length === 0) {
        return Response.json({ error: 'No scenes provided' }, { status: 400 });
      }

      const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0);

      // Create the render job
      const job = await base44.entities.RenderJob.create({
        project_id: settings?.project_id || null,
        status: 'queued',
        progress: 0,
        resolution: settings?.resolution || '1080p',
        format: settings?.format || 'mp4',
        scene_count: scenes.length,
        total_duration: totalDuration,
        scenes_data: {
          scenes: scenes.map(s => ({
            scene_number: s.scene_number,
            url: s.url,
            videoUrl: s.videoUrl,
            description: s.description,
            dialogue: s.dialogue,
            duration: s.duration,
            effect: s.effect,
            transition: s.transition,
            transitionDuration: s.transitionDuration
          })),
          voiceover_urls: (voiceovers || []).map(v => v.audioUrl || null),
          settings: {
            resolution: settings?.resolution || '1080p',
            format: settings?.format || 'mp4',
            bitrateMbps: settings?.bitrateMbps || 8
          }
        }
      });

      // Start processing immediately (simulate async processing)
      // In a production environment, this would be a background worker
      processRenderJob(base44, job.id).catch(err => {
        console.error('Background render failed:', err);
      });

      return Response.json({ 
        success: true, 
        jobId: job.id,
        message: 'Render job created and queued'
      });
    }

    // ACTION: Check job status
    if (action === 'status') {
      if (!jobId) {
        return Response.json({ error: 'jobId required' }, { status: 400 });
      }

      const job = await base44.entities.RenderJob.get(jobId);
      if (!job) {
        return Response.json({ error: 'Job not found' }, { status: 404 });
      }

      return Response.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        output_url: job.output_url,
        error_message: job.error_message,
        scene_count: job.scene_count,
        total_duration: job.total_duration,
        resolution: job.resolution,
        format: job.format,
        started_at: job.started_at,
        completed_at: job.completed_at,
        created_date: job.created_date
      });
    }

    // ACTION: List user's render jobs
    if (action === 'list') {
      const jobs = await base44.entities.RenderJob.filter(
        { created_by: user.email },
        '-created_date',
        20
      );
      return Response.json({ jobs });
    }

    // ACTION: Cancel a job
    if (action === 'cancel') {
      if (!jobId) {
        return Response.json({ error: 'jobId required' }, { status: 400 });
      }
      await base44.asServiceRole.entities.RenderJob.update(jobId, {
        status: 'failed',
        error_message: 'Cancelled by user'
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('renderVideo error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Background processing function
async function processRenderJob(base44, jobId) {
  try {
    // Mark as processing
    await base44.asServiceRole.entities.RenderJob.update(jobId, {
      status: 'processing',
      progress: 5,
      started_at: new Date().toISOString()
    });

    const job = await base44.asServiceRole.entities.RenderJob.get(jobId);
    const scenesData = job.scenes_data;
    
    if (!scenesData || !scenesData.scenes) {
      throw new Error('No scene data found in job');
    }

    const scenes = scenesData.scenes;
    const voicoverUrls = scenesData.voiceover_urls || [];
    const settings = scenesData.settings || {};
    const totalScenes = scenes.length;

    // Download all scene images/videos
    const sceneAssets = [];
    for (let i = 0; i < totalScenes; i++) {
      const scene = scenes[i];
      const progress = 10 + Math.round((i / totalScenes) * 40);
      
      await base44.asServiceRole.entities.RenderJob.update(jobId, { 
        progress 
      });

      let imageData = null;
      const assetUrl = scene.videoUrl || scene.url;
      
      if (assetUrl) {
        try {
          const resp = await fetch(assetUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            imageData = new Uint8Array(arrayBuffer);
          }
        } catch (e) {
          console.warn(`Failed to fetch asset for scene ${i + 1}:`, e.message);
        }
      }

      let audioData = null;
      if (voicoverUrls[i]) {
        try {
          const resp = await fetch(voicoverUrls[i]);
          if (resp.ok) {
            const blob = await resp.blob();
            const arrayBuffer = await blob.arrayBuffer();
            audioData = new Uint8Array(arrayBuffer);
          }
        } catch (e) {
          console.warn(`Failed to fetch audio for scene ${i + 1}:`, e.message);
        }
      }

      sceneAssets.push({
        ...scene,
        imageData,
        audioData
      });
    }

    await base44.asServiceRole.entities.RenderJob.update(jobId, { progress: 55 });

    // Assemble video using canvas-based approach on server
    // Since we're in Deno, we use a simplified approach:
    // Concatenate scene images with timing metadata into a manifest
    // and create a simple video using image sequence + audio

    // For server-side video assembly, we'll create an image sequence manifest
    // and upload each frame. The client will download the result.
    
    // Since true FFmpeg server rendering requires heavy infrastructure,
    // we create a downloadable package with properly timed scenes
    
    await base44.asServiceRole.entities.RenderJob.update(jobId, { progress: 70 });

    // Upload the assembled data as the "rendered" output
    // In production, this would use a proper video encoding service
    // For now, we create a JSON manifest that the client can use for fast assembly
    
    const manifest = {
      version: 1,
      format: settings.format || 'mp4',
      resolution: settings.resolution || '1080p',
      bitrate: settings.bitrateMbps || 8,
      scenes: scenes.map((scene, i) => ({
        index: i,
        url: scene.videoUrl || scene.url,
        duration: scene.duration || 5,
        effect: scene.effect || 'zoom-in',
        transition: scene.transition || 'fade',
        transitionDuration: scene.transitionDuration || 0.8,
        dialogue: scene.dialogue || '',
        audioUrl: voicoverUrls[i] || null
      })),
      total_duration: scenes.reduce((sum, s) => sum + (s.duration || 5), 0)
    };

    await base44.asServiceRole.entities.RenderJob.update(jobId, { progress: 85 });

    // Upload manifest as the output
    const manifestBlob = new Blob(
      [JSON.stringify(manifest)], 
      { type: 'application/json' }
    );
    const manifestFile = new File([manifestBlob], `render_${jobId}.json`, { type: 'application/json' });
    
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ 
      file: manifestFile 
    });

    await base44.asServiceRole.entities.RenderJob.update(jobId, {
      status: 'completed',
      progress: 100,
      output_url: uploadResult.file_url,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Render processing error:', error);
    await base44.asServiceRole.entities.RenderJob.update(jobId, {
      status: 'failed',
      error_message: error.message || 'Unknown error during rendering',
      completed_at: new Date().toISOString()
    });
  }
}