// Voice configuration data extracted from Home.js

export const VOICES_BASE = [
    // English
    { id: 'en-US-F', locale: 'en-US', name: 'Sarah (US - Standard)', gender: 'Female', type: 'Free', lang: 'en', pitch: 1.0, speedAdj: 1.0 },
    { id: 'en-US-M', locale: 'en-US', name: 'Michael (US - Standard)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.88, speedAdj: 0.98 },
    { id: 'en-US-News', locale: 'en-US', name: 'Olivia (US - News)', gender: 'Female', type: 'Free', lang: 'en', pitch: 0.95, speedAdj: 1.02 },
    { id: 'en-US-Story', locale: 'en-US', name: 'Daniel (US - Deep Narrative)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.74, speedAdj: 0.9 },
    { id: 'en-US-M2', locale: 'en-US', name: 'James (US - Corporate)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.8, speedAdj: 0.94 },
    { id: 'en-GB-F', locale: 'en-GB', name: 'Emma (UK - Standard)', gender: 'Female', type: 'Free', lang: 'en', pitch: 1.0, speedAdj: 1.0 },
    { id: 'en-GB-M', locale: 'en-GB', name: 'Arthur (UK - Standard)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.84, speedAdj: 0.97 },
    { id: 'en-GB-M2', locale: 'en-GB', name: 'Henry (UK - Premium)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.76, speedAdj: 0.92 },
    { id: 'en-AU-F', locale: 'en-AU', name: 'Olivia (Australia)', gender: 'Female', type: 'Free', lang: 'en', pitch: 1.0, speedAdj: 1.0 },
    { id: 'en-AU-M', locale: 'en-AU', name: 'Noah (Australia - Warm)', gender: 'Male', type: 'Free', lang: 'en', pitch: 0.82, speedAdj: 0.96 },

    // French
    { id: 'fr-FR-F', locale: 'fr-FR', name: 'Chloé (France)', gender: 'Female', type: 'Free', lang: 'fr', pitch: 1.0, speedAdj: 1.0 },
    { id: 'fr-FR-M', locale: 'fr-FR', name: 'Gabriel (France - Clair)', gender: 'Male', type: 'Free', lang: 'fr', pitch: 0.78, speedAdj: 0.94 },
    { id: 'fr-FR-M2', locale: 'fr-FR', name: 'Alexandre (France - Cinéma)', gender: 'Male', type: 'Free', lang: 'fr', pitch: 0.72, speedAdj: 0.9 },
    { id: 'fr-FR-Poet', locale: 'fr-FR', name: 'Victor (France - Grave)', gender: 'Male', type: 'Free', lang: 'fr', pitch: 0.68, speedAdj: 0.86 },
    { id: 'fr-CA-F', locale: 'fr-CA', name: 'Léa (Canada)', gender: 'Female', type: 'Free', lang: 'fr', pitch: 1.0, speedAdj: 1.0 },
    { id: 'fr-CA-M', locale: 'fr-CA', name: 'Étienne (Canada - Naturel)', gender: 'Male', type: 'Free', lang: 'fr', pitch: 0.8, speedAdj: 0.96 },

    // Arabic
    { id: 'ar-XA-F', locale: 'ar-XA', name: 'Fatima (Standard)', gender: 'Female', type: 'Free', lang: 'ar', pitch: 1.0, speedAdj: 1.0 },
    { id: 'ar-XA-M', locale: 'ar-XA', name: 'Omar (Standard)', gender: 'Male', type: 'Free', lang: 'ar', pitch: 0.84, speedAdj: 0.96 },
    { id: 'ar-XA-Poet', locale: 'ar-XA', name: 'Hakawati (Storyteller)', gender: 'Male', type: 'Free', lang: 'ar', pitch: 0.76, speedAdj: 0.9 },
    { id: 'ar-XA-M2', locale: 'ar-XA', name: 'Karim (Broadcast)', gender: 'Male', type: 'Free', lang: 'ar', pitch: 0.8, speedAdj: 0.93 },

    // Spanish
    { id: 'es-ES-F', locale: 'es-ES', name: 'Sofia (Spain)', gender: 'Female', type: 'Free', lang: 'es', pitch: 1.0, speedAdj: 1.0 },
    { id: 'es-ES-M', locale: 'es-ES', name: 'Mateo (Spain)', gender: 'Male', type: 'Free', lang: 'es', pitch: 0.86, speedAdj: 0.97 },
    { id: 'es-ES-M2', locale: 'es-ES', name: 'Javier (Spain - Professional)', gender: 'Male', type: 'Free', lang: 'es', pitch: 0.78, speedAdj: 0.92 },
    { id: 'es-MX-M', locale: 'es-MX', name: 'Diego (Mexico - Warm)', gender: 'Male', type: 'Free', lang: 'es', pitch: 0.82, speedAdj: 0.96 },

    // German
    { id: 'de-DE-F', locale: 'de-DE', name: 'Hanna (German)', gender: 'Female', type: 'Free', lang: 'de', pitch: 1.0, speedAdj: 1.0 },
    { id: 'de-DE-M', locale: 'de-DE', name: 'Lukas (German)', gender: 'Male', type: 'Free', lang: 'de', pitch: 0.86, speedAdj: 0.97 },
    { id: 'de-DE-M2', locale: 'de-DE', name: 'Jonas (German - Documentary)', gender: 'Male', type: 'Free', lang: 'de', pitch: 0.78, speedAdj: 0.91 },

    // Italian
    { id: 'it-IT-F', locale: 'it-IT', name: 'Isabella (Italian)', gender: 'Female', type: 'Free', lang: 'it', pitch: 1.0, speedAdj: 1.0 },
    { id: 'it-IT-M', locale: 'it-IT', name: 'Marco (Italian - Standard)', gender: 'Male', type: 'Free', lang: 'it', pitch: 0.84, speedAdj: 0.96 },
    { id: 'it-IT-M2', locale: 'it-IT', name: 'Lorenzo (Italian - Cinema)', gender: 'Male', type: 'Free', lang: 'it', pitch: 0.76, speedAdj: 0.9 },

    // Japanese
    { id: 'ja-JP-F', locale: 'ja-JP', name: 'Sakura (Japanese)', gender: 'Female', type: 'Free', lang: 'ja', pitch: 1.0, speedAdj: 1.0 },
    { id: 'ja-JP-M', locale: 'ja-JP', name: 'Haruto (Japanese - Standard)', gender: 'Male', type: 'Free', lang: 'ja', pitch: 0.84, speedAdj: 0.96 },
    { id: 'ja-JP-M2', locale: 'ja-JP', name: 'Ren (Japanese - Deep)', gender: 'Male', type: 'Free', lang: 'ja', pitch: 0.76, speedAdj: 0.9 },
];