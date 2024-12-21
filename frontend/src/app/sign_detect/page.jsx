// "use client";
// import React, { useRef, useEffect, useState } from "react";
// import Webcam from "react-webcam";
// import * as tf from "@tensorflow/tfjs";
// import * as handpose from "@tensorflow-models/handpose";
// import { Camera, HandMetal, Settings2, Save, Eye, EyeOff } from "lucide-react";

// const HandSignLanguage = () => {
//   const webcamRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [result, setResult] = useState("");
//   const [confidence, setConfidence] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [cameraError, setCameraError] = useState(false);
//   const [showGuide, setShowGuide] = useState(false);
//   const [detectionHistory, setDetectionHistory] = useState([]);
//   const [showLandmarks, setShowLandmarks] = useState(true);
//   const [confidenceThreshold, setConfidenceThreshold] = useState(70);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [capturedResult, setCapturedResult] = useState("");

//   const fingerIndices = {
//     thumb: [1, 2, 3, 4],
//     index: [5, 6, 7, 8],
//     middle: [9, 10, 11, 12],
//     ring: [13, 14, 15, 16],
//     pinky: [17, 18, 19, 20],
//   };

//   const detectGesture = (landmarks) => {
//     const fingers = [];
//     const finger_mcp = [5, 9, 13, 17];
//     const finger_dip = [6, 10, 14, 18];
//     const finger_pip = [7, 11, 15, 19];
//     const finger_tip = [8, 12, 16, 20];

//     for (let i = 0; i < 4; i++) {
//       if (landmarks[finger_tip[i]][1] + 25 < landmarks[finger_dip[i]][1] && landmarks[16][2] < landmarks[20][2]) {
//         fingers.push(0.25); // Half-closed
//       } else if (landmarks[finger_tip[i]][2] > landmarks[finger_dip[i]][2]) {
//         fingers.push(0); // Fully closed
//       } else if (landmarks[finger_tip[i]][2] < landmarks[finger_pip[i]][2]) {
//         fingers.push(1); // Fully open
//       } else if (
//         landmarks[finger_tip[i]][1] > landmarks[finger_pip[i]][1] &&
//         landmarks[finger_tip[i]][1] > landmarks[finger_dip[i]][1]
//       ) {
//         fingers.push(0.5); // Slightly bent
//       }
//     }

