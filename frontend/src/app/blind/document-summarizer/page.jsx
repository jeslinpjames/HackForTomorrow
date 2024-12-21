"use client";
import React, { useEffect, useState } from "react";
import { useSpeech } from "@/hooks/speech";
import { useDocument } from "@/hooks/useDocument";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const { speakText } = useSpeech();
    const {
        file,
        status,
        response,
        setStatus,
        setResponse,
        uploadDocument,
        queryDocument,
        summarizeDocument
    } = useDocument();

    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            setStatus("Speech recognition is not supported in this browser");
            speakText("Speech recognition is not supported in this browser");
            return;
        }

        speakText("Welcome to document summarizer. You can upload a document and ask questions about it.");
    }, [speakText]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const result = await uploadDocument(file);
        setStatus(result.message);
        speakText(result.message);

        if (result.success) {
            speakText("You can now ask questions about the document.");
        }
    };

    const startVoiceQuery = () => {
        if (!file) {
            speakText("Please upload a document first");
            setStatus("Please upload a document first");
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.start();
        setIsListening(true);
        setStatus("Listening for your question...");
        speakText("Listening for your question");

        recognition.onresult = async (event) => {
            const query = event.results[0][0].transcript;
            setStatus(`Processing query: ${query}`);
            
            const result = await queryDocument(query);
            if (result.success) {
                setResponse(result.response);
                speakText(result.response);
            } else {
                setStatus(result.message);
                speakText(result.message);
            }
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            setStatus(`Error: ${event.error}`);
            setIsListening(false);
            speakText("Sorry, I couldn't hear you. Please try again.");
        };
    };

    const handleSummarize = async () => {
        if (!file) {
            speakText("Please upload a document first");
            setStatus("Please upload a document first");
            return;
        }

        setStatus("Generating summary...");
        speakText("Generating document summary");

        const result = await summarizeDocument();
        if (result.success) {
            setResponse(result.summary);
            speakText(result.summary);
        } else {
            setStatus(result.message);
            speakText(result.message);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-gray-100">
            <div className="max-w-4xl mx-auto space-y-8">
                {status && (
                    <div className="p-4 bg-blue-900 border-l-4 border-blue-500 text-blue-100 text-xl">
                        {status}
                    </div>
                )}

                <div className="space-y-8">
                    <div>
                        <input
                            type="file"
                            id="fileUpload"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <label
                            htmlFor="fileUpload"
                            className="flex flex-col items-center justify-center w-full h-40 bg-blue-800 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200"
                            onMouseEnter={() => speakText("Click to upload a document")}
                        >
                            <span className="text-2xl font-bold">Upload Document</span>
                            {file && (
                                <span className="text-lg mt-2">
                                    Current file: {file.name}
                                </span>
                            )}
                        </label>
                    </div>

                    <button
                        onClick={startVoiceQuery}
                        disabled={isListening}
                        className={`w-full h-40 ${
                            isListening ? 'bg-red-800' : 'bg-green-800 hover:bg-green-700'
                        } text-white rounded-lg transition-colors duration-200`}
                        onMouseEnter={() => speakText("Click to ask a question")}
                    >
                        <span className="text-2xl font-bold">
                            {isListening ? "Listening..." : "Ask a Question"}
                        </span>
                    </button>

                    <button
                        onClick={handleSummarize}
                        className="w-full h-40 bg-purple-800 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                        onMouseEnter={() => speakText("Click to summarize document")}
                    >
                        <span className="text-2xl font-bold">Summarize Document</span>
                    </button>

                    <button
                        onClick={() => router.push("/blind")}
                        className="w-full h-40 bg-cyan-800 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-200"
                        onMouseEnter={() => speakText("Click to go back")}
                    >
                        <span className="text-2xl font-bold">Go Back</span>
                    </button>
                </div>

                {response && (
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Response:</h2>
                        <p className="text-xl leading-relaxed">{response}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
