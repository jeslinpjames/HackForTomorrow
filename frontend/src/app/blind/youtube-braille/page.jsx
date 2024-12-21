"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, BookOpen, FileDown, Youtube } from "lucide-react"; // Changed Braille to BookOpen
import { useSpeech } from "@/hooks/speech";

const BrailleTranslatePage = () => {
    const [videoURL, setVideoURL] = useState("");
    const [error, setError] = useState("");
    const [fileURL, setFileURL] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { speakText } = useSpeech();

    useEffect(() => {
        speakText(
            "Welcome to YouTube Braille Translator. Press Tab to navigate and Enter to activate buttons.",
        );
    }, [speakText]);

    const downloadBrailleFile = () => {
        if (fileURL) {
            speakText("Downloading Braille file");
            const link = document.createElement("a");
            link.href = fileURL;
            link.download = "translation.brf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleTranslate = async () => {
        setError("");
        setFileURL("");
        setIsLoading(true);
        speakText("Starting translation process");

        if (!videoURL) {
            const errorMessage = "Please provide a valid YouTube URL.";
            setError(errorMessage);
            speakText(errorMessage);
            setIsLoading(false);
            return;
        }

        try {
            speakText(
                "Translating video to Braille. This may take a few moments.",
            );
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const ur = `http://localhost:5000/api/youtube-braille/?url=${
                encodeURIComponent(videoURL)
            }`;
            const response = await fetch(ur, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "Accept": "application/json",
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error("Translation failed");
            }

            const data = await response.json();

            if (!data.success || !data.translation) {
                throw new Error("Invalid response format");
            }

            let translationText = typeof data.translation === "object"
                ? JSON.stringify(data.translation, null, 2)
                : String(data.translation);

            translationText = translationText.replace(/\[object Object\]/g, "");

            const blobContent = translationText.replace(/\n/g, "\r\n");
            const blob = new Blob([blobContent], {
                type: "text/plain",
                endings: "native",
            });

            const url = URL.createObjectURL(blob);
            setFileURL(url);
            speakText(
                "Translation complete. You can now download the Braille file.",
            );
        } catch (err) {
            console.log(err);
            const errorMessage = err.message ||
                "Translation failed. Please try again.";
            setError(errorMessage);
            speakText(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-900 p-8">
            <Card className="max-w-4xl mx-auto p-8 bg-gray-800 border-0 shadow-2xl">
                <h1 className="text-5xl font-bold text-center text-white mb-12 flex items-center justify-center gap-4">
                    <Youtube className="w-16 h-16 text-red-500" />{" "}
                    {/* Changed YoutubeIcon to Youtube */}
                    <BookOpen className="w-16 h-16 text-blue-400" />{" "}
                    {/* Changed Braille to BookOpen */}
                    YouTube to Braille
                </h1>

                <div className="space-y-8">
                    <Input
                        placeholder="Paste YouTube video URL here..."
                        value={videoURL}
                        onChange={(e) => setVideoURL(e.target.value)}
                        className="w-full text-2xl p-6 bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500"
                        onFocus={() => speakText("Enter YouTube URL")}
                    />

                    <Button
                        onClick={handleTranslate}
                        className="w-full text-3xl p-8 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                        disabled={isLoading}
                        onFocus={() => speakText("Translate to Braille button")}
                        onMouseEnter={() => speakText("Translate to Braille button")}
                    >
                        {isLoading
                            ? "Converting to Braille..."
                            : "Translate to Braille"}
                    </Button>
                </div>

                {error && (
                    <div className="mt-8 p-6 bg-red-900/50 text-red-200 rounded-xl flex items-center gap-4 text-2xl">
                        <AlertTriangle className="w-12 h-12" />
                        <span>{error}</span>
                    </div>
                )}

                {fileURL && (
                    <div className="mt-8 p-6 bg-gray-700/50 rounded-xl text-center">
                        <h2 className="text-3xl font-semibold mb-6 text-white">
                            Translation Complete!
                        </h2>
                        <Button
                            onClick={downloadBrailleFile}
                            className="text-2xl p-6 bg-green-600 hover:bg-green-700 text-white flex items-center gap-4 mx-auto"
                            onFocus={() =>
                                speakText("Download Braille file button")}
                            onMouseEnter={() =>
                                speakText("Download Braille file button")}
                        >
                            <FileDown className="w-8 h-8" />
                            Download Braille File
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BrailleTranslatePage;