//     // Classify gestures based on patterns
//     if (
//       landmarks[3][2] > landmarks[4][2] &&
//       landmarks[3][1] > landmarks[6][1] &&
//       landmarks[4][2] < landmarks[6][2] &&
//       fingers.filter((f) => f === 0).length === 4
//     ) {
//       return "A";
//     } else if (landmarks[3][1] > landmarks[4][1] && fingers.filter((f) => f === 1).length === 4) {
//       return "B";
//     } else if (
//       landmarks[3][1] > landmarks[6][1] &&
//       fingers.filter((f) => f === 0.5).length >= 1 &&
//       landmarks[4][2] > landmarks[8][2]
//     ) {
//       return "C";
//     } else if (fingers[0] === 1 && fingers.filter((f) => f === 0).length === 3) {
//       return "D";
//     } else if (
//       landmarks[3][1] < landmarks[6][1] &&
//       fingers.filter((f) => f === 0).length === 4 &&
//       landmarks[12][2] < landmarks[4][2]
//     ) {
//       return "E";
//     } else if (landmarks[4][2] > landmarks[20][2] && fingers[0] === 0.5) {
//       return "F";
//     } else if (
//       landmarks[4][1] > landmarks[3][1] &&
//       landmarks[4][2] > landmarks[8][2] &&
//       fingers.filter((f) => f === 1).length === 4
//     ) {
//       return "G";
//     } else if (
//       fingers.filter((f) => f === 0.5).length >= 1 &&
//       landmarks[8][2] < landmarks[6][2] &&
//       landmarks[4][1] > landmarks[3][1]
//     ) {
//       return "H";
//     } else if (landmarks[4][2] > landmarks[8][2] && fingers[1] === 0) {
//       return "I";
//     } else if (
//       landmarks[4][2] > landmarks[8][2] &&
//       landmarks[12][2] < landmarks[8][2]
//     ) {
//       return "J";
//     } else if (
//       landmarks[4][1] > landmarks[3][1] &&
//       landmarks[4][2] > landmarks[8][2] &&
//       fingers[1] === 0
//     ) {
//       return "K";
//     } else if (
//       landmarks[8][2] < landmarks[6][2] &&
//       fingers.filter((f) => f === 0).length >= 1
//     ) {
//       return "L";
//     } else if (landmarks[4][1] < landmarks[16][1] && fingers.filter((f) => f === 0).length === 4) {
//       return "M";
//     } else if (landmarks[4][1] < landmarks[12][1] && fingers.filter((f) => f === 0).length === 4) {
//       return "N";
//     } else if (
//       landmarks[4][2] < landmarks[8][2] &&
//       landmarks[4][2] < landmarks[12][2] &&
//       landmarks[4][2] < landmarks[16][2] &&
//       landmarks[4][2] < landmarks[20][2]
//     ) {
//       return "O";
//     } else if (
//       fingers[2] === 0 &&
//       landmarks[4][2] < landmarks[12][2] &&
//       landmarks[4][2] > landmarks[6][2]
//     ) {
//       return "P";
//     } else if (
//       fingers[1] === 0 &&
//       fingers[2] === 0 &&
//       fingers[3] === 0 &&
//       landmarks[8][2] > landmarks[5][2] &&
//       landmarks[4][2] < landmarks[1][2]
//     ) {
//       return "Q";
//     } else if (
//       landmarks[8][1] < landmarks[12][1] &&
//       fingers.filter((f) => f === 1).length === 2 &&
//       landmarks[9][1] > landmarks[4][1]
//     ) {
//       return "R";
//     } else if (
//       landmarks[4][1] < landmarks[6][1] &&
//       landmarks[4][1] < landmarks[10][1] &&
//       fingers.filter((f) => f === 1).length === 2 &&
//       landmarks[3][2] > landmarks[4][2] &&
//       landmarks[8][1] - landmarks[11][1] <= 50
//     ) {
//       return "U";
//     } else if (
//       landmarks[4][1] < landmarks[6][1] &&
//       landmarks[4][1] < landmarks[10][1] &&
//       fingers.filter((f) => f === 1).length === 2 &&
//       landmarks[3][2] > landmarks[4][2]
//     ) {
//       return "V";
//     } else if (
//       landmarks[4][1] < landmarks[6][1] &&
//       landmarks[4][1] < landmarks[10][1] &&
//       fingers.filter((f) => f === 1).length === 3
//     ) {
//       return "W";
//     } else if (
//       fingers[0] === 0.5 &&
//       fingers.filter((f) => f === 0).length === 3 &&
//       landmarks[4][1] > landmarks[6][1]
//     ) {
//       return "X";
//     } else if (
//       fingers.filter((f) => f === 0).length === 3 &&
//       landmarks[3][1] < landmarks[4][1] &&
//       fingers[3] === 1
//     ) {
//       return "Y";
//     }
//     return "Unknown";
//   };

//   const drawHandLandmarks = (hand, ctx) => {
//     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//     if (!showLandmarks) return;

//     ctx.strokeStyle = "#00ff00";
//     ctx.lineWidth = 2;

//     const fingerColors = {
//       thumb: "#ff0000",
//       index: "#00ff00",
//       middle: "#0000ff",
//       ring: "#ffff00",
//       pinky: "#ff00ff",
//     };

//     Object.entries(fingerIndices).forEach(([finger, indices]) => {
//       ctx.strokeStyle = fingerColors[finger];
//       ctx.beginPath();
//       indices.forEach((idx, i) => {
//         const [x, y] = hand.landmarks[idx];
//         if (i === 0) ctx.moveTo(x, y);
//         else ctx.lineTo(x, y);
//       });
//       ctx.stroke();
//     });

//     hand.landmarks.forEach(([x, y]) => {
//       ctx.beginPath();
//       ctx.arc(x, y, 4, 0, 2 * Math.PI);
//       ctx.fillStyle = "white";
//       ctx.fill();
//     });
//   };

//   const detect = async (net) => {
//     if (webcamRef.current?.video?.readyState === 4) {
//       const video = webcamRef.current.video;
//       const { videoWidth, videoHeight } = video;

//       webcamRef.current.video.width = videoWidth;
//       webcamRef.current.video.height = videoHeight;
//       canvasRef.current.width = videoWidth;
//       canvasRef.current.height = videoHeight;

//       try {
//         const hands = await net.estimateHands(video);
//         if (hands.length > 0) {
//           const landmarks = hands[0].landmarks;
//           const gesture = detectGesture(landmarks);

//           setDetectionHistory((prev) => {
//             const updatedHistory = [...prev, gesture].slice(-5); // Keep last 5 gestures
//             const frequentGesture = findMostFrequentGesture(updatedHistory);
//             setResult(frequentGesture); // Update result based on the most frequent gesture
//             return updatedHistory;
//           });

//           const ctx = canvasRef.current.getContext("2d");
//           drawHandLandmarks(hands[0], ctx);
//         } else {
//           setResult("No hand detected");
//         }
//       } catch (error) {
//         console.error("Error in hand detection:", error);
//       }
//     }
//   };

