"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSpeech } from "@/hooks/speech";
import { Mic, StopCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TopicLearn() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic");
    const { speakText, cancelSpeech } = useSpeech();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [conversationHistory, setConversationHistory] = useState([]);

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const isProcessingRef = useRef(false);

    const initializeSpeechRecognition = useCallback(() => {
        if (window.webkitSpeechRecognition) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                const results = event.results;
                let finalTranscript = "";

                for (let i = event.resultIndex; i < results.length; ++i) {
                    if (results[i].isFinal) {
                        finalTranscript += results[i][0].transcript;
                    }
                }

                if (finalTranscript.trim()) {
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }

                    silenceTimerRef.current = setTimeout(() => {
                        if (!isProcessingRef.current) {
                            handleQuerySubmission(finalTranscript);
                        }
                    }, 2000);

                    setTranscript(finalTranscript);
                }
            };

            recognition.onerror = (error) => {
                console.error("Speech recognition error:", error);
                setIsListening(false);
            };

            recognition.onend = () => {
                if (isListening) {
                    recognition.start();
                }
            };

            return recognition;
        }
        return null;
    }, []);

    const handleQuerySubmission = async (query) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        setTranscript("");
        setConversationHistory(prev => [...prev, { type: "user", text: query }]);

        try {
            const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/topic-learn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_history: conversationHistory,
                    query,
                    topic
                }),
            });

            const data = await response.json();
            setConversationHistory(prev => [...prev, { type: "ai", text: data.response }]);
            await speakText(data.response);

            setIsListening(true);
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
        } catch (error) {
            console.error("Error processing query:", error);
            await speakText("Sorry, there was an error. Please try again.");
        } finally {
            isProcessingRef.current = false;
        }
    };

    const handleStartListening = () => {
        if (!isListening) {
            setIsListening(true);
            setTranscript("");
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }
        } else {
            setIsListening(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }
    };

    const handleStopAudio = () => {
        cancelSpeech();
        setIsPlaying(false);
        setIsListening(true);
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    const handleQuitConversation = async () => {
        cancelSpeech();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        await speakText("Goodbye! Thank you for learning.");
        router.push("/blind");
    };

    useEffect(() => {
        const recognition = initializeSpeechRecognition();
        recognitionRef.current = recognition;

        const initialMessage = `Let's learn about ${topic}. What would you like to know?`;
        setConversationHistory([{ type: "system", text: initialMessage }]);
        speakText(initialMessage).then(() => {
            setIsListening(true);
            if (recognition) {
                recognition.start();
            }
        });

        return () => {
            if (recognition) {
                recognition.stop();
            }
            cancelSpeech();
        };
    }, [initializeSpeechRecognition, topic, speakText, cancelSpeech]);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex flex-grow overflow-hidden">
                <div className="w-1/2 p-8 overflow-y-auto bg-white border-r border-gray-200">
                    <h2 className="text-3xl font-semibold text-gray-700 mb-8">
                        Learning about {topic}
                    </h2>
                    <div className="space-y-6">
                        {conversationHistory.map((entry, index) => (
                            <Card
                                key={index}
                                className={`p-6 ${
                                    entry.type === "user"
                                        ? "bg-blue-50 text-right"
                                        : entry.type === "ai"
                                        ? "bg-green-50"
                                        : "bg-gray-100 italic"
                                }`}
                            >
                                <p className="text-2xl font-medium text-gray-800">{entry.text}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="w-1/2 p-8 flex flex-col space-y-6">
                    {transcript && (
                        <Card className="p-6 bg-yellow-50">
                            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Transcript</h3>
                            <p className="text-2xl text-gray-800">{transcript}</p>
                        </Card>
                    )}

                    <div className="flex flex-col flex-grow space-y-6">
                        {isPlaying && (
                            <Button
                                onClick={handleStopAudio}
                                size="lg"
                                variant="destructive"
                                className="text-4xl py-10"
                            >
                                <StopCircle className="mr-6 w-16 h-16" /> Stop Audio
                            </Button>
                        )}

                        <Button
                            onClick={handleStartListening}
                            size="lg"
                            variant={isListening ? "default" : "outline"}
                            className="text-4xl py-10"
                        >
                            <Mic className="mr-6 w-16 h-16" />
                            {isListening ? "Mic Listening" : "Start Mic"}
                        </Button>

                        <Button
                            onClick={handleQuitConversation}
                            size="lg"
                            variant="secondary"
                            className="text-4xl py-10"
                        >
                            <X className="mr-6 w-16 h-16" /> Quit Learning
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
