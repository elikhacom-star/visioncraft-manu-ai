import { playSFX } from '../effects/SlideEffects';

export async function runAssembleVideo({
  images, voiceoverData, options = {},
  // State setters
  setCurrentTask, setProgress, setError, setIsProcessing, setGeneratedVideoBlob, setVideoUrl,
  // References
  audioContextRef, aspectRatio, audioTracks, backgroundMusicFile, musicVolume, autoDucking, backgroundAudioType, voiceoverVolume,
  selectedVoice, speechPitch, speechSpeed, VOICES, renderSpeed, imageCache,
  renderImageSceneWithEffects, renderPlaceholderScene, incrementUsage, t
}) {
  setCurrentTask('Creating professional slideshow video...');
  try {
    if (!images || images.length === 0) throw new Error("No scenes available to create video");
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed'; canvas.style.left = '-9999px'; canvas.style.top = '0'; canvas.style.opacity = '1'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '-9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const ar = options.aspectRatio || aspectRatio;
    let bw = 1280, bh = 720;
    if (ar === '9:16') { bw = 720; bh = 1280; } else if (ar === '1:1') { bw = 1080; bh = 1080; } else if (ar === '4:5') { bw = 864; bh = 1080; }
    const sf = options.resolution === '4k' ? 3.0 : options.resolution === '1080p' ? 1.5 : 1.0;
    canvas.width = bw * sf; canvas.height = bh * sf;
    let audioContext = audioContextRef.current;
    if (!audioContext || audioContext.state === 'closed') { audioContext = new (window.AudioContext || window.webkitAudioContext)(); audioContextRef.current = audioContext; }
    if (audioContext.state === 'suspended') await audioContext.resume();
    const audioDestination = audioContext.createMediaStreamDestination();
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const canvasStream = canvas.captureStream(30);
    try { const osc = audioContext.createOscillator(); const g = audioContext.createGain(); g.gain.value = 0.00001; osc.connect(g); g.connect(audioDestination); osc.start(); } catch (e) {}
    const activeAudioSources = [];
    const isUploadedVoiceover = backgroundAudioType === 'voiceover';
    const tracksToProcess = audioTracks.length > 0 ? audioTracks : backgroundMusicFile ? [{ type: isUploadedVoiceover ? 'voiceover_upload' : 'music', file: backgroundMusicFile, volume: musicVolume[0], ducking: isUploadedVoiceover ? false : autoDucking, fadeIn: 0, fadeOut: 0 }] : [];
    const totalVideoDuration = images.reduce((sum, img) => sum + (img.duration || 5), 0);
    const preparedAudioTracks = []; const fallbackAudioTracks = [];
    for (const track of tracksToProcess) {
      if (!track.file) continue;
      try { const fc = track.file.slice(0, track.file.size, track.file.type); const ab = await fc.arrayBuffer(); const buf = await audioContext.decodeAudioData(ab); preparedAudioTracks.push({ track, buffer: buf }); }
      catch (e) { fallbackAudioTracks.push(track); }
    }
    const combinedStream = new MediaStream();
    canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
    const sat = audioDestination.stream.getAudioTracks();
    if (sat.length > 0) { sat.forEach(t => combinedStream.addTrack(t)); }
    else { try { const sd = audioContext.createMediaStreamDestination(); const so = audioContext.createOscillator(); so.frequency.value = 440; const sg = audioContext.createGain(); sg.gain.value = 0.00001; so.connect(sg); sg.connect(sd); so.start(); sd.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t)); } catch (e) {} }

    let mediaRecorder;
    const mimeTypes = ['video/mp4','video/mp4;codecs=h264','video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm;codecs=h264','video/webm'];
    let selectedMimeType = '';
    for (const m of mimeTypes) { if (MediaRecorder.isTypeSupported(m)) { selectedMimeType = m; break; } }
    const mro = { videoBitsPerSecond: options.resolution === '4k' ? 15000000 : options.resolution === '1080p' ? 8000000 : 2500000 };
    if (selectedMimeType) mro.mimeType = selectedMimeType;
    try { mediaRecorder = new MediaRecorder(combinedStream, selectedMimeType ? mro : undefined); } catch (e) { try { mediaRecorder = new MediaRecorder(combinedStream); } catch (e2) { throw new Error("Browser does not support MediaRecorder"); } }
    const chunks = [];
    mediaRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data); };
    mediaRecorder.onstop = () => {
      try { if (document.body.contains(canvas)) document.body.removeChild(canvas); } catch (e) {}
      if (chunks.length > 0) {
        const ft = selectedMimeType || 'video/mp4'; const vb = new Blob(chunks, { type: ft });
        if (vb.size > 0) {
          const vu = URL.createObjectURL(vb);
          if (options._multiFormat && options._onComplete) { options._onComplete(vu, vb); }
          else { setGeneratedVideoBlob(vb); setVideoUrl(vu); }
          setProgress(100); setCurrentTask('Video generation complete!');
          if (!options._multiFormat) { setIsProcessing(false); }
          try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Video Ready!', { body: 'Your video has been generated.', vibrate: [200, 100, 200] }); } catch (e) {}
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } else { setError('Generated video is empty.'); setIsProcessing(false); }
      } else { setError('Video generation failed (no data).'); setIsProcessing(false); if (options._onError) options._onError(new Error('No recording data')); }
    };
    mediaRecorder.onerror = (ev) => { try { if (document.body.contains(canvas)) document.body.removeChild(canvas); } catch (e) {} setError(`Recording failed: ${ev.error?.message || 'Unknown'}`); setIsProcessing(false); if (options._onError) options._onError(new Error(ev.error?.message)); };
    mediaRecorder.start();
    const recordStartTime = audioContext.currentTime + 0.1;

    // Schedule standard audio tracks
    for (const { track, buffer } of preparedAudioTracks) {
      try {
        const src = audioContext.createBufferSource(); src.playbackRate.value = 1.0; src.buffer = buffer; if (track.type === 'music') src.loop = true; if (track.type === 'voiceover_upload') src.loop = false;
        const gn = audioContext.createGain(); const bv = track.volume !== undefined ? parseFloat(track.volume) : 1.0; gn.gain.setValueAtTime(bv, recordStartTime);
        const fi = parseFloat(track.fadeIn || 0), fo = parseFloat(track.fadeOut || 0);
        if (fi > 0) { gn.gain.setValueAtTime(0, recordStartTime); gn.gain.linearRampToValueAtTime(bv, recordStartTime + fi); }
        if (fo > 0) { const fs = Math.max(0, totalVideoDuration - fo); gn.gain.setValueAtTime(bv, recordStartTime + fs); gn.gain.linearRampToValueAtTime(0, recordStartTime + totalVideoDuration); }
        if (track.ducking && voiceoverData?.length > 0) {
          const dv = Math.max(0.05, bv * 0.15); const ft = 0.5; let cst = 0;
          voiceoverData.forEach(sv => { if (sv.audioBlob && sv.audioBlob.size > 0) { const st = recordStartTime + cst; const d = sv.duration || 5; if (st + ft < st + d - ft) { gn.gain.setValueAtTime(bv, st); gn.gain.linearRampToValueAtTime(dv, st + ft); gn.gain.setValueAtTime(dv, st + d - ft); gn.gain.linearRampToValueAtTime(bv, st + d); } } cst += sv.duration || 5; });
        }
        src.connect(gn); gn.connect(audioDestination);
        const so = parseFloat(track.startOffset || 0); let ts = parseFloat(track.trimStart || 0); const st = recordStartTime + so;
        let pd = parseFloat(track.duration || 0); if (pd <= 0) pd = buffer.duration - ts; if (ts < 0) ts = 0; if (pd <= 0) pd = 0.1; if (ts + pd > buffer.duration) pd = buffer.duration - ts;
        if (pd > 0) { src.start(st, ts, pd); activeAudioSources.push(src); }
      } catch (e) {}
    }
    // Fallback tracks
    for (const track of fallbackAudioTracks) {
      try {
        const ae = new Audio(URL.createObjectURL(track.file)); ae.crossOrigin = "anonymous";
        const src = audioContext.createMediaElementSource(ae); const gn = audioContext.createGain(); gn.gain.value = parseFloat(track.volume || 1.0);
        src.connect(gn); gn.connect(audioDestination);
        const so = parseFloat(track.startOffset || 0), ts = parseFloat(track.trimStart || 0), pd = parseFloat(track.duration || 10);
        const delay = Math.max(0, (recordStartTime + so - audioContext.currentTime) * 1000);
        setTimeout(() => { ae.currentTime = ts; ae.play().catch(() => {}); }, delay);
        setTimeout(() => ae.pause(), delay + pd * 1000);
        activeAudioSources.push({ stop: () => { ae.pause(); ae.src = ""; } });
      } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 100));
    // Schedule voiceovers
    { const { scheduleVoiceovers } = await import('../voice/VoiceoverScheduler'); await scheduleVoiceovers({ images, voiceoverData, audioContext, recordStartTime, audioDestination, activeAudioSources, voiceoverVolume, selectedVoice, speechPitch, speechSpeed, VOICES }); }
    // Render scenes
    let previousSceneLastFrame = null;
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i]; const voiceData = voiceoverData[i]; const sceneDuration = imageData.duration || 5;
      setCurrentTask(`Rendering scene ${i + 1} of ${images.length}...`); setProgress(75 + i / images.length * 20);
      if (i > 0) playSFX('transition');
      if (imageData.videoUrl) {
        await new Promise(async (resolve) => {
          const video = document.createElement('video'); video.crossOrigin = 'anonymous'; video.src = imageData.videoUrl; video.muted = true; video.playsInline = true; video.loop = true; video.preload = 'auto';
          video.style.position = 'fixed'; video.style.top = '0'; video.style.left = '0'; video.style.width = '640px'; video.style.height = '360px'; video.style.opacity = '0.01'; video.style.pointerEvents = 'none'; video.style.zIndex = '-9999';
          document.body.appendChild(video);
          let fallbackImg = null;
          if (imageData.url) { try { fallbackImg = new Image(); fallbackImg.crossOrigin = 'anonymous'; fallbackImg.src = imageData.url; await new Promise(r => { fallbackImg.onload = r; fallbackImg.onerror = r; }); } catch (e) {} }
          const cleanup = () => { try { if (document.body.contains(video)) document.body.removeChild(video); } catch (e) {} };
          const handleFallback = () => { cleanup(); if (fallbackImg) { (async () => { await renderImageSceneWithEffects(ctx, canvas, fallbackImg, imageData, sceneDuration, voiceData, previousSceneLastFrame, null, renderSpeed); previousSceneLastFrame = fallbackImg; resolve(); })(); } else resolve(); };
          video.oncanplay = async () => {
            try { await video.play(); video.playbackRate = (imageData.speed || 1.0) * (renderSpeed || 1.0); await new Promise(r => setTimeout(r, 200));
              await renderImageSceneWithEffects(ctx, canvas, video, imageData, sceneDuration, voiceData, previousSceneLastFrame, fallbackImg, 1.0);
              try { const tc = document.createElement('canvas'); tc.width = canvas.width; tc.height = canvas.height; tc.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); const li = new Image(); li.src = tc.toDataURL(); previousSceneLastFrame = li; } catch (e) { if (fallbackImg) previousSceneLastFrame = fallbackImg; }
              video.pause(); cleanup(); resolve();
            } catch (e) { handleFallback(); }
          };
          video.onerror = () => handleFallback();
          setTimeout(() => { if (video.readyState < 2) handleFallback(); }, 15000);
        });
      } else if (imageData.url) {
        await new Promise((resolve, reject) => {
          const img = new Image(); img.crossOrigin = 'anonymous';
          const timeout = setTimeout(() => { renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData).then(resolve).catch(reject); }, 10000);
          img.onload = async () => { clearTimeout(timeout); try { imageCache[imageData.url] = img; await renderImageSceneWithEffects(ctx, canvas, img, imageData, sceneDuration, voiceData, previousSceneLastFrame, null, renderSpeed || 1.0); previousSceneLastFrame = img; resolve(); } catch (e) { reject(e); } };
          img.onerror = async () => { clearTimeout(timeout); try { await renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData); previousSceneLastFrame = null; resolve(); } catch (e) { reject(e); } };
          if (imageCache[imageData.url]) { const ci = imageCache[imageData.url]; clearTimeout(timeout); (async () => { try { await renderImageSceneWithEffects(ctx, canvas, ci, imageData, sceneDuration, voiceData, previousSceneLastFrame, null, renderSpeed || 1.0); previousSceneLastFrame = ci; resolve(); } catch (e) { reject(e); } })(); }
          else img.src = imageData.url;
        });
      } else { await renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData); previousSceneLastFrame = null; }
    }
    await new Promise(r => setTimeout(r, 1000));
    if (mediaRecorder.state === 'recording') { mediaRecorder.stop(); playSFX('success'); }
    activeAudioSources.forEach(s => { try { s.stop(); } catch (e) {} });
    await incrementUsage();
  } catch (err) { console.error("Video assembly error:", err); setError(`Failed to create video: ${err.message}`); setIsProcessing(false); }
}