//   const findMostFrequentGesture = (history) => {
//     const counts = history.reduce((acc, gesture) => {
//       acc[gesture] = (acc[gesture] || 0) + 1;
//       return acc;
//     }, {});

//     return Object.entries(counts)
//       .sort(([, a], [, b]) => b - a)[0][0];
//   };

//   const captureImage = () => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     setCapturedImage(imageSrc);
//     setCapturedResult(result);
//   };

//   useEffect(() => {
//     const initializeHandpose = async () => {
//       try {
//         const net = await handpose.load();
//         console.log("Handpose model loaded.");
//         setIsLoading(false);

//         const detectInterval = setInterval(() => {
//           detect(net);
//         }, 100);

//         return () => clearInterval(detectInterval);
//       } catch (error) {
//         console.error("Error loading handpose model:", error);
//         setCameraError(true);
//         setIsLoading(false);
//       }
//     };

//     initializeHandpose();
//   }, []);

//   return (
//     <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
//       <div className="flex items-center gap-2 mb-4">
//         <HandMetal className="w-6 h-6" />
//         <h1 className="text-2xl font-bold">Hand Sign Language Detection</h1>
//       </div>
//       <div className="relative">
//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
//             <div className="text-white flex items-center gap-2">
//               <Settings2 className="w-6 h-6 animate-spin" />
//               Loading model...
//             </div>
//           </div>
//         )}

//         {cameraError && (
//           <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
//             Unable to access camera. Please ensure you have granted camera
//             permissions.
//           </div>
//         )}

//         <div className="relative inline-block">
//           <Webcam
//             ref={webcamRef}
//             className="rounded-lg shadow-lg"
//             style={{ width: 640, height: 480 }}
//             screenshotFormat="image/jpeg"
//           />
//           <canvas
//             ref={canvasRef}
//             className="absolute top-0 left-0 z-10"
//             style={{ width: 640, height: 480 }}
//           />
//         </div>

//         <div className="mt-4 space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="text-2xl font-bold">
//               Detected Sign: {result || "No sign detected"}
//             </div>
//             <div className="text-sm text-gray-500">
//               Confidence: {confidence.toFixed(1)}%
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <button
//               onClick={() => setShowGuide(!showGuide)}
//               className="flex items-center gap-2 p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
//             >
//               <Camera className="w-4 h-4" />
//               {showGuide ? "Hide" : "Show"} Guide
//             </button>
//             <button
//               onClick={captureImage}
//               className="flex items-center gap-2 p-2 rounded bg-green-500 text-white hover:bg-green-600"
//             >
//               <Save className="w-4 h-4" />
//               Capture Image
//             </button>
//             <button
//               onClick={() => setShowLandmarks(!showLandmarks)}
//               className="flex items-center gap-2 p-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
//             >
//               {showLandmarks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//               {showLandmarks ? "Hide" : "Show"} Landmarks
//             </button>
//           </div>

//           <div className="mt-4">
//             <label htmlFor="confidenceThreshold" className="block text-sm font-medium text-gray-700">
//               Confidence Threshold: {confidenceThreshold}%
//             </label>
//             <input
//               type="range"
//               id="confidenceThreshold"
//               name="confidenceThreshold"
//               min="50"
//               max="100"
//               value={confidenceThreshold}
//               onChange={(e) => setConfidenceThreshold(e.target.value)}
//               className="w-full"
//             />
//           </div>

//           {showGuide && (
//             <div className="p-4 bg-gray-100 rounded-lg">
//               <h3 className="font-bold mb-2">Tips for better detection:</h3>
//               <ul className="list-disc pl-5 space-y-2">
//                 <li>Ensure good lighting conditions</li>
//                 <li>Keep your hand steady and within frame</li>
//                 <li>Position your hand about 2 feet from the camera</li>
//                 <li>Make clear, deliberate gestures</li>
//               </ul>
//             </div>
//           )}
//         </div>

//         {capturedImage && (
//           <div className="mt-4">
//             <h3 className="text-xl font-bold">Captured Image</h3>
//             <img src={capturedImage} alt="Captured Hand Sign" className="rounded-lg shadow-lg mt-2" />
//             <div className="text-lg font-bold mt-2">Detected Sign: {capturedResult}</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default HandSignLanguage;



//new one


"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as mediapipe from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import { Camera as CameraIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HandSignDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detectedLetter, setDetectedLetter] = useState('');
  
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
  }, []);

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

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Detected Letter:</h2>
          <div className="text-6xl font-bold text-center text-blue-600">
            {detectedLetter || '?'}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Currently detecting letters: A, B, D, U, W, Y</p>
          <p>Make sure your hand is well-lit and clearly visible to the camera.</p>
        </div>
      </div>
    </div>
  );
};

export default HandSignDetector;

