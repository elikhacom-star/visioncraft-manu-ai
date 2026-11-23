import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@2.5.2';

function sanitize(str) {
    if (!str) return '';
    let s = str;
    if (typeof s.normalize === 'function') {
        s = s.normalize('NFC');
    }
    
    const replacements = {
        '\u0152': 'OE', '\u0153': 'oe',
        '\u2018': "'", '\u2019': "'", '\u02BC': "'",
        '\u201C': '"', '\u201D': '"', '\u201A': ',', '\u201E': '"',
        '\u2013': '-', '\u2014': '-', '\u2015': '-', '\u2012': '-', '\u2010': '-', '\u2011': '-',
        '\u2026': '...',
        '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u200A': ' ', '\u202F': ' ', '\u00A0': ' ',
        '\u200B': '', '\u200C': '', '\u200D': '', '\uFEFF': '',
        '\u2039': '<', '\u203A': '>',
        '\u20AC': 'EUR', '\u2022': '-', '\u2192': '->', '\u21D2': '=>', '\u2122': 'TM',
    };
    
    let result = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const code = s.charCodeAt(i);
        
        if (code <= 127) { result += ch; continue; }
        if (code >= 160 && code <= 255) { result += ch; continue; }
        if (replacements[ch] !== undefined) { result += replacements[ch]; continue; }
        if (code >= 0xD800 && code <= 0xDFFF) { i++; continue; }
        if (code >= 0x0300 && code <= 0x036F) { continue; }
        if (code >= 128 && code < 160) { continue; }
        result += ' ';
    }
    return result;
}

function fmtDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '5s';
    const s = Math.round(seconds * 10) / 10;
    if (s >= 60) {
        const m = Math.floor(s / 60);
        const rem = Math.round(s % 60);
        return rem > 0 ? (m + 'm ' + rem + 's') : (m + 'm');
    }
    return s + 's';
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const script = body.script;
        const scenes = body.scenes;
        const voiceovers = body.voiceovers;
        const audioTracks = body.audioTracks;
        const projectName = body.projectName;
        const settings = body.settings;

        if (!scenes || scenes.length === 0) {
            return Response.json({ error: 'No scenes provided' }, { status: 400 });
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const mL = 25;
        const mR = 25;
        const cW = pageW - mL - mR;
        let y = 0;

        const footer = function() {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Page ' + doc.internal.getNumberOfPages(), pageW - mR, pageH - 10, { align: 'right' });
            doc.setTextColor(0);
        };

        const check = function(needed) {
            if (y + needed > pageH - 20) {
                doc.addPage();
                y = 20;
                footer();
            }
        };

        const sText = function(text, x, yy, opts) {
            doc.text(sanitize(text || ''), x, yy, opts);
        };

        const sSplit = function(text, w) {
            return doc.splitTextToSize(sanitize(text || ''), w);
        };

        // COVER PAGE
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(1.5);
        doc.line(mL, 60, pageW - mR, 60);

        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        sText(projectName || 'Untitled Screenplay', pageW / 2, 80, { align: 'center', maxWidth: cW });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('SCREENPLAY / STORYBOARD', pageW / 2, 100, { align: 'center' });

        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.5);
        doc.line(pageW / 2 - 30, 105, pageW / 2 + 30, 105);

        doc.setFontSize(11);
        doc.setTextColor(80);
        var totalDur = 0;
        for (var si = 0; si < scenes.length; si++) { totalDur += (scenes[si].duration || 5); }

        var meta = [
            'Author: ' + sanitize(user.full_name || user.email),
            'Date: ' + new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
            'Scenes: ' + scenes.length,
            'Duration: ' + fmtDuration(totalDur),
        ];
        if (settings && settings.resolution) meta.push('Resolution: ' + settings.resolution);
        if (settings && settings.artStyle) meta.push('Art Style: ' + sanitize(settings.artStyle));

        var metaY = 120;
        for (var mi = 0; mi < meta.length; mi++) {
            doc.text(meta[mi], pageW / 2, metaY, { align: 'center' });
            metaY += 7;
        }

        doc.setFontSize(9);
        doc.setTextColor(180);
        doc.text('Generated by Visioncraft AI', pageW / 2, pageH - 25, { align: 'center' });
        footer();

        // SCRIPT PAGE
        if (script && script.trim()) {
            doc.addPage();
            y = 20;
            footer();

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30);
            doc.text('FULL SCRIPT', mL, y);
            y += 3;

            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(0.8);
            doc.line(mL, y, mL + 40, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50);

            var scriptLines = sSplit(script, cW);
            for (var li = 0; li < scriptLines.length; li++) {
                check(6);
                doc.text(scriptLines[li], mL, y);
                y += 5;
            }
        }

        // SCENE BREAKDOWN
        doc.addPage();
        y = 20;
        footer();

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30);
        doc.text('SCENE BREAKDOWN', mL, y);
        y += 3;
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.8);
        doc.line(mL, y, mL + 50, y);
        y += 10;

        for (var idx = 0; idx < scenes.length; idx++) {
            var scene = scenes[idx];
            var vo = voiceovers && voiceovers[idx];
            var sceneNum = scene.scene_number || idx + 1;
            var duration = scene.duration || 5;
            var effect = scene.effect || 'none';
            var mood = scene.mood || '';
            var camera = scene.camera_angle || '';
            var transition = scene.transition || '';

            var descLines = sSplit(scene.description || 'No description', cW - 10);
            var dialogueText = (vo && vo.dialogue) || scene.dialogue || '';
            var dialogueLines = dialogueText ? sSplit(dialogueText, cW - 20) : [];
            var blockH = 30 + (descLines.length * 5) + (dialogueLines.length > 0 ? 15 + dialogueLines.length * 5 : 0) + 10;

            check(blockH + 10);

            doc.setFillColor(245, 245, 245);
            doc.roundedRect(mL, y - 2, cW, 10, 2, 2, 'F');
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30);
            doc.text('SCENE ' + sceneNum, mL + 4, y + 5);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(fmtDuration(duration), pageW - mR - 4, y + 5, { align: 'right' });
            y += 14;

            var techParts = [];
            if (effect && effect !== 'none') techParts.push('Effect: ' + effect);
            if (mood) techParts.push('Mood: ' + sanitize(mood));
            if (camera) techParts.push('Camera: ' + sanitize(camera));
            if (transition) techParts.push('Transition: ' + transition);

            if (techParts.length > 0) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(130);
                doc.text(techParts.join('  |  '), mL + 4, y);
                y += 6;
            }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50);
            doc.text('VISUAL:', mL + 4, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60);
            for (var di = 0; di < descLines.length; di++) {
                check(5);
                doc.text(descLines[di], mL + 8, y);
                y += 5;
            }
            y += 2;

            if (dialogueLines.length > 0) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(50);
                doc.text('DIALOGUE:', mL + 4, y);
                y += 5;

                doc.setDrawColor(220);
                doc.setLineWidth(0.3);
                doc.line(mL + 8, y - 3, mL + 8, y + dialogueLines.length * 5);

                doc.setFont('courier', 'normal');
                doc.setTextColor(40);
                for (var dli = 0; dli < dialogueLines.length; dli++) {
                    check(5);
                    doc.text(dialogueLines[dli], mL + 12, y);
                    y += 5;
                }
                y += 2;
            }

            y += 4;
            doc.setDrawColor(230);
            doc.setLineWidth(0.2);
            doc.line(mL + 10, y, pageW - mR - 10, y);
            y += 8;
        }

        // AUDIO CUES
        var hasAT = audioTracks && audioTracks.length > 0;
        var hasVO = voiceovers && voiceovers.some(function(v) { return v && v.dialogue; });

        if (hasAT || hasVO) {
            check(40);
            if (y > 40) { doc.addPage(); y = 20; footer(); }

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30);
            doc.text('AUDIO CUES & TRACKS', mL, y);
            y += 3;
            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(0.8);
            doc.line(mL, y, mL + 55, y);
            y += 10;

            if (hasVO) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(50);
                doc.text('Voiceover', mL + 4, y);
                y += 7;

                for (var vi = 0; vi < voiceovers.length; vi++) {
                    var vv = voiceovers[vi];
                    if (!vv || !vv.dialogue) continue;
                    check(12);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(80);
                    doc.text('Scene ' + (vi + 1) + ':', mL + 8, y);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(60);
                    var voLine = sSplit(vv.dialogue, cW - 30);
                    for (var vli = 0; vli < voLine.length; vli++) {
                        check(5);
                        doc.text(voLine[vli], mL + 30, y);
                        y += 5;
                    }
                    y += 3;
                }
                y += 5;
            }

            if (hasAT) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(50);
                check(15);
                doc.text('Audio Tracks', mL + 4, y);
                y += 7;

                for (var ai = 0; ai < audioTracks.length; ai++) {
                    var track = audioTracks[ai];
                    check(10);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(60);
                    var parts = [
                        (ai + 1) + '. ' + sanitize(track.name || 'Untitled Track'),
                        'Type: ' + (track.type || 'audio'),
                        'Volume: ' + Math.round((track.volume || 1) * 100) + '%',
                    ];
                    if (track.ducking) parts.push('Ducking: ON');
                    doc.text(parts.join('  |  '), mL + 8, y);
                    y += 6;
                }
            }
        }

        var pdfBytes = doc.output('arraybuffer');
        var safeName = (projectName || 'screenplay').replace(/[^a-zA-Z0-9_\- ]/g, '_');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="' + safeName + '.pdf"'
            }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});