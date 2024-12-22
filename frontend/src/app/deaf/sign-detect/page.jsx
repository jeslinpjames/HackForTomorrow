"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as mediapipe from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import { Camera as CameraIcon, BookOpen, RefreshCcw, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const HandSignDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detectedLetter, setDetectedLetter] = useState('');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  const availableLetters = ['A', 'B', 'D', 'U', 'W'];
  
  const classifyHandSign = (landmarks) => {
    // Helper function to calculate angle between three points
    const calculateAngle = (p1, p2, p3) => {
      const getPoint = (p) => ({
        x: p.x,
        y: p.y,
        z: p.z
      });
      
      const point1 = getPoint(p1);
      const point2 = getPoint(p2);
      const point3 = getPoint(p3);
      
      const angle = Math.atan2(
        point3.y - point2.y,
        point3.x - point2.x
      ) - Math.atan2(
        point1.y - point2.y,
        point1.x - point2.x
      );
      
      return Math.abs((angle * 180.0) / Math.PI);
    };

    // Get specific finger landmarks
    const thumb = landmarks[4];
    const indexFinger = landmarks[8];
    const middleFinger = landmarks[12];
    const ringFinger = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];

    // Calculate angles for classification
    const thumbAngle = calculateAngle(wrist, landmarks[2], thumb);
    const indexAngle = calculateAngle(wrist, landmarks[5], indexFinger);
    const middleAngle = calculateAngle(wrist, landmarks[9], middleFinger);
    const ringAngle = calculateAngle(wrist, landmarks[13], ringFinger);
    const pinkyAngle = calculateAngle(wrist, landmarks[17], pinky);

    // Simple classification rules
    if (indexAngle < 30 && middleAngle < 30 && ringAngle < 30 && pinkyAngle < 30) {
      return 'A';
    } else if (indexAngle > 150 && middleAngle > 150 && ringAngle > 150 && pinkyAngle > 150) {
      return 'B';
    } else if (indexAngle > 150 && middleAngle < 30 && ringAngle < 30 && pinkyAngle < 30) {
      return 'D';
    } else if (indexAngle > 150 && middleAngle > 150 && ringAngle < 30 && pinkyAngle < 30) {
      return 'U';
    } else if (indexAngle > 150 && middleAngle > 150 && ringAngle > 150 && pinkyAngle < 30) {
      return 'W';
    } else if (indexAngle > 150 && pinkyAngle > 150 && middleAngle < 30 && ringAngle < 30) {
      return 'Y';
    }
    
    return '?';
  };

  const startPracticeMode = () => {
    setIsPracticeMode(true);
    selectNewTarget();
  };

  const selectNewTarget = () => {
    const newTarget = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    setCurrentTarget(newTarget);
    setFeedback('');
  };

  const resetPractice = () => {
    setIsPracticeMode(false);
    setCurrentTarget(null);
    setFeedback('');
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (canvasRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    hands.onResults((results) => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Draw hand landmarks
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw connections
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < landmarks.length; i++) {
          const point = landmarks[i];
          ctx.beginPath();
          ctx.arc(
            point.x * canvas.width,
            point.y * canvas.height,
            4,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = '#FF0000';
          ctx.fill();
        }
        
        // Classify hand sign
        const letter = classifyHandSign(landmarks);
        setDetectedLetter(letter);

        // Handle practice mode logic
        if (isPracticeMode && currentTarget && letter !== '?') {
          if (letter === currentTarget) {
            if (feedback !== 'correct') {
              setFeedback('correct');
            }
          } else if (feedback !== 'correct') {
            setFeedback('incorrect');
          }
        }
      }
    });

    camera.start()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError('Failed to start camera. Please ensure camera permissions are granted.');
        setIsLoading(false);
      });

    return () => {
      camera.stop();
      hands.close();
    };
  }, [isPracticeMode, currentTarget]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          <CameraIcon className="w-8 h-8" />
          Hand Sign Detection
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width="640"
            height="480"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-lg">Loading hand detection...</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4">
          <Button 
            onClick={isPracticeMode ? resetPractice : startPracticeMode}
            className="flex items-center gap-2"
          >
            {isPracticeMode ? (
              <>
                <RefreshCcw className="w-4 h-4" />
                End Practice
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Start Practice Mode
              </>
            )}
          </Button>
        </div>

        {isPracticeMode ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Practice Mode</h2>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold">
                  Show me the letter: <span className="text-blue-600">{currentTarget}</span>
                </div>
                {feedback === 'correct' && (
                  <div className="text-green-600 font-semibold">Correct!</div>
                )}
                {feedback === 'incorrect' && (
                  <div className="text-red-600 font-semibold">Keep trying! Show the letter {currentTarget}</div>
                )}
                <Button
                  onClick={selectNewTarget}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Next Letter
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Detected Letter:</h2>
            <div className="text-6xl font-bold text-center text-blue-600">
              {detectedLetter || '?'}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 ">
          <p>Make sure your hand is well-lit and clearly visible to the camera.</p>
        </div>
      </div>
    </div>
  );
};

export default HandSignDetector;