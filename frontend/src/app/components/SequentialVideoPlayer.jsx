'use client';

import { useState, useEffect, useRef, memo } from "react";

const SequentialVideoPlayer = memo(function SequentialVideoPlayer({ videoUrls = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevLengthRef = useRef(0);
  const videoRef = useRef(null);

  useEffect(() => {
    // Only reset index if we're starting fresh
    if (prevLengthRef.current === 0 && videoUrls.length > 0) {
      setCurrentIndex(0);
      // Ensure the first video plays
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Playback failed:", e));
      }
    }
    prevLengthRef.current = videoUrls.length;
  }, [videoUrls]);

  const handleEnded = () => {
    if (currentIndex + 1 < videoUrls.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      console.log("All videos played.");
    }
  };

  if (videoUrls.length === 0) {
    return <p className="text-gray-500">No videos to play</p>;
  }

  const currentVideo = videoUrls[currentIndex];

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={currentVideo.url}
        autoPlay
        playsInline
        controls
        onEnded={handleEnded}
        className="w-full h-auto rounded-lg"
      />
      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white 
                    text-center p-6 text-6xl font-bold tracking-wider">
        {currentVideo.caption}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Playing video {currentIndex + 1} of {videoUrls.length}
      </div>
    </div>
  );
});

export default SequentialVideoPlayer;
