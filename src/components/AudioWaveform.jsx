import React, { useEffect, useRef } from 'react';

export default function AudioWaveform({ audioFile, width, height, color = '#10b981' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!audioFile || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = width || 400;
        canvas.height = height || 40;

        // Clear canvas
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decode audio to generate waveform
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const rawData = audioBuffer.getChannelData(0);
                const samples = Math.min(width, rawData.length);
                const blockSize = Math.floor(rawData.length / samples);
                const filteredData = [];
                
                // Downsample data for visualization
                for (let i = 0; i < samples; i++) {
                    let blockStart = blockSize * i;
                    let sum = 0;
                    for (let j = 0; j < blockSize; j++) {
                        sum += Math.abs(rawData[blockStart + j]);
                    }
                    filteredData.push(sum / blockSize);
                }
                
                // Normalize data
                const max = Math.max(...filteredData);
                const normalizedData = filteredData.map(n => n / max);
                
                // Draw waveform
                ctx.fillStyle = color;
                const barWidth = canvas.width / samples;
                const centerY = canvas.height / 2;
                
                normalizedData.forEach((amplitude, i) => {
                    const barHeight = amplitude * (canvas.height / 2) * 0.9;
                    const x = i * barWidth;
                    
                    // Draw symmetrical bars
                    ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
                });
                
                audioContext.close();
            } catch (error) {
                console.error("Waveform generation failed:", error);
                // Draw placeholder bars
                drawPlaceholderWaveform(ctx, canvas, color);
            }
        };
        
        reader.readAsArrayBuffer(audioFile);
    }, [audioFile, width, height, color]);

    const drawPlaceholderWaveform = (ctx, canvas, color) => {
        ctx.fillStyle = color;
        const barCount = 60;
        const barWidth = canvas.width / barCount;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < barCount; i++) {
            const amplitude = 0.2 + Math.random() * 0.6;
            const barHeight = amplitude * (canvas.height / 2) * 0.8;
            ctx.fillRect(i * barWidth, centerY - barHeight, Math.max(1, barWidth - 1), barHeight * 2);
        }
    };

    return <canvas ref={canvasRef} className="w-full h-full" />;
}