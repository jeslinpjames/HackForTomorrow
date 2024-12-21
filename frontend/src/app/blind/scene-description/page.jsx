"use client";
import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useSpeech } from "@/hooks/speech";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const { videoRef, canvasRef, startCamera, captureImage } = useCamera();
    const { speakText } = useSpeech();

    const [sceneDescription, setSceneDescription] = useState("");
    const [hasLearning, setHasLearning] = useState(false);
    const [learningContent, setLearningContent] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showLearning, setShowLearning] = useState(false);
    const [showButtons, setShowButtons] = useState(false);

    useEffect(() => {
        let stream = null;
        const initCamera = async () => {
            try {
                stream = await startCamera();
                setTimeout(() => handleCapture(stream), 3000);
            } catch (err) {
                setError(err.message);
                speakText(err.message);
            }
        };

        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleCapture = async (stream) => {
        const imageBlob = captureImage();
        if (!imageBlob) return;

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        await sendImageToAPI(imageBlob);
    };

    const sendImageToAPI = async (blob) => {
        setIsProcessing(true);
        speakText("Processing image, please wait...");

        const formData = new FormData();
        formData.append("image", blob, "captured_image.png");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scene-description`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to process image");
            }

            const data = await response.json();
            setSceneDescription(data.scene_description || "");
            setHasLearning(data.has_learning || false);
            setLearningContent(data.learning || "");
            setShowButtons(true);
            
            speakText(data.scene_description, () => {
                if (data.has_learning) {
                    speakText("Would you like to learn more about what you're seeing?");
                }
            });
        } catch (err) {
            setError("Error processing image");
            speakText("Error processing image");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleYes = () => {
        if (hasLearning) {
            setShowLearning(true);
            speakText(learningContent);
        }
    };

    const handleNo = () => router.refresh();

    const handleBack = () => router.push("/blind");

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {isProcessing && <p className="text-4xl">Processing image...</p>}
                    {error && <p className="text-4xl text-red-500">{error}</p>}
                    {sceneDescription && (
                        <p className="text-4xl">{sceneDescription}</p>
                    )}
                    {showLearning && learningContent && (
                        <div className="bg-white text-black p-6 rounded-xl">
                            <h2 className="text-3xl font-bold mb-4">More Information:</h2>
                            <p className="text-2xl">{learningContent}</p>
                        </div>
                    )}
                </div>

                {showButtons && (
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleYes}
                            className="w-full p-8 text-4xl bg-green-600 hover:bg-green-700 rounded-xl"
                        >
                            Yes
                        </button>
                        <button
                            onClick={handleNo}
                            className="w-full p-8 text-4xl bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                            No
                        </button>
                        <button
                            onClick={handleBack}
                            className="w-full p-8 text-4xl bg-blue-600 hover:bg-blue-700 rounded-xl"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
            <video ref={videoRef} autoPlay className="hidden" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
