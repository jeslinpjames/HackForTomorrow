"use client";
import { useCallback } from 'react';

export const useSpeech = () => {
    const getFemaleVoice = useCallback(() => {
        const voices = window.speechSynthesis.getVoices();
        return voices.find((voice) =>
            voice.name.includes("Google UK English Female") ||
            voice.name.includes("Microsoft Zira") ||
            voice.name.includes("female") ||
            voice.name.includes("Female")
        ) || voices[0];
    }, []);

    const speakText = useCallback((text) => {
        return new Promise((resolve, reject) => {
            try {
                const synthesis = window.speechSynthesis;
                synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);

                utterance.onend = () => {
                    resolve();
                };

                utterance.onerror = (error) => {
                    reject(error);
                };

                if (synthesis.getVoices().length === 0) {
                    synthesis.addEventListener("voiceschanged", () => {
                        utterance.voice = getFemaleVoice();
                        utterance.rate = 0.8;
                        utterance.pitch = 1.5;
                        utterance.volume = 1.0;
                        synthesis.speak(utterance);
                    }, { once: true });
                } else {
                    utterance.voice = getFemaleVoice();
                    utterance.rate = 0.8;
                    utterance.pitch = 1.5;
                    utterance.volume = 1.0;
                    synthesis.speak(utterance);
                }
            } catch (error) {
                console.error("Speech error:", error);
                reject(error);
            }
        });
    }, [getFemaleVoice]);

    const cancelSpeech = useCallback(() => {
        window.speechSynthesis.cancel();        
    }, []);

    return {
        speakText,
        cancelSpeech,
        getFemaleVoice
    };
};