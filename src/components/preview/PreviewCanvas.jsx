import React, { useRef, useEffect, useCallback } from 'react';

const EASING = {
  linear: t => t,
  'ease-in': t => t * t,
  'ease-out': t => t * (2 - t),
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

function applyEffect(ctx, canvas, img, effect, progress, intensity = 1.0) {
  const w = canvas.width, h = canvas.height;
  let scale = 1, tx = 0, ty = 0;

  switch (effect) {
    case 'zoom-in': scale = 1 + progress * 0.15 * intensity; break;
    case 'zoom-out': scale = Math.max(1, (1 + 0.15 * intensity) - progress * 0.15 * intensity); break;
    case 'pan-left': tx = -progress * w * 0.1 * intensity; break;
    case 'pan-right': tx = progress * w * 0.1 * intensity; break;
    case 'pan-up': ty = -progress * h * 0.1 * intensity; break;
    case 'pan-down': ty = progress * h * 0.1 * intensity; break;
    case 'pulse': scale = 1 + Math.sin(progress * Math.PI * 4) * 0.03 * intensity; break;
    case 'breathe': scale = 1 + Math.sin(progress * Math.PI * 2) * 0.04 * intensity; break;
    case 'rotate-cw':
      ctx.translate(w / 2, h / 2);
      ctx.rotate(progress * 0.05 * intensity);
      ctx.translate(-w / 2, -h / 2);
      break;
    case 'rotate-ccw':
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-progress * 0.05 * intensity);
      ctx.translate(-w / 2, -h / 2);
      break;
    case 'float':
      ty = Math.sin(progress * Math.PI * 2) * h * 0.02 * intensity;
      break;
    case 'sway':
      tx = Math.sin(progress * Math.PI * 3) * w * 0.02 * intensity;
      break;
    default: break;
  }

  if (effect !== 'rotate-cw' && effect !== 'rotate-ccw') {
    const cx = w / 2 + tx;
    const cy = h / 2 + ty;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
  }
  ctx.drawImage(img, 0, 0, w, h);
}

function drawTransitionBlend(ctx, canvas, prevImg, nextImg, transProgress, transType) {
  const w = canvas.width, h = canvas.height;

  switch (transType) {
    case 'wipe': {
      const cutX = w * transProgress;
      if (prevImg) { ctx.save(); ctx.drawImage(prevImg, 0, 0, w, h); ctx.restore(); }
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, cutX, h); ctx.clip();
      ctx.drawImage(nextImg, 0, 0, w, h);
      ctx.restore();
      return;
    }
    case 'slide': {
      const offset = w * (1 - transProgress);
      if (prevImg) ctx.drawImage(prevImg, -w * transProgress, 0, w, h);
      ctx.drawImage(nextImg, offset, 0, w, h);
      return;
    }
    case 'iris': {
      if (prevImg) ctx.drawImage(prevImg, 0, 0, w, h);
      const radius = Math.sqrt(w * w + h * h) * transProgress / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(nextImg, 0, 0, w, h);
      ctx.restore();
      return;
    }
    case 'zoom': {
      if (prevImg) {
        ctx.save();
        const s = 1 + transProgress * 0.5;
        ctx.globalAlpha = 1 - transProgress;
        ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
        ctx.drawImage(prevImg, 0, 0, w, h);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = transProgress;
      ctx.drawImage(nextImg, 0, 0, w, h);
      ctx.restore();
      return;
    }
    case 'glitch': {
      const sliceCount = 8;
      const sliceH = h / sliceCount;
      for (let s = 0; s < sliceCount; s++) {
        const useNext = Math.random() < transProgress;
        const src = useNext ? nextImg : (prevImg || nextImg);
        const glitchX = (Math.random() - 0.5) * 20 * (1 - transProgress);
        ctx.drawImage(src, 0, s * sliceH, w, sliceH, glitchX, s * sliceH, w, sliceH);
      }
      return;
    }
    default: { // fade
      if (prevImg) { ctx.save(); ctx.globalAlpha = 1 - transProgress; ctx.drawImage(prevImg, 0, 0, w, h); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = transProgress; ctx.drawImage(nextImg, 0, 0, w, h); ctx.restore();
      return;
    }
  }
}

export default function PreviewCanvas({
  scenes, currentTime, totalDuration, effectIntensity = 1.0, isPlaying, imageCache, subtitleSettings
}) {
  const canvasRef = useRef(null);
  const prevFrameTime = useRef(null);

  const getSceneAtTime = useCallback((time) => {
    let elapsed = 0;
    for (let i = 0; i < scenes.length; i++) {
      const dur = scenes[i].duration || 5;
      if (time < elapsed + dur) {
        return { index: i, localTime: time - elapsed, duration: dur };
      }
      elapsed += dur;
    }
    return { index: scenes.length - 1, localTime: 0, duration: scenes[scenes.length - 1]?.duration || 5 };
  }, [scenes]);

  const renderFrame = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const { index, localTime, duration } = getSceneAtTime(time);
    const scene = scenes[index];
    if (!scene) return;

    const progress = Math.min(localTime / duration, 1);
    const easing = EASING[scene.easing || 'linear'] || EASING.linear;
    const easedProgress = easing(progress);

    const img = imageCache?.current?.[scene.url];
    const transitionDur = scene.transitionDuration || 0.8;
    const transType = scene.transition || 'fade';

    // Check if we're in a transition zone
    if (index > 0 && localTime < transitionDur) {
      const prevScene = scenes[index - 1];
      const prevImg = imageCache?.current?.[prevScene?.url];
      const transProgress = localTime / transitionDur;
      if (prevImg && img) {
        drawTransitionBlend(ctx, canvas, prevImg, img, transProgress, transType);
      } else if (img) {
        ctx.drawImage(img, 0, 0, w, h);
      }
    } else if (img) {
      ctx.save();
      applyEffect(ctx, canvas, img, scene.effect || 'zoom-in', easedProgress, effectIntensity);
      ctx.restore();
    } else {
      // Placeholder
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Scène ${index + 1}`, w / 2, h / 2 - 10);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(scene.description?.substring(0, 60) || '', w / 2, h / 2 + 15);
    }

    // Caption overlay — only show if subtitles enabled (or always show if no settings passed for backward compat)
    if (scene.dialogue && (subtitleSettings?.enabled !== false)) {
      const words = scene.dialogue.split(' ');
      const wordIdx = Math.floor(progress * words.length);
      const visibleText = words.slice(Math.max(0, wordIdx - 5), wordIdx + 6).join(' ');
      if (visibleText) {
        ctx.save();
        const boxH = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, h - boxH, w, boxH);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(visibleText, w / 2, h - boxH / 2);
        ctx.restore();
      }
    }

    // Scene number indicator
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, 8, 60, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Scène ${index + 1}`, 14, 19);
    ctx.restore();
  }, [scenes, effectIntensity, getSceneAtTime, imageCache]);

  useEffect(() => {
    renderFrame(currentTime);
  }, [currentTime, renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={854}
      height={480}
      className="w-full rounded-lg bg-black"
    />
  );
}