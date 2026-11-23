// Slideshow effects and rendering helpers extracted from Home page

export const SLIDE_EFFECTS = [
    'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 
    'fade-in', 'fade-out', 'blur-in', 'pixelate', 'slide-left', 'slide-right',
    'breathe', 'float', 'sway', 'heartbeat'
];

export const CINEMATIC_ANGLES = [
    "Wide Shot", "Extreme Wide Shot", "Aerial View", "Bird's Eye View", "Drone Shot",
    "Medium Shot", "Cowboy Shot", "Full Shot",
    "Close-up", "Extreme Close-up", "Macro Detail",
    "Low Angle", "High Angle", "Worm's Eye View",
    "Dutch Angle", "Canted Angle",
    "Over the Shoulder", "Point of View (POV)",
    "Tracking Shot", "Dolly Zoom", "Symmetrical Composition"
];

export const CINEMATIC_MOODS = [
    "Cinematic", "Dramatic", "Intense", "Suspenseful", "Mysterious",
    "Joyful", "Uplifting", "Energetic", "Vibrant", "Playful",
    "Melancholic", "Nostalgic", "Somber", "Sentimental",
    "Ethereal", "Dreamy", "Fantasy", "Magical", "Surreal",
    "Gritty", "Dark", "Noir", "Cyberpunk", "Dystopian",
    "Professional", "Clean", "Minimalist", "Corporate",
    "Romantic", "Intimate", "Warm", "Golden Hour"
];

export const GLOBAL_FILTERS = [
    { id: 'none', name: 'None', filter: '' },
    { id: 'noir', name: 'Film Noir (B&W)', filter: 'grayscale(100%) contrast(120%)' },
    { id: 'sepia', name: 'Sepia Vintage', filter: 'sepia(100%) contrast(110%)' },
    { id: 'vhs', name: 'VHS Retro', filter: 'saturate(150%) hue-rotate(10deg) contrast(120%)' },
    { id: 'cyberpunk', name: 'Cyberpunk', filter: 'saturate(200%) hue-rotate(270deg) contrast(130%)' },
    { id: 'warm', name: 'Warm Sunset', filter: 'saturate(130%) hue-rotate(20deg) brightness(105%)' },
    { id: 'cold', name: 'Cold Winter', filter: 'saturate(80%) hue-rotate(200deg) brightness(95%)' },
    { id: 'dream', name: 'Dream Soft', filter: 'saturate(70%) brightness(110%) contrast(80%)' },
    { id: 'horror', name: 'Horror Dark', filter: 'saturate(50%) brightness(70%) contrast(150%)' }
];

export const STYLE_PRESETS = [
    { id: 'anime', name: 'Anime/Manga', prompt: 'Japanese anime style, vibrant colors, cel-shaded, clean lines, Studio Ghibli aesthetic', filter: 'saturate(140%) contrast(110%) brightness(105%)' },
    { id: 'oil-painting', name: 'Oil Painting', prompt: 'Classic oil painting style, thick brush strokes, rich textures, impressionist technique, museum quality', filter: 'contrast(115%) saturate(120%)' },
    { id: 'watercolor', name: 'Watercolor', prompt: 'Soft watercolor painting, flowing colors, delicate brush strokes, artistic paper texture', filter: 'brightness(108%) saturate(90%) contrast(95%)' },
    { id: 'comic-book', name: 'Comic Book', prompt: 'Comic book illustration style, bold outlines, halftone dots, pop art colors, Marvel/DC aesthetic', filter: 'contrast(140%) saturate(160%)' },
    { id: 'pixar', name: '3D Animation (Pixar)', prompt: 'Pixar 3D animation style, smooth rendering, vibrant colors, cartoon characters, professional CGI', filter: 'saturate(125%) brightness(105%) contrast(108%)' },
    { id: 'noir-film', name: 'Film Noir', prompt: '1940s film noir aesthetic, dramatic shadows, high contrast black and white, cinematic lighting', filter: 'grayscale(100%) contrast(150%) brightness(90%)' },
    { id: 'cyberpunk-movie', name: 'Cyberpunk (Blade Runner)', prompt: 'Cyberpunk aesthetic like Blade Runner, neon lights, dark atmosphere, futuristic dystopia, rain-soaked streets', filter: 'saturate(180%) hue-rotate(280deg) contrast(130%) brightness(90%)' },
    { id: 'wes-anderson', name: 'Wes Anderson Style', prompt: 'Wes Anderson film aesthetic, symmetrical composition, pastel colors, whimsical, meticulously framed', filter: 'saturate(110%) brightness(102%) contrast(95%)' }
];

