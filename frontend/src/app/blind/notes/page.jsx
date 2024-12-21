"use client"
import React, { useEffect, useRef, useState } from "react";
import { useSpeech } from "@/hooks/speech";

const NoteMakingPage = () => {
    const { speakText, cancelSpeech } = useSpeech();
    const [isListening, setIsListening] = useState(false);
    const [timer, setTimer] = useState(0);
    const recognitionRef = useRef(null);
    const timerInterval = useRef(null);
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const animationIdRef = useRef(null);
    const [audioReady, setAudioReady] = useState(false);

    useEffect(() => {
        if ("webkitSpeechRecognition" in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map((result) => result[0].transcript)
                    .join("");
            };

            recognitionRef.current = recognition;
        }

        return () => {
            stopVisualizing();
            cancelSpeech();
        };
    }, [cancelSpeech]);

    const startRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
            startTimer();
            startVisualizing();
        }
    };

    const pauseRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            pauseTimer();
            stopVisualizing();
        }
    };

    const toggleRecording = () => {
        if (isListening) {
            pauseRecording();
        } else {
            startRecording();
        }
    };

    const startTimer = () => {
        timerInterval.current = setInterval(() => {
            setTimer((prev) => prev + 0.1);
        }, 100);
    };

    const pauseTimer = () => {
        clearInterval(timerInterval.current);
    };

    const resetTimer = () => {
        clearInterval(timerInterval.current);
        setTimer(0);
    };

    const startVisualizing = () => {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext("2d");

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                analyser.getByteFrequencyData(dataArray);

                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                const barWidth = canvas.width / bufferLength;
                let x = 0;

                dataArray.forEach((value) => {
                    const barHeight = (value / 255) * canvas.height;

                    canvasCtx.fillStyle = `rgb(${value + 100}, 50, 50)`;
                    canvasCtx.fillRect(
                        x,
                        canvas.height - barHeight,
                        barWidth,
                        barHeight,
                    );

                    x += barWidth;
                });

                animationIdRef.current = requestAnimationFrame(draw);
            };

            draw();
        });
    };

    const stopVisualizing = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
    };

    const handleHover = (text) => {
        if (audioReady) {
            speakText(text);
        }
    };

    const enableAudio = () => {
        setAudioReady(true);
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-100 grid grid-cols-2 grid-rows-2 gap-0 p-0 group" onClick={enableAudio}>
            <div className="flex justify-center items-center p-0 border-gray-600 bg-gradient-to-r from-[#b71c1c] to-[#b71c1c] shadow-2xl cursor-pointer transition-opacity duration-300 group-hover:opacity-20 hover:!opacity-100"
                onMouseEnter={() => handleHover("Start recording")}
                onClick={toggleRecording}>
                <h1 className="text-7xl font-bold text-white">
                    {isListening ? "Pause Recording" : "Start Recording"}
                </h1>
            </div>

            <div className="flex justify-center items-center p-0 border-gray-600 bg-gradient-to-r from-[#311b92] to-[#311b92] shadow-2xl cursor-pointer transition-opacity duration-300 group-hover:opacity-20 hover:!opacity-100"
                onMouseEnter={() => handleHover("Stop recording and reset timer")}
                onClick={() => {
                    pauseRecording();
                    resetTimer();
                }}>
                <h1 className="text-7xl font-bold text-white">Stop Recording</h1>
            </div>

            <div className="flex justify-center items-center p-0 border-gray-600 bg-gradient-to-r from-[#000000] to-[#000000] shadow-2xl cursor-pointer transition-opacity duration-300 group-hover:opacity-20 hover:!opacity-100"
                onMouseEnter={() => handleHover("Frequency Graph with Timer")}>
                <div className="relative w-full h-full flex justify-center items-center">
                    <canvas ref={canvasRef} width="120%" height="120%" className="border-none"></canvas>
                    <div className="absolute bottom-10 left-0 w-full text-center py-2 text-white font-bold text-4xl">
                        {timer.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center p-0 border-gray-600 bg-gradient-to-r from-[#28a745] to-[#28a745] shadow-2xl cursor-pointer transition-opacity duration-300 group-hover:opacity-20 hover:!opacity-100"
                onMouseEnter={() => handleHover("Go back to the home page")}
                onClick={() => (window.location.href = "/blind")}>
                <h1 className="text-7xl font-bold text-white">Home</h1>
            </div>
        </div>
    );
};

export default NoteMakingPage;
