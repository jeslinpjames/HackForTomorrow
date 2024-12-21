"use client";
import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const { videoRef, canvasRef, startCamera, captureImage } = useCamera();

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const [sceneDescription, setSceneDescription] = useState("");
    const [hasLearning, setHasLearning] = useState(false);
    const [learningContent, setLearningContent] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showLearning, setShowLearning] = useState(false);
    const [showButtons, setShowButtons] = useState(false);

    // Add new control states
    const [sceneDescribed, setSceneDescribed] = useState(false);
    const [learningNarrated, setLearningNarrated] = useState(false);

    useEffect(() => {
        let stream = null;
        const initCamera = async () => {
            try {
                stream = await startCamera();
                // Use fixed 3000ms delay for capture
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
        formData.append("image", blob, "captured_image.jpg");

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/scene-description`, {
                method: "POST",
                body: formData,
                // Add proper headers
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to process image");
            }

            const data = await response.json();
            
            // Validate response data
            if (!data.scene_description) {
                throw new Error("Invalid response from server");
            }

            setSceneDescription(data.scene_description);
            setHasLearning(data.has_learning || false);
            setLearningContent(data.learning || "");
            setShowButtons(true);
            
            // Sequential speech
            await speakText(data.scene_description);
            if (data.has_learning) {
                await speakText("Would you like to learn more about what you're seeing?");
            }
        } catch (err) {
            setError(err.message);
            // speakText("Error processing image: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleYes = () => {
        if (hasLearning && !learningNarrated) {
            setLearningNarrated(true);
            setShowLearning(true);
            speakText(learningContent);
        }
    };

    const handleHover = (text) => {
        if (window.speechSynthesis.speaking) return;
        window.speechSynthesis.cancel();
        speakText(text);
    };

    const handleNo = async () => {
        // Reset states
        setSceneDescription("");
        setHasLearning(false);
        setLearningContent("");
        setShowLearning(false);
        setLearningNarrated(false);
        setError(null);
        
        // Restart camera
        try {
            const stream = await startCamera();
            setTimeout(() => handleCapture(stream), 3000);
        } catch (err) {
            setError(err.message);
            speakText(err.message);
        }
    };

    const handleBack = () => router.push("/blind");

    return (
        <div className="min-h-screen bg-black text-white flex p-6">
            <div className="flex-1 flex flex-col items-start justify-center p-6 overflow-auto">
                {isProcessing && <p className="mb-6 text-6xl">Processing image, please wait...</p>}
                {error && <p className="text-red-500 mb-6 text-4xl">{error}</p>}
                
                {!isProcessing && !error && sceneDescription && (
                    <div className="mb-8 text-center max-w-2xl">
                        <p className="text-5xl">{sceneDescription}</p>
                    </div>
                )}

                {showLearning && learningContent && (
                    <div className="mb-8 text-center max-w-2xl bg-white text-black p-8 rounded-xl shadow-lg transition-all duration-500">
                        <h2 className="font-bold text-5xl mb-4">More Information:</h2>
                        <p className="text-4xl">{learningContent}</p>
                    </div>
                )}
            </div>

            {showButtons && (
                <div className="flex-1 flex flex-col justify-between p-6">
                    <div className="flex flex-col space-y-4 h-full">
                        <button
                            onMouseEnter={() => handleHover('Yes button, click to continue')}
                            onClick={handleYes}
                            className="w-full h-1/3 bg-green-600 text-white font-extrabold text-7xl rounded-xl hover:bg-green-700 transform hover:scale-110 transition-transform duration-200"
                        >
                            Yes
                        </button>
                        <button
                            onMouseEnter={() => handleHover('No button, to stop')}
                            onClick={handleNo}
                            className="w-full h-1/3 bg-red-600 text-white font-extrabold text-7xl rounded-xl hover:bg-red-700 transform hover:scale-110 transition-transform duration-300"
                        >
                            No
                        </button>
                        <button
                            onMouseEnter={() => handleHover('Back to Home button')}
                            onClick={handleBack}
                            className="w-full h-1/3 bg-blue-600 text-white font-extrabold text-7xl rounded-xl hover:bg-blue-700 transform hover:scale-110 transition-transform duration-300"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}
            
            <video ref={videoRef} autoPlay className="hidden" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
