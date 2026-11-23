/**
 * DialogueCleaner - Utilitaire pour nettoyer les dialogues générés par l'IA
 * Supprime les préfixes comme "Narrateur:", "Personne 1:", "Durée: X", etc.
 * et détecte les rôles pour l'assignation de voix.
 */

// Patterns de préfixes à supprimer (multi-langues)
const PREFIX_PATTERNS = [
    // Français
    /^[""]?\s*Narrateur\s*:\s*/i,
    /^[""]?\s*Narratrice\s*:\s*/i,
    /^[""]?\s*Personne\s*\d+\s*:\s*/i,
    /^[""]?\s*Personnage\s*\d+\s*:\s*/i,
    /^[""]?\s*Voix\s*off\s*:\s*/i,
    /^[""]?\s*Voix\s*\d+\s*:\s*/i,
    /^[""]?\s*Intervenant\s*\d*\s*:\s*/i,
    /^[""]?\s*Présentateur\s*:\s*/i,
    /^[""]?\s*Présentatrice\s*:\s*/i,
    // Anglais
    /^[""]?\s*Narrator\s*:\s*/i,
    /^[""]?\s*Person\s*\d+\s*:\s*/i,
    /^[""]?\s*Character\s*\d+\s*:\s*/i,
    /^[""]?\s*Voice\s*over\s*:\s*/i,
    /^[""]?\s*Voice\s*\d+\s*:\s*/i,
    /^[""]?\s*Speaker\s*\d*\s*:\s*/i,
    /^[""]?\s*Host\s*:\s*/i,
    /^[""]?\s*Presenter\s*:\s*/i,
    // Espagnol
    /^[""]?\s*Narrador\s*:\s*/i,
    /^[""]?\s*Persona\s*\d+\s*:\s*/i,
    /^[""]?\s*Personaje\s*\d+\s*:\s*/i,
    // Arabe
    /^[""]?\s*الراوي\s*:\s*/i,
    /^[""]?\s*شخص\s*\d+\s*:\s*/i,
    // Allemand
    /^[""]?\s*Erzähler\s*:\s*/i,
    /^[""]?\s*Person\s*\d+\s*:\s*/i,
    // Metadata patterns
    /\s*Durée\s*:\s*\d+\s*"?\s*$/i,
    /\s*Duration\s*:\s*\d+\s*"?\s*$/i,
];

// Pattern pour détecter les rôles (sans les supprimer)
const ROLE_PATTERNS = [
    { pattern: /^[""]?\s*(Narrateur|Narratrice|Narrator|Voix\s*off|Voice\s*over|Erzähler|Narrador|الراوي)\s*:/i, role: 'narrator' },
    { pattern: /^[""]?\s*(Personne|Person|Personnage|Character|Speaker|Intervenant|Persona|Personaje|شخص)\s*(\d+)\s*:/i, role: 'character', getIndex: (match) => parseInt(match[2]) },
    { pattern: /^[""]?\s*(Présentateur|Présentatrice|Host|Presenter)\s*:/i, role: 'host' },
];

/**
 * Détecte le rôle du locuteur dans une ligne de dialogue
 * @param {string} text - Texte brut du dialogue
 * @returns {{ role: string, characterIndex?: number }} 
 */
export function detectSpeakerRole(text) {
    if (!text) return { role: 'narrator' };
    
    for (const { pattern, role, getIndex } of ROLE_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            const result = { role };
            if (getIndex && match) {
                result.characterIndex = getIndex(match);
            }
            return result;
        }
    }
    
    return { role: 'narrator' };
}

/**
 * Nettoie un texte de dialogue en supprimant les préfixes et métadonnées
 * @param {string} text - Texte brut du dialogue
 * @returns {string} Texte nettoyé prêt pour la synthèse vocale
 */
export function cleanDialogue(text) {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Supprimer les guillemets englobants
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    
    // Appliquer tous les patterns de nettoyage
    for (const pattern of PREFIX_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    
    // Nettoyer les guillemets résiduels au début/fin
    cleaned = cleaned.replace(/^["'""\s]+/, '').replace(/["'""\s]+$/, '');
    
    // Supprimer les doubles espaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return cleaned;
}

/**
 * Nettoie tous les dialogues d'un tableau de scènes
 * @param {Array} scenes - Tableau de scènes avec propriété dialogue
 * @returns {Array} Scènes avec dialogues nettoyés et rôles détectés
 */
export function cleanAllDialogues(scenes) {
    if (!scenes || !Array.isArray(scenes)) return scenes;
    
    return scenes.map(scene => {
        if (!scene.dialogue) return scene;
        
        const speakerInfo = detectSpeakerRole(scene.dialogue);
        const cleanedDialogue = cleanDialogue(scene.dialogue);
        
        return {
            ...scene,
            dialogue: cleanedDialogue,
            _speakerRole: speakerInfo.role,
            _characterIndex: speakerInfo.characterIndex
        };
    });
}

/**
 * Détermine la voix et l'émotion à utiliser pour une scène basée sur son rôle et son mood
 * @param {object} scene - Scène avec _speakerRole et mood
 * @param {object} voiceConfig - Configuration des voix disponibles
 * @returns {{ voiceId: string, emotion: string, pitch: number, speed: number }}
 */
export function getVoiceForScene(scene, voiceConfig = {}) {
    const role = scene._speakerRole || 'narrator';
    const mood = (scene.mood || '').toLowerCase();
    
    // Déterminer l'émotion basée sur le mood de la scène
    let emotion = 'neutral';
    if (mood.includes('dramatic') || mood.includes('intense') || mood.includes('epic')) {
        emotion = 'angry'; // Assertif/passionné
    } else if (mood.includes('sad') || mood.includes('melanchol') || mood.includes('emotional')) {
        emotion = 'sad';
    } else if (mood.includes('happy') || mood.includes('joyful') || mood.includes('exciting') || mood.includes('upbeat')) {
        emotion = 'happy';
    } else if (mood.includes('calm') || mood.includes('peaceful') || mood.includes('serene') || mood.includes('reverent')) {
        emotion = 'calm';
    } else if (mood.includes('mystery') || mood.includes('suspense') || mood.includes('tension')) {
        emotion = 'neutral'; // Voix posée pour le mystère
    }
    
    // Ajustements de pitch/speed par rôle
    let pitchAdjust = 1.0;
    let speedAdjust = 1.0;
    
    switch (role) {
        case 'narrator':
            pitchAdjust = 0.95; // Légèrement plus grave = plus autoritaire
            speedAdjust = 0.95; // Un peu plus lent = plus posé
            break;
        case 'host':
            pitchAdjust = 1.0;
            speedAdjust = 1.05; // Un peu plus dynamique
            break;
        case 'character':
            // Varier la voix par personnage
            const idx = scene._characterIndex || 1;
            pitchAdjust = idx % 2 === 0 ? 1.1 : 0.9; // Alterner aigu/grave
            speedAdjust = 1.0;
            break;
    }
    
    // Ajustements émotionnels
    switch (emotion) {
        case 'happy':
            pitchAdjust *= 1.05;
            speedAdjust *= 1.05;
            break;
        case 'sad':
            pitchAdjust *= 0.95;
            speedAdjust *= 0.9;
            break;
        case 'angry':
            pitchAdjust *= 1.0;
            speedAdjust *= 1.1;
            break;
        case 'calm':
            speedAdjust *= 0.9;
            break;
    }

    return {
        emotion,
        pitchAdjust,
        speedAdjust,
        role
    };
}