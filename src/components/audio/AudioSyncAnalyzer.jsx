/**
 * Analyseur audio pour la synchronisation automatique des scènes
 * Détecte les silences, les pauses et les cadences de parole
 */

/**
 * Analyse un fichier audio et retourne les informations de timing
 * @param {Blob} audioBlob - Le blob audio à analyser
 * @returns {Promise<Object>} - Informations de timing et silences
 */
export async function analyzeAudioTiming(audioBlob) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        
        // Paramètres d'analyse
        const windowSize = Math.floor(sampleRate * 0.05); // Fenêtre de 50ms
        const silenceThreshold = 0.02; // Seuil de silence (amplitude RMS)
        const minSilenceDuration = 0.3; // Durée minimale d'un silence (secondes)
        const minSpeechDuration = 0.2; // Durée minimale de parole entre silences
        
        const segments = [];
        const silences = [];
        let currentSegmentStart = 0;
        let inSilence = false;
        let silenceStart = 0;
        
        // Analyser par fenêtres
        for (let i = 0; i < channelData.length; i += windowSize) {
            const windowEnd = Math.min(i + windowSize, channelData.length);
            
            // Calculer RMS de la fenêtre
            let sum = 0;
            for (let j = i; j < windowEnd; j++) {
                sum += channelData[j] * channelData[j];
            }
            const rms = Math.sqrt(sum / (windowEnd - i));
            
            const currentTime = i / sampleRate;
            const isSilent = rms < silenceThreshold;
            
            if (isSilent && !inSilence) {
                // Début d'un silence
                inSilence = true;
                silenceStart = currentTime;
            } else if (!isSilent && inSilence) {
                // Fin d'un silence
                inSilence = false;
                const silenceDuration = currentTime - silenceStart;
                
                if (silenceDuration >= minSilenceDuration) {
                    silences.push({
                        start: silenceStart,
                        end: currentTime,
                        duration: silenceDuration
                    });
                    
                    // Créer un segment de parole si assez long
                    const speechDuration = silenceStart - currentSegmentStart;
                    if (speechDuration >= minSpeechDuration) {
                        segments.push({
                            start: currentSegmentStart,
                            end: silenceStart,
                            duration: speechDuration,
                            type: 'speech'
                        });
                    }
                    currentSegmentStart = currentTime;
                }
            }
        }
        
        // Ajouter le dernier segment
        if (duration - currentSegmentStart >= minSpeechDuration) {
            segments.push({
                start: currentSegmentStart,
                end: duration,
                duration: duration - currentSegmentStart,
                type: 'speech'
            });
        }
        
        // Calculer les statistiques
        const totalSpeechDuration = segments.reduce((acc, s) => acc + s.duration, 0);
        const averageSegmentDuration = segments.length > 0 ? totalSpeechDuration / segments.length : 0;
        
        audioContext.close();
        
        return {
            duration,
            segments,
            silences,
            stats: {
                totalSpeechDuration,
                totalSilenceDuration: duration - totalSpeechDuration,
                segmentCount: segments.length,
                silenceCount: silences.length,
                averageSegmentDuration,
                speechRatio: totalSpeechDuration / duration
            }
        };
    } catch (error) {
        audioContext.close();
        throw error;
    }
}

/**
 * Suggère des durées de scènes basées sur l'analyse audio
 * @param {Array} scenes - Les scènes existantes
 * @param {Array} voiceoverData - Les données de voix off avec audioBlob
 * @returns {Promise<Array>} - Scènes avec durées suggérées
 */
