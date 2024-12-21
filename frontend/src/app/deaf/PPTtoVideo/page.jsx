'use client';
import { useState, useRef } from 'react';
import { Document, Page } from 'react-pdf'; // Add react-pdf library
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Import styles

export default function PPTViewer() {
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [numPages, setNumPages] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/upload-ppt', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            if (data.error) {
                console.error('Error processing PPT:', data.error);
                return;
            }
            setSlides(data.slides);
            setCurrentSlide(0);
        } catch (error) {
            console.error('Error processing PPT:', error);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
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
        const nextSlide = Math.min(currentSlide + 1, slides.length - 1);
        setCurrentSlide(nextSlide);
    };

    const handlePrevious = () => {
        pauseAudio();
        const prevSlide = Math.max(currentSlide - 1, 0);
        setCurrentSlide(prevSlide);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">PPT to Video Viewer</h1>
            <input
                type="file"
                accept=".ppt,.pptx"
                onChange={handleFileUpload}
                className="mb-4 p-2 border rounded"
            />

            {slides.length > 0 && (
                <div className="flex flex-col items-center">
                    <Document
                        file={`http://127.0.0.1:5000${slides[currentSlide].pdf_url}`}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="w-full max-w-3xl mb-4"
                    >
                        <Page pageNumber={currentSlide + 1} />
                    </Document>
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
