import { toast } from "sonner";

// Helper to convert AudioBuffer to WAV Blob
function bufferToWav(abuffer, len) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this parser)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);  // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

export async function generateProceduralAudio(type, duration, options = {}) {
  const { mood = 'calm', intensity = 0.5 } = options;
  const sampleRate = 44100;
  // Ensure precise duration
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const t = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  
  // Master volume adjustment
  gainNode.gain.setValueAtTime(0.5, t);

  if (type === 'music') {
    // SCALES
    const scales = {
      calm: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C Major Pentatonic
      dark: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63], // C Minor / Diminished feel (low)
      energetic: [261.63, 329.63, 392.00, 523.25, 587.33, 783.99], // Major Arpeggios (high)
      uplifting: [261.63, 329.63, 349.23, 392.00, 440.00, 493.88], // C Major Full
      horror: [130.81, 138.59, 155.56, 185.00, 233.08, 246.94], // Phrygian Dominant / Dissonant
      nature: [196.00, 261.63, 293.66, 392.00, 523.25, 587.33], // Pentatonic Nature
      city: [146.83, 196.00, 220.00, 293.66, 329.63], // Urban Jazz chords
    };
    
    const scale = scales[mood] || scales.calm;
    const layerCount = Math.floor(3 + (intensity * 4)); // 3 to 7 layers
    
    // Generate Layers
    for (let i = 0; i < layerCount; i++) {
      const osc = ctx.createOscillator();
      const layerGain = ctx.createGain();
      
      // Waveform based on mood
      if (mood === 'dark') osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
      else if (mood === 'energetic') osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
      else osc.type = 'sine'; // calm/uplifting
      
      // Pick random note from scale
      const freq = scale[Math.floor(Math.random() * scale.length)];
      // Detune slightly for thickness
      const detune = (Math.random() - 0.5) * (20 * intensity);
      
      osc.frequency.value = freq;
      osc.detune.value = detune;

      // Envelope / Rhythm
      const rhythmSpeed = mood === 'energetic' ? 0.25 : (mood === 'dark' ? 2.0 : 4.0);
      const attack = mood === 'energetic' ? 0.05 : 2.0;
      
      osc.connect(layerGain);
      layerGain.connect(gainNode);
      
      osc.start(0);
      osc.stop(duration);

      // Volume Automation (LFO-like)
      let currentTime = 0;
      while (currentTime < duration) {
        const val = Math.random() * (0.3 / layerCount);
        layerGain.gain.linearRampToValueAtTime(val, currentTime + attack);
        layerGain.gain.linearRampToValueAtTime(0, currentTime + rhythmSpeed);
        currentTime += rhythmSpeed;
      }
    }

    // Add noise texture for "Calm", "Dark", "Horror", "Nature", "City"
    if (['calm', 'dark', 'horror', 'nature', 'city'].includes(mood)) {
      const bufferSize = sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      
      if (mood === 'horror') {
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noiseGain.gain.value = 0.1; // Hiss
      } else if (mood === 'nature') {
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800; // Wind/Leaves
        noiseGain.gain.value = 0.08;
      } else if (mood === 'city') {
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 300; // Rumble
        noiseGain.gain.value = 0.15;
      } else {
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = mood === 'dark' ? 200 : 400;
        noiseGain.gain.value = 0.05;
      }

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(0);
    }

  } else if (type === 'sfx') {
    const sfxType = mood; // Reusing mood param for SFX type (whoosh, impact, etc)
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const sfxGain = ctx.createGain();

    osc.connect(filter);
    filter.connect(sfxGain);
    sfxGain.connect(ctx.destination);

    const now = 0;
    const end = duration;

    if (sfxType === 'whoosh') {
      // White noise for whoosh
      const bufferSize = sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(filter);
      
      // Filter Sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + duration / 2);
      filter.frequency.exponentialRampToValueAtTime(200, end);
      
      // Volume Envelope
      sfxGain.gain.setValueAtTime(0, now);
      sfxGain.gain.linearRampToValueAtTime(1, now + duration / 2);
      sfxGain.gain.linearRampToValueAtTime(0, end);
      
      noise.start(0);
    } else if (sfxType === 'impact') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      
      sfxGain.gain.setValueAtTime(1, now);
      sfxGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.start(0);
      osc.stop(duration);
    } else {
      // Generic / Sci-Fi Sweep (default)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(800, now + duration);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.linearRampToValueAtTime(2000, now + duration);
      
      sfxGain.gain.setValueAtTime(0.5, now);
      sfxGain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.start(0);
      osc.stop(duration);
    }
  }

  // Render
  const renderedBuffer = await ctx.startRendering();
  return bufferToWav(renderedBuffer, renderedBuffer.length);
}