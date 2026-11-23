import { useState, useCallback, useRef } from 'react';

/**
 * Hook personnalisé pour gérer l'historique Annuler/Rétablir
 * @param {any} initialState - État initial
 * @param {number} maxHistory - Nombre maximum d'états à conserver (défaut: 50)
 */
export function useUndoRedo(initialState, maxHistory = 50) {
    const [state, setState] = useState(initialState);
    const historyRef = useRef({
        past: [],
        future: []
    });

    // Mettre à jour l'état avec sauvegarde dans l'historique
    const set = useCallback((newState, saveToHistory = true) => {
        if (saveToHistory) {
            // Sauvegarder l'état actuel dans le passé
            historyRef.current.past.push(state);
            
            // Limiter la taille de l'historique
            if (historyRef.current.past.length > maxHistory) {
                historyRef.current.past.shift();
            }
            
            // Effacer le futur car une nouvelle action crée une nouvelle branche
            historyRef.current.future = [];
        }
        
        setState(typeof newState === 'function' ? newState(state) : newState);
    }, [state, maxHistory]);

    // Annuler (revenir en arrière)
    const undo = useCallback(() => {
        if (historyRef.current.past.length === 0) return false;
        
        const previous = historyRef.current.past.pop();
        historyRef.current.future.unshift(state);
        
        // Limiter le futur aussi
        if (historyRef.current.future.length > maxHistory) {
            historyRef.current.future.pop();
        }
        
        setState(previous);
        return true;
    }, [state, maxHistory]);

    // Rétablir (aller en avant)
    const redo = useCallback(() => {
        if (historyRef.current.future.length === 0) return false;
        
        const next = historyRef.current.future.shift();
        historyRef.current.past.push(state);
        
        setState(next);
        return true;
    }, [state]);

    // Vérifier si on peut annuler/rétablir
    const canUndo = historyRef.current.past.length > 0;
    const canRedo = historyRef.current.future.length > 0;

    // Réinitialiser l'historique
    const clearHistory = useCallback(() => {
        historyRef.current.past = [];
        historyRef.current.future = [];
    }, []);

    // Obtenir les infos sur l'historique
    const getHistoryInfo = useCallback(() => ({
        undoCount: historyRef.current.past.length,
        redoCount: historyRef.current.future.length,
        canUndo,
        canRedo
    }), [canUndo, canRedo]);

    return {
        state,
        set,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
        getHistoryInfo
    };
}

/**
 * Hook pour gérer plusieurs états avec un seul historique
 */
export function useMultiUndoRedo(initialStates, maxHistory = 50) {
    const [states, setStates] = useState(initialStates);
    const historyRef = useRef({
        past: [],
        future: []
    });

    const set = useCallback((key, newValue, saveToHistory = true) => {
        if (saveToHistory) {
            historyRef.current.past.push({ ...states });
            if (historyRef.current.past.length > maxHistory) {
                historyRef.current.past.shift();
            }
            historyRef.current.future = [];
        }
        
        setStates(prev => ({
            ...prev,
            [key]: typeof newValue === 'function' ? newValue(prev[key]) : newValue
        }));
    }, [states, maxHistory]);

    const setMultiple = useCallback((updates, saveToHistory = true) => {
        if (saveToHistory) {
            historyRef.current.past.push({ ...states });
            if (historyRef.current.past.length > maxHistory) {
                historyRef.current.past.shift();
            }
            historyRef.current.future = [];
        }
        
        setStates(prev => ({ ...prev, ...updates }));
    }, [states, maxHistory]);

    const undo = useCallback(() => {
        if (historyRef.current.past.length === 0) return false;
        
        const previous = historyRef.current.past.pop();
        historyRef.current.future.unshift({ ...states });
        
        if (historyRef.current.future.length > maxHistory) {
            historyRef.current.future.pop();
        }
        
        setStates(previous);
        return true;
    }, [states, maxHistory]);

    const redo = useCallback(() => {
        if (historyRef.current.future.length === 0) return false;
        
        const next = historyRef.current.future.shift();
        historyRef.current.past.push({ ...states });
        
        setStates(next);
        return true;
    }, [states]);

    const canUndo = historyRef.current.past.length > 0;
    const canRedo = historyRef.current.future.length > 0;

    const clearHistory = useCallback(() => {
        historyRef.current.past = [];
        historyRef.current.future = [];
    }, []);

    return {
        states,
        set,
        setMultiple,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory,
        undoCount: historyRef.current.past.length,
        redoCount: historyRef.current.future.length
    };
}

export default useUndoRedo;