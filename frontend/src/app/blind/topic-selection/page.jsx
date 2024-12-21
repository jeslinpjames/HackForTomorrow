"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TopicSelection() {
    const router = useRouter();
    const [transcription, setTranscription] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        speak("Please speak the topic you want to learn about.");
        initializeSpeechRecognition();
    }, []);

    const initializeSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsRecording(true);
                console.log('Voice recognition started...');
            };

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0].transcript)
                    .join('');
                setTranscription(transcript);
                console.log('Transcript:', transcript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            recognition.onend = () => {
                setIsRecording(false);
                console.log('Voice recognition stopped.');
            };

            recognition.start();
        }
    };

    const handleSubmit = async () => {
        if (transcription) {
            try {
                speak(`Your selected topic is: ${transcription}`);
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/get_response`, { 
                    topic: transcription 
                });
                
                router.push(`/blind/topic-learn?topic=${encodeURIComponent(transcription)}`);
            } catch (error) {
                console.error('Error submitting topic:', error);
                speak("Sorry, there was an error processing your request. Please try again.");
            }
        }
    };

    return (
        <div className="container mx-auto h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl">
                <CardContent className="flex flex-col items-center space-y-8 p-8">
                    <h1 className="text-4xl font-bold text-center mb-8">
                        Topic Selection
                    </h1>

                    <div className="text-center">
                        <p className="text-xl mb-4">
                            {isRecording ? "Listening..." : "Waiting to start..."}
                        </p>
                        <p className="text-2xl font-semibold">
                            {transcription || "Speak your topic..."}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!transcription}
                        className="text-xl px-8 py-6"
                    >
                        Continue with this topic
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
