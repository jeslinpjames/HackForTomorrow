import { useState, useCallback } from 'react';

export const useVoiceAssistance = () => {
    const [speaking, setSpeaking] = useState(false);

    const speak = useCallback((text) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            setSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice settings
            utterance.rate = 1.0;  // Normal speed
            utterance.pitch = 1.0; // Normal pitch
            utterance.volume = 1.0; // Full volume
            
            // Try to use a natural-sounding voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.lang === 'en-US' && voice.localService
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onend = () => setSpeaking(false);
            utterance.onerror = () => setSpeaking(false);
            
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    return { speak, speaking };
};