export async function suggestSceneDurations(scenes, voiceoverData) {
    const suggestions = [];
    
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const voiceover = voiceoverData[i];
        
        if (voiceover && voiceover.audioBlob) {
            try {
                const analysis = await analyzeAudioTiming(voiceover.audioBlob);
                
                // La durée suggérée est la durée audio + un petit buffer
                const buffer = 0.5; // 500ms de buffer à la fin
                const suggestedDuration = analysis.duration + buffer;
                
                // Ajuster si le texte est dense (peu de silences)
                let adjustedDuration = suggestedDuration;
                if (analysis.stats.speechRatio > 0.85) {
                    // Parole très dense, ajouter un peu plus de temps
                    adjustedDuration += 0.5;
                }
                
                suggestions.push({
                    sceneIndex: i,
                    originalDuration: scene.duration || 5,
                    suggestedDuration: Math.round(adjustedDuration * 10) / 10,
                    audioDuration: analysis.duration,
                    analysis: analysis.stats,
                    confidence: calculateConfidence(analysis)
                });
            } catch (error) {
                console.warn(`Could not analyze audio for scene ${i}:`, error);
                suggestions.push({
                    sceneIndex: i,
                    originalDuration: scene.duration || 5,
                    suggestedDuration: scene.duration || 5,
                    error: error.message
                });
            }
        } else {
            // Pas de voix off, garder la durée existante ou estimer basé sur le texte
            const dialogue = scene.dialogue || voiceover?.dialogue || '';
            const wordCount = dialogue.split(/\s+/).filter(w => w.length > 0).length;
            const wordsPerSecond = 2.5; // Vitesse de parole moyenne
            const estimatedDuration = Math.max(3, (wordCount / wordsPerSecond) + 1);
            
            suggestions.push({
                sceneIndex: i,
                originalDuration: scene.duration || 5,
                suggestedDuration: Math.round(estimatedDuration * 10) / 10,
                estimatedFromText: true,
                wordCount
            });
        }
    }
    
    return suggestions;
}

/**
 * Calcule un score de confiance pour la suggestion
 */
function calculateConfidence(analysis) {
    let confidence = 0.5;
    
    // Plus de segments = plus de confiance dans la détection
    if (analysis.stats.segmentCount >= 2) confidence += 0.1;
    if (analysis.stats.segmentCount >= 5) confidence += 0.1;
    
    // Ratio parole/silence raisonnable
    if (analysis.stats.speechRatio > 0.5 && analysis.stats.speechRatio < 0.95) {
        confidence += 0.2;
    }
    
    // Durée minimale
    if (analysis.duration >= 2) confidence += 0.1;
    
    return Math.min(1, confidence);
}

/**
 * Détecte les points de coupure naturels dans un audio
 * Utile pour le découpage automatique ou les transitions
 */
export async function detectNaturalBreakpoints(audioBlob, options = {}) {
    const {
        minBreakDuration = 0.5, // Durée minimale d'un break
        maxBreaks = 10 // Nombre maximum de breaks à retourner
    } = options;
    
    const analysis = await analyzeAudioTiming(audioBlob);
    
    // Filtrer les silences significatifs comme points de coupure
    const breakpoints = analysis.silences
        .filter(s => s.duration >= minBreakDuration)
        .map(s => ({
            time: s.start + (s.duration / 2), // Point central du silence
            duration: s.duration,
            strength: Math.min(1, s.duration / 1.5) // Force du break (0-1)
        }))
        .sort((a, b) => b.strength - a.strength) // Trier par force
        .slice(0, maxBreaks);
    
    return {
        breakpoints,
        totalDuration: analysis.duration,
        recommendedSplitCount: Math.ceil(analysis.duration / 30) // Suggérer un split toutes les ~30s
    };
}

/**
 * Synchronise automatiquement les durées des scènes avec les voix off
 * @param {Array} scenes - Les scènes à synchroniser
 * @param {Array} voiceoverData - Les données de voix off
 * @param {Object} options - Options de synchronisation
 * @returns {Promise<Array>} - Scènes avec durées synchronisées
 */
export async function autoSyncSceneDurations(scenes, voiceoverData, options = {}) {
    const {
        minDuration = 2,
        maxDuration = 30,
        buffer = 0.5,
        applyAutomatically = true
    } = options;
    
    const suggestions = await suggestSceneDurations(scenes, voiceoverData);
    
    if (!applyAutomatically) {
        return suggestions;
    }
    
    // Appliquer les suggestions
    return scenes.map((scene, index) => {
        const suggestion = suggestions.find(s => s.sceneIndex === index);
        if (suggestion && !suggestion.error) {
            const newDuration = Math.max(minDuration, Math.min(maxDuration, suggestion.suggestedDuration));
            return {
                ...scene,
                duration: newDuration,
                _syncInfo: {
                    originalDuration: suggestion.originalDuration,
                    audioDuration: suggestion.audioDuration,
                    confidence: suggestion.confidence,
                    autoSynced: true
                }
            };
        }
        return scene;
    });
}

export default {
    analyzeAudioTiming,
    suggestSceneDurations,
    detectNaturalBreakpoints,
    autoSyncSceneDurations
};