export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' }
];

export const playSFX = (type) => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        switch(type) {
            case 'transition':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.3);
                break;
            case 'click':
                oscillator.frequency.value = 1200;
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'success':
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
                break;
        }
    } catch (e) { console.warn('SFX playback failed:', e); }
};

export const PACING_PROFILES = {
    storytelling: {
        name: 'Storytelling Narratif', icon: '📖', description: 'Style narratif immersif avec voix off captivante',
        rules: { baseDuration: 8, maxDuration: 15, minDuration: 5, dialogueMultiplier: 0.42, actionMultiplier: 0.9, emotionalMultiplier: 1.3, landscapeMultiplier: 1.4, transitionStyle: 'cinematic', cameraMovements: ['Slow zoom-in', 'Dramatic wide shot', 'Close-up portrait', 'Establishing shot', 'Slow pan across scene'] }
    },
    action: {
        name: 'Action-Packed', icon: '⚡', description: 'Rapide, dynamique, coupes serrées',
        rules: { baseDuration: 3, maxDuration: 6, minDuration: 1.5, dialogueMultiplier: 0.35, actionMultiplier: 0.6, emotionalMultiplier: 0.8, landscapeMultiplier: 0.7, transitionStyle: 'fast', cameraMovements: ['Whip pan', 'Quick zoom', 'Handheld shake', 'Tracking shot', 'Dutch angle'] }
    },
    cinematic: {
        name: 'Cinematic Drama', icon: '🎬', description: 'Lent, émotionnel, plans larges',
        rules: { baseDuration: 6, maxDuration: 12, minDuration: 3, dialogueMultiplier: 0.5, actionMultiplier: 1.0, emotionalMultiplier: 1.4, landscapeMultiplier: 1.5, transitionStyle: 'smooth', cameraMovements: ['Slow push', 'Dolly zoom', 'Crane shot', 'Steadicam', 'Long take'] }
    },
    documentary: {
        name: 'Documentary', icon: '📹', description: 'Informatif, rythme naturel',
        rules: { baseDuration: 5, maxDuration: 10, minDuration: 3, dialogueMultiplier: 0.45, actionMultiplier: 0.9, emotionalMultiplier: 1.1, landscapeMultiplier: 1.3, transitionStyle: 'natural', cameraMovements: ['Static shot', 'Slow pan', 'Interview framing', 'B-roll coverage', 'Wide establishing'] }
    },
    balanced: {
        name: 'Balanced', icon: '⚖️', description: 'Équilibré, polyvalent',
        rules: { baseDuration: 5, maxDuration: 10, minDuration: 2, dialogueMultiplier: 0.4, actionMultiplier: 0.8, emotionalMultiplier: 1.2, landscapeMultiplier: 1.2, transitionStyle: 'mixed', cameraMovements: ['Medium shot', 'Slow zoom', 'Pan', 'Close-up', 'Wide shot'] }
    }
};

export const EMOTION_PRESETS = [
    { id: 'neutral', name: 'Standard', pitch: 1.0, speed: 1.0, icon: '😐' },
    { id: 'excited', name: 'Excited Announcer', pitch: 1.12, speed: 1.15, icon: '🤩' },
    { id: 'calm', name: 'Calm Narrator', pitch: 0.95, speed: 0.9, icon: '😌' },
    { id: 'serious', name: 'Serious Professional', pitch: 0.9, speed: 0.95, icon: '👔' },
    { id: 'storyteller', name: 'Storyteller', pitch: 0.92, speed: 0.85, icon: '📖' },
    { id: 'urgent', name: 'Breaking News', pitch: 1.05, speed: 1.25, icon: '🚨' },
    { id: 'whisper', name: 'Soft Whisper', pitch: 1.05, speed: 0.8, icon: '🤫' },
    { id: 'dynamic', name: 'Dynamic / Promo', pitch: 1.08, speed: 1.1, icon: '⚡' },
];