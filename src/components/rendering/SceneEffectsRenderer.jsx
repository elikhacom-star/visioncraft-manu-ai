import { applySlideEffect, drawTransition, drawOverlay, addSynchronizedCaption, applyPuppetWarp, applyWarpEffect, wrapText } from './CanvasRenderer';

export async function renderImageSceneWithEffects(ctx, canvas, img, imageData, duration, voiceData, previousImg, fallbackImg, visualSpeedMultiplier, opts) {
    const { effectIntensity, globalFilter, GLOBAL_FILTERS, storyboardMotion, watermarkLogo, watermarkText, subtitleSettings } = opts;
    const fps = 24;
    const effectiveDuration = duration / visualSpeedMultiplier;
    const totalFrames = Math.ceil(effectiveDuration * fps);
    const sceneStartWallTime = performance.now();
    const transitionDuration = imageData.transitionDuration || 1.0;
    const transitionFrames = Math.ceil(transitionDuration * fps);
    const isTransitioning = previousImg && totalFrames > transitionFrames;

    let watermarkImg = null;
    if (watermarkLogo) {
        try {
            watermarkImg = new Image();
            watermarkImg.src = URL.createObjectURL(watermarkLogo);
            await new Promise(r => { watermarkImg.onload = r; watermarkImg.onerror = r; });
        } catch(e) {}
    }

    const isWarpAnimation = imageData.effect === 'ai-video-fallback' || imageData.effect === 'warp-flow' || (storyboardMotion === 'ai-video' && !imageData.videoUrl);

    for (let frame = 0; frame < totalFrames; frame++) {
        ctx.save();
        const progress = frame / Math.max(totalFrames - 1, 1);
        const sceneTime = progress * duration;
        const visualProgress = progress;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let skipMainDraw = false;

        if (isTransitioning && frame < transitionFrames) {
            const transProgress = Math.min(1.0, frame / transitionFrames);
            const transType = imageData.transition || 'fade';
            if (transType === 'fade') {
                if (previousImg) { ctx.save(); ctx.drawImage(previousImg, 0, 0, canvas.width, canvas.height); ctx.restore(); }
                ctx.globalAlpha = transProgress;
            } else {
                try { drawTransition(ctx, canvas, previousImg, img, transProgress, transType, { wipeAngle: imageData.wipeAngle, irisX: imageData.irisX, irisY: imageData.irisY }); } catch(e) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
                skipMainDraw = true;
            }
        } else { ctx.globalAlpha = 1; }

        if (!skipMainDraw) {
            const sceneFilterId = imageData.filter && imageData.filter !== 'none' ? imageData.filter : globalFilter;
            const filterObj = GLOBAL_FILTERS.find(f => f.id === sceneFilterId);
            const filterStr = filterObj ? filterObj.filter : '';
            const baseFilter = `brightness(${imageData.brightness || 100}%) contrast(${imageData.contrast || 100}%) saturate(${imageData.saturation || 100}%)`;
            ctx.filter = filterStr ? `${baseFilter} ${filterStr}` : baseFilter;

            try {
                let drawable = img;
                if (img.tagName === 'VIDEO' && (img.readyState < 2 || img.ended) && fallbackImg) drawable = fallbackImg;
                if (imageData.motionPoints && imageData.motionPoints.length > 0) { applyPuppetWarp(ctx, canvas, drawable, visualProgress, imageData.motionPoints); }
                else if (isWarpAnimation) { applyWarpEffect(ctx, canvas, drawable, visualProgress); }
                else {
                    const customMotion = { startX: imageData.startX, startY: imageData.startY, startScale: imageData.startScale, endX: imageData.endX, endY: imageData.endY, endScale: imageData.endScale, keyframes: imageData.keyframes };
                    const tilt = { x: imageData.tiltX || 0, y: imageData.tiltY || 0 };
                    const extendedMotion = { ...customMotion, shakeIntensity: imageData.shakeIntensity || 0, rotation: imageData.rotation || 0, depthMap: imageData.depthMap };
                    applySlideEffect(ctx, canvas, drawable, imageData.effect || 'zoom-in', visualProgress, effectIntensity, imageData.easing || 'linear', extendedMotion, tilt);
                }
            } catch(e) { ctx.filter = 'none'; try { ctx.drawImage(fallbackImg || img, 0, 0, canvas.width, canvas.height); } catch(err) {} }
            ctx.filter = 'none';
        }

        // Overlays
        if (imageData.vignette) {
            const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawOverlay(ctx, canvas, imageData.overlay, sceneTime, { overlaySpeed: imageData.overlaySpeed, overlayDensity: imageData.overlayDensity, overlayColor: imageData.overlayColor });
        const subtitleText = voiceData?.dialogue || imageData.dialogue || imageData.subtitleText || '';
        if (subtitleSettings?.enabled && subtitleText) {
            const enrichedVoice = { ...(voiceData || {}), dialogue: subtitleText, wordTimings: voiceData?.wordTimings || [] };
            addSynchronizedCaption(ctx, canvas, enrichedVoice, sceneTime, subtitleSettings);
        }
        if (watermarkImg) { const wmW = canvas.width * 0.15; const wmH = wmW * (watermarkImg.height / watermarkImg.width); ctx.save(); ctx.globalAlpha = 0.8; ctx.drawImage(watermarkImg, canvas.width - wmW - 20, 20, wmW, wmH); ctx.restore(); }
        if (watermarkText) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.fillText(watermarkText, 20, canvas.height - 20); ctx.restore(); }
        if (imageData.overlayText) {
            ctx.save();
            let textY = canvas.height / 2; let textStr = imageData.overlayText; const anim = imageData.textAnimation || 'none';
            if (anim === 'fade-up') { ctx.globalAlpha = Math.min(1, progress * 3); textY += (1 - Math.min(1, progress * 2)) * 50; }
            else if (anim === 'typewriter') { textStr = imageData.overlayText.substring(0, Math.floor(imageData.overlayText.length * Math.min(1, progress * 2))); }
            else if (anim === 'slide-in') { ctx.translate((1 - Math.pow(Math.min(1, progress * 2), 3)) * (-canvas.width/2), 0); }
            else if (anim === 'bounce') { textY -= Math.abs(Math.sin(progress * Math.PI * 3)) * (1 - progress) * 30; }
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'black'; ctx.shadowBlur = 8; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
            ctx.strokeText(textStr, canvas.width / 2, textY); ctx.fillText(textStr, canvas.width / 2, textY); ctx.restore();
        }
        ctx.restore();
        const targetTime = sceneStartWallTime + ((frame + 1) / fps) * 1000 / visualSpeedMultiplier;
        const waitMs = Math.max(0, targetTime - performance.now());
        if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs));
    }
}

export async function renderPlaceholderScene(ctx, canvas, imageData, duration, voiceData, sceneLabel, opts) {
    const fps = 24, totalFrames = Math.ceil(duration * fps), t0 = performance.now();
    for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / Math.max(totalFrames - 1, 1), sceneTime = progress * duration;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${sceneLabel} ${imageData.scene_number}`, canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = '28px Arial'; ctx.fillStyle = '#fbbf24';
        wrapText(ctx, imageData.description || 'AI Generated Scene', canvas.width - 200).forEach((line, idx) => ctx.fillText(line, canvas.width / 2, canvas.height / 2 + idx * 35));
        if (opts?.subtitleSettings?.enabled && (voiceData?.dialogue || imageData.subtitleText)) { const enrichedVoice = { ...voiceData, subtitleText: imageData.subtitleText }; addSynchronizedCaption(ctx, canvas, enrichedVoice, sceneTime, opts.subtitleSettings); }
        const wait = Math.max(0, t0 + ((frame + 1) / fps) * 1000 - performance.now());
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }
}