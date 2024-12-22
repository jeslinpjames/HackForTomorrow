'use client';
import { useState, useRef } from 'react';

export default function PPTViewer() {
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/upload-ppt', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to process PPT');
            }
            
            setSlides(data.slides);
            setCurrentSlide(0);
        } catch (error) {
            setError(error.message);
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const playAudio = () => {
        if (!slides[currentSlide]?.audio_url) return;
        audioRef.current = new Audio(`http://127.0.0.1:5000${slides[currentSlide].audio_url}`);
        setIsPlaying(true);
        audioRef.current.play();
        audioRef.current.onended = () => setIsPlaying(false);
    };

    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleNext = () => {
        pauseAudio();
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    };

    const handlePrevious = () => {
        pauseAudio();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">PPT Viewer</h1>
            
            <input
                type="file"
                accept=".ppt,.pptx"
                onChange={handleFileUpload}
                className="mb-4 p-2 border rounded"
                disabled={loading}
            />

            {loading && (
                <div className="text-center py-4">
                    <p>Processing PPT file...</p>
                </div>
            )}

            {error && (
                <div className="text-red-500 mb-4">
                    Error: {error}
                </div>
            )}

            {slides.length > 0 && !loading && (
                <div className="flex flex-col items-center">
                    <img
                        src={`http://127.0.0.1:5000${slides[currentSlide].image_url}`}
                        alt={`Slide ${currentSlide + 1}`}
                        className="w-full max-w-3xl mb-4"
                    />
                    
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentSlide === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        
                        {!isPlaying ? (
                            <button
                                onClick={playAudio}
                                className="px-4 py-2 bg-green-500 text-white rounded"
                            >
                                Play Audio
                            </button>
                        ) : (
                            <button
                                onClick={pauseAudio}
                                className="px-4 py-2 bg-red-500 text-white rounded"
                            >
                                Pause Audio
                            </button>
                        )}
                        
                        <button
                            onClick={handleNext}
                            disabled={currentSlide === slides.length - 1}
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                    <div className="w-full max-w-3xl bg-gray-50 p-4 rounded shadow">
                        <h3 className="font-bold mb-2">Script:</h3>
                        <p>{slides[currentSlide].script}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
