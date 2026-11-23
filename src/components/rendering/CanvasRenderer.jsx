// Canvas rendering helpers extracted from Home page
import { GLOBAL_FILTERS } from '../effects/SlideEffects';

export const getEasedProgress = (p, type) => {
    switch(type) {
        case 'ease-in': return p * p;
        case 'ease-out': return p * (2 - p);
        case 'ease-in-out': return p < .5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        default: return p;
    }
};

export const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine + (currentLine.length > 0 ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
};

export const applyGlobalFilter = (ctx, filterType) => {
    const filter = GLOBAL_FILTERS.find(f => f.id === filterType);
    if (filter && filter.filter) ctx.filter = filter.filter;
};

export const applySlideEffect = (ctx, canvas, img, effect, rawProgress, intensity = 1.0, easing = 'linear', customMotion = null, tilt = { x: 0, y: 0 }) => {
    const progress = getEasedProgress(rawProgress, easing);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    if (customMotion?.rotation) {
        ctx.translate(centerX, centerY);
        ctx.rotate((customMotion.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        const rotScale = 1 + (Math.abs(customMotion.rotation) * 0.01);
        ctx.translate(centerX, centerY);
        ctx.scale(rotScale, rotScale);
        ctx.translate(-centerX, -centerY);
    }
    if (customMotion?.shakeIntensity > 0) {
        const shake = customMotion.shakeIntensity * 2;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        const shakeScale = 1.02 + (customMotion.shakeIntensity * 0.005);
        ctx.translate(centerX, centerY);
        ctx.scale(shakeScale, shakeScale);
        ctx.translate(-centerX, -centerY);
    }
    ctx.restore();

    const srcWidth = img.videoWidth || img.width;
    const srcHeight = img.videoHeight || img.height;
    const imgAspect = srcWidth / srcHeight;
    const canvasAspect = canvas.width / canvas.height;
    let drawWidth, drawHeight, drawX, drawY;
    if (imgAspect > canvasAspect) {
        drawHeight = canvas.height; drawWidth = canvas.height * imgAspect;
        drawX = (canvas.width - drawWidth) / 2; drawY = 0;
    } else {
        drawWidth = canvas.width; drawHeight = canvas.width / imgAspect;
        drawX = 0; drawY = (canvas.height - drawHeight) / 2;
    }

    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (customMotion?.rotation) {
        ctx.translate(centerX, centerY);
        ctx.rotate((customMotion.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        const rotScale = 1 + (Math.abs(customMotion.rotation) * 0.01);
        ctx.translate(centerX, centerY);
        ctx.scale(rotScale, rotScale);
        ctx.translate(-centerX, -centerY);
    }
    if (customMotion?.shakeIntensity > 0) {
        const shake = customMotion.shakeIntensity * 2;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        const shakeScale = 1.02 + (customMotion.shakeIntensity * 0.005);
        ctx.translate(centerX, centerY);
        ctx.scale(shakeScale, shakeScale);
        ctx.translate(-centerX, -centerY);
    }
    if (tilt.x !== 0 || tilt.y !== 0) {
        const skewX = (tilt.x * 0.02) * Math.sin(rawProgress * Math.PI);
        const skewY = (tilt.y * 0.02) * Math.cos(rawProgress * Math.PI);
        ctx.transform(1, skewY, skewX, 1, 0, 0);
        const scaleSafe = 1 + Math.max(Math.abs(skewX), Math.abs(skewY));
        ctx.scale(scaleSafe, scaleSafe);
    }

    const safeIntensity = Math.max(0.1, intensity);

    switch (effect) {
        case 'custom': {
            let kfX = 0.5, kfY = 0.5, kfScale = 1.0;
            if (customMotion?.keyframes && customMotion.keyframes.length > 1) {
                const kfs = customMotion.keyframes;
                const segmentCount = kfs.length - 1;
                const segmentIndex = Math.min(Math.floor(progress * segmentCount), segmentCount - 1);
                const segmentProgress = (progress * segmentCount) - segmentIndex;
                const k1 = kfs[segmentIndex]; const k2 = kfs[segmentIndex + 1];
                kfX = (k1.x / 100) + ((k2.x / 100) - (k1.x / 100)) * segmentProgress;
                kfY = ((k1.y || 50) / 100) + (((k2.y || 50) / 100) - ((k1.y || 50) / 100)) * segmentProgress;
                kfScale = k1.scale + (k2.scale - k1.scale) * segmentProgress;
            } else {
                const startX = customMotion?.startX !== undefined ? customMotion.startX / 100 : 0.5;
                const startY = customMotion?.startY !== undefined ? customMotion.startY / 100 : 0.5;
                const startScale = customMotion?.startScale || 1.0;
                const endX = customMotion?.endX !== undefined ? customMotion.endX / 100 : 0.5;
                const endY = customMotion?.endY !== undefined ? customMotion.endY / 100 : 0.5;
                const endScale = customMotion?.endScale || 1.2;
                kfX = startX + (endX - startX) * progress;
                kfY = startY + (endY - startY) * progress;
                kfScale = startScale + (endScale - startScale) * progress;
            }
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(kfScale, kfScale);
            ctx.translate((0.5 - kfX) * canvas.width, (0.5 - kfY) * canvas.height);
            ctx.translate(-canvas.width/2, -canvas.height/2);
            break;
        }
        case 'zoom-in': {
            const s = 1.0 + (0.3 * safeIntensity * progress);
            ctx.translate(centerX, centerY); ctx.scale(s, s); ctx.translate(-centerX, -centerY);
            break;
        }
        case 'zoom-out': {
            const s = (1.0 + 0.3 * safeIntensity) - (0.3 * safeIntensity * progress);
            ctx.translate(centerX, centerY); ctx.scale(s, s); ctx.translate(-centerX, -centerY);
            break;
        }
        case 'pan-left':
            drawWidth = canvas.height * imgAspect * (1.2 * safeIntensity);
            drawHeight = canvas.height * (1.2 * safeIntensity);
            drawX = canvas.width - drawWidth; drawY = (canvas.height - drawHeight) / 2;
            ctx.translate((Math.abs(canvas.width - drawWidth)) * progress, 0);
            break;
        case 'pan-right':
            drawWidth = canvas.height * imgAspect * (1.2 * safeIntensity);
            drawHeight = canvas.height * (1.2 * safeIntensity);
            drawX = 0; drawY = (canvas.height - drawHeight) / 2;
            ctx.translate(-(drawWidth - canvas.width) * progress, 0);
            break;
        case 'pan-up':
            drawWidth = canvas.width * (1.2 * safeIntensity);
            drawHeight = canvas.width / imgAspect * (1.2 * safeIntensity);
            if (drawHeight < canvas.height) drawHeight = canvas.height * 1.2;
            drawX = (canvas.width - drawWidth) / 2; drawY = canvas.height - drawHeight;
            ctx.translate(0, (Math.abs(canvas.height - drawHeight)) * progress);
            break;
        case 'pan-down':
            drawWidth = canvas.width * (1.2 * safeIntensity);
            drawHeight = canvas.width / imgAspect * (1.2 * safeIntensity);
            if (drawHeight < canvas.height) drawHeight = canvas.height * 1.2;
            drawX = (canvas.width - drawWidth) / 2; drawY = 0;
            ctx.translate(0, -(drawHeight - canvas.height) * progress);
            break;
        case 'slide-left': ctx.translate(canvas.width * (1 - progress), 0); break;
        case 'slide-right': ctx.translate(-canvas.width * (1 - progress), 0); break;
        case 'fade-in': ctx.globalAlpha = progress; break;
        case 'fade-out': ctx.globalAlpha = 1 - progress; break;
        case 'blur-in': ctx.filter = `blur(${20 * safeIntensity * (1 - progress)}px)`; break;
        case 'pixelate': {
            const blockSize = 1 + (50 * safeIntensity * (1 - progress));
            if (blockSize > 1) {
                ctx.imageSmoothingEnabled = false;
                const pScale = 1 + (0.1 * ((Math.floor(progress * 10) % 2)));
                ctx.translate(centerX, centerY); ctx.scale(pScale, pScale); ctx.translate(-centerX, -centerY);
            }
            break;
        }
        case 'breathe': {
            const c = Math.sin(progress * Math.PI * 4);
            const s = 1.0 + (0.02 * safeIntensity * c);
            const by = (0.01 * canvas.height * safeIntensity) * c;
            ctx.translate(centerX, centerY); ctx.scale(s, s); ctx.translate(-centerX, -centerY + by);
            break;
        }
        case 'float': {
            const fx = Math.sin(progress * Math.PI * 2) * (10 * safeIntensity);
            const fy = Math.cos(progress * Math.PI * 4) * (5 * safeIntensity);
            ctx.translate(fx, fy);
            const fr = Math.sin(progress * Math.PI * 2) * (0.01 * safeIntensity);
            ctx.translate(centerX, centerY); ctx.rotate(fr); ctx.translate(-centerX, -centerY);
            break;
        }
        case 'sway': {
            const sr = Math.sin(progress * Math.PI * 2) * (0.03 * safeIntensity);
            ctx.translate(canvas.width/2, canvas.height); ctx.rotate(sr); ctx.translate(-canvas.width/2, -canvas.height);
            ctx.translate(centerX, centerY); ctx.scale(1.05, 1.05); ctx.translate(-centerX, -centerY);
            break;
        }
        case 'heartbeat': {
            const beat = Math.sin(progress * Math.PI * 10);
            const pulse = beat > 0.8 ? (beat - 0.8) * 5 : 0;
            const hs = 1.0 + (0.05 * safeIntensity * pulse);
            ctx.translate(centerX, centerY); ctx.scale(hs, hs); ctx.translate(-centerX, -centerY);
            break;
        }
        default: break;
    }

    try {
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
};

export const drawTransition = (ctx, canvas, prevImg, currImg, progress, type, params = {}) => {
    const w = canvas.width; const h = canvas.height;
    const t = Math.max(0, Math.min(1, progress));
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h);
    if (prevImg) { ctx.save(); try { ctx.drawImage(prevImg, 0, 0, w, h); } catch (e) {} ctx.restore(); }
    if (currImg) {
        ctx.save();
        switch(type) {
            case 'wipe':
                ctx.beginPath();
                if (params.wipeAngle >= 315 || params.wipeAngle < 45) ctx.rect(0, 0, w * t, h);
                else if (params.wipeAngle >= 45 && params.wipeAngle < 135) ctx.rect(0, 0, w, h * t);
                else if (params.wipeAngle >= 135 && params.wipeAngle < 225) ctx.rect(w * (1-t), 0, w * t, h);
                else ctx.rect(0, h * (1-t), w, h * t);
                ctx.clip(); break;
            case 'slide': ctx.translate(w * (1 - t), 0); break;
            case 'iris': {
                const cx = (params.irisX !== undefined ? params.irisX / 100 : 0.5) * w;
                const cy = (params.irisY !== undefined ? params.irisY / 100 : 0.5) * h;
                const maxD = Math.max(Math.hypot(cx,cy),Math.hypot(w-cx,cy),Math.hypot(cx,h-cy),Math.hypot(w-cx,h-cy));
                ctx.beginPath(); ctx.arc(cx, cy, maxD * t, 0, Math.PI * 2); ctx.clip(); break;
            }
            case 'zoom': {
                ctx.globalAlpha = t;
                const s = 0.5 + 0.5 * t;
                ctx.translate(w/2, h/2); ctx.scale(s, s); ctx.translate(-w/2, -h/2); break;
            }
            case 'glitch':
                if (Math.random() > 0.5) {
                    const slices = 10; const hSlice = h / slices;
                    for(let i=0;i<slices;i++){
                        if(Math.random()>0.7){const off=(Math.random()-0.5)*w*0.2*(1-t);ctx.drawImage(currImg,0,i*hSlice,w,hSlice,off,i*hSlice,w,hSlice);}
                        else ctx.drawImage(currImg,0,i*hSlice,w,hSlice,0,i*hSlice,w,hSlice);
                    }
                    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,0,0,${0.5*(1-t)})`;ctx.fillRect(Math.random()*10,0,w,h);ctx.globalCompositeOperation='source-over';
                } else ctx.drawImage(currImg, 0, 0, w, h);
                break;
            case 'fade': default: ctx.globalAlpha = t; break;
        }
        ctx.drawImage(currImg, 0, 0, w, h);
        ctx.restore();
    }
};

export const drawOverlay = (ctx, canvas, type, time, params = {}) => {
    if (!type || type === 'none') return;
    const w = canvas.width; const h = canvas.height;
    const speed = params.overlaySpeed || 1.0;
    const t = time * speed;
    const density = params.overlayDensity || 1.0;
    const customColor = params.overlayColor;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    switch(type) {
        case 'rain': {
            ctx.strokeStyle = customColor || 'rgba(174, 194, 224, 0.5)'; ctx.lineWidth = 2; ctx.beginPath();
            for (let i = 0; i < 100*density; i++) { const r=(i*1337.7+t*1000)%w; const dy=(i*512.3+t*800)%(h+100)-100; ctx.moveTo(r,dy); ctx.lineTo(r-2,dy+20+(i%20)); }
            ctx.stroke(); break;
        }
        case 'snow': {
            ctx.fillStyle = customColor || 'rgba(255, 255, 255, 0.8)';
            for (let i=0;i<80*density;i++){const r=(i*823.1+Math.sin(t+i)*50+t*50)%w;const dy=(i*441.9+t*150)%(h+20)-20;ctx.beginPath();ctx.arc(r,dy,(i%3)+2,0,Math.PI*2);ctx.fill();}
            break;
        }
        case 'grain': {
            ctx.globalCompositeOperation = 'overlay';
            for(let i=0;i<500*density;i++){ctx.fillStyle=customColor||`rgba(0,0,0,${Math.random()*0.2})`;ctx.fillRect(Math.random()*w,Math.random()*h,2,2);}
            break;
        }
        case 'dust': {
            ctx.fillStyle = customColor || 'rgba(200, 200, 200, 0.3)';
            for(let i=0;i<40*density;i++){const dx=(i*911.3+t*20)%w;const dy=(i*333.1+Math.sin(t*0.5+i)*30)%h;ctx.beginPath();ctx.arc(dx,dy,(i%3)+1,0,Math.PI*2);ctx.fill();}
            break;
        }
        case 'sparkles': {
            ctx.fillStyle = customColor || 'rgba(255, 255, 200, 0.8)';
            for(let i=0;i<20*density;i++){if(Math.sin(t*5+i)>0.8){ctx.beginPath();ctx.arc((i*123.45)%w,(i*678.9)%h,(i%4)+2,0,Math.PI*2);ctx.fill();}}
            break;
        }
        case 'embers': {
            ctx.fillStyle = customColor || 'rgba(255, 100, 0, 0.6)'; ctx.globalCompositeOperation = 'screen';
            for(let i=0;i<50*density;i++){const ex=(i*234.1+Math.sin(t*2+i)*20)%w;const ey=(h+50)-((i*111.1+t*100)%(h+100));ctx.globalAlpha=(0.5+0.5*Math.sin(t*10+i))*0.8;ctx.beginPath();ctx.arc(ex,ey,(i%3)+1,0,Math.PI*2);ctx.fill();}
            break;
        }
        case 'fog': {
            ctx.fillStyle = customColor || 'rgba(200, 220, 255, 0.05)';
            for(let i=0;i<5*density;i++){const fx=((i*300)+t*20)%(w+400)-200;const fy=(h/2)+Math.sin(t*0.2+i)*50;ctx.beginPath();ctx.arc(fx,fy,300,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(w-fx,fy+100,240,0,Math.PI*2);ctx.fill();}
            break;
        }
        case 'glitch': {
            if(Math.random()>0.7){ctx.globalCompositeOperation='exclusion';for(let i=0;i<3*density;i++){ctx.fillStyle=Math.random()>0.5?(customColor||'rgba(255,0,255,0.5)'):(customColor||'rgba(0,255,255,0.5)');ctx.fillRect(Math.random()*20-10,Math.random()*h,w,Math.random()*50+5);}}
            break;
        }
        case 'bokeh': {
            ctx.globalCompositeOperation = 'screen';
            for(let i=0;i<15*density;i++){const bx=(i*99.9+Math.sin(t*0.1+i)*100)%w;const by=(i*77.7+Math.cos(t*0.1+i)*100)%h;const op=0.1+0.1*Math.sin(t*0.5+i);ctx.fillStyle=customColor?customColor.replace(')',`, ${op})`).replace('rgb','rgba'):`hsla(${i*20},70%,70%,${op})`;ctx.beginPath();ctx.arc(bx,by,30+(i%5)*10,0,Math.PI*2);ctx.fill();}
            break;
        }
        case 'scanlines': {
            ctx.fillStyle='rgba(0,0,0,0.1)';ctx.globalCompositeOperation='overlay';
            for(let y=0;y<h;y+=4)ctx.fillRect(0,y,w,2);
            ctx.fillStyle=customColor||'rgba(255,255,255,0.05)';ctx.fillRect(0,(t*100)%h,w,20);
            break;
        }
    }
    ctx.restore();
};

export const addSynchronizedCaption = (ctx, canvas, voiceData, currentTime, options = {}) => {
    if (!voiceData) return;
    // Use custom subtitle text if provided, otherwise fall back to dialogue
    const displayDialogue = voiceData.subtitleText || voiceData.dialogue;
    if (!displayDialogue) return;

    const subtitleOptions = {
        enabled: true,
        fontFamily: 'Arial',
        fontSize: 32,
        textColor: '#FFFFFF',
        activeWordColor: '#FFFF00',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        animation: 'highlight',
        ...options
    };

    const overlayHeight = Math.max(110, subtitleOptions.fontSize * 3.2);
    let currentWordIndex = -1;
    if (voiceData.wordTimings) {
        for (let i = 0; i < voiceData.wordTimings.length; i++) {
            if (currentTime >= voiceData.wordTimings[i].start_time && currentTime < voiceData.wordTimings[i].end_time) {
                currentWordIndex = i;
                break;
            }
        }
    }

    ctx.save();
    ctx.fillStyle = subtitleOptions.backgroundColor;
    ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

    ctx.font = `bold ${subtitleOptions.fontSize}px ${subtitleOptions.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const allText = (voiceData.wordTimings && voiceData.wordTimings.length > 0) ? voiceData.wordTimings.map(w => w.word).join(' ') : displayDialogue;
    const lines = wrapText(ctx, allText, canvas.width - 80);
    const lineHeight = subtitleOptions.fontSize + 8;
    const startY = canvas.height - overlayHeight + (overlayHeight - (lines.length * lineHeight)) / 2 + lineHeight / 2;

    let globalWordCounter = 0;
    lines.forEach((line, lineIndex) => {
        const lineWords = line.split(' ');
        let currentX = (canvas.width / 2) - (ctx.measureText(line).width / 2);

        lineWords.forEach((wordInLine) => {
            const originalWordObj = voiceData.wordTimings ? voiceData.wordTimings[globalWordCounter] : null;
            const isCurrentWord = globalWordCounter === currentWordIndex;
            const displayWord = originalWordObj ? originalWordObj.word : wordInLine;
            const wordWidth = ctx.measureText(displayWord).width;
            const wordX = currentX + wordWidth / 2;
            const wordY = startY + lineIndex * lineHeight;

            ctx.save();
            if (isCurrentWord && subtitleOptions.animation === 'pop') {
                ctx.translate(wordX, wordY);
                ctx.scale(1.12, 1.12);
                ctx.translate(-wordX, -wordY);
            }
            if (isCurrentWord && subtitleOptions.animation === 'slide') {
                ctx.translate(0, -4);
            }

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.lineWidth = 6;
            ctx.strokeText(displayWord, wordX, wordY);
            ctx.fillStyle = isCurrentWord ? subtitleOptions.activeWordColor : subtitleOptions.textColor;
            ctx.fillText(displayWord, wordX, wordY);
            ctx.restore();

            currentX += ctx.measureText(displayWord + ' ').width;
            globalWordCounter++;
        });
    });

    ctx.restore();
};

export const applyPuppetWarp = (ctx, canvas, img, progress, points) => {
    if (!points || points.length === 0) return;
    const w = canvas.width; const h = canvas.height;
    const numStrips = 40; const stripHeight = h / numStrips;
    ctx.save();
    for (let i = 0; i < numStrips; i++) {
        const y = i * stripHeight; const centerY = y + stripHeight/2;
        let totalOffsetX = 0, totalOffsetY = 0;
        points.forEach(p => {
            const py = (p.y / 100) * h;
            const force = (p.force || 50) / 50;
            const distY = Math.abs(centerY - py);
            const influence = Math.max(0, 1 - (distY / (h * 0.3)));
            if (influence > 0) {
                const phase = (progress * Math.PI * 2) + (i * 0.1);
                totalOffsetX += Math.sin(phase) * 20 * force * influence;
                totalOffsetY += Math.cos(phase) * 10 * force * influence;
            }
        });
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y, w, stripHeight + 1); ctx.clip();
        ctx.drawImage(img, totalOffsetX - 20, y + totalOffsetY - 10, w + 40, h + 20);
        ctx.restore();
    }
    ctx.restore();
};

export const applyWarpEffect = (ctx, canvas, img, progress) => {
    const w = canvas.width; const h = canvas.height;
    const numStrips = 32; const stripHeight = h / numStrips;
    ctx.save();
    const scale = 1.05 + (Math.sin(progress * Math.PI * 2) * 0.02);
    const tx = (w - w * scale) / 2; const ty = (h - h * scale) / 2;
    for (let i = 0; i < numStrips; i++) {
        const y = i * stripHeight;
        const phase = (progress * Math.PI * 2) + (i * 0.2);
        const offsetX = Math.sin(phase) * 10;
        const offsetY = Math.cos(phase * 0.5) * 5;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y, w, stripHeight + 1); ctx.clip();
        ctx.drawImage(img, tx + offsetX, ty + offsetY, w * scale, h * scale);
        ctx.restore();
    }
    ctx.restore();
};