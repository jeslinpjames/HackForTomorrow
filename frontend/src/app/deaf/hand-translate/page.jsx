// "use client";
// import React, { useState, useEffect } from 'react';
// import { Volume2, RefreshCw } from 'lucide-react';

// const signs = {
//   A: "/signs/A.png",
//   B: "/signs/B.png",
//   C: "/signs/C.png",
//   D: "/signs/D.png",
//   E: "/signs/E.png",
//   F: "/signs/F.png",
//   G: "/signs/G.png",
//   H: "/signs/H.png",
//   I: "/signs/I.png",
//   J: "/signs/J.png",
//   K: "/signs/K.png",
//   L: "/signs/L.png",
//   M: "/signs/M.png",
//   N: "/signs/N.png",
//   O: "/signs/O.png",
//   P: "/signs/P.png",
//   Q: "/signs/Q.png",
//   R: "/signs/R.png",
//   S: "/signs/S.png",
//   T: "/signs/T.png",
//   U: "/signs/U.png",
//   V: "/signs/V.png",
//   W: "/signs/W.png",
//   X: "/signs/X.png",
//   Y: "/signs/Y.png",
//   Z: "/signs/Z.png",
//   " ": "/signs/space.png",
// };

// const SignTranslate = () => {
//   const [text, setText] = useState("");
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const handleChange = (e) => {
//     setText(e.target.value.toUpperCase());
//     setCurrentIndex(0); // Reset index when text changes
//   };

//   const handleSpeak = () => {
//     if ('speechSynthesis' in window) {
//       const utterance = new SpeechSynthesisUtterance(text);
//       window.speechSynthesis.speak(utterance);
//     }
//   };

//   const clearText = () => {
//     setText("");
//     setCurrentIndex(0);
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
//     }, 1000); // Change image every second

//     return () => clearInterval(interval);
//   }, [text]);

//   return (
//     <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
//       <h1 className="text-2xl font-bold mb-4 text-center">Text to Hand Sign Translation</h1>
//       <div className="flex flex-col lg:flex-row gap-4">
//         <div className="w-full lg:w-1/2 space-y-2">
//           <textarea
//             value={text}
//             onChange={handleChange}
//             className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//             placeholder="Enter text here..."
//           />
//           <div className="flex justify-end space-x-2">
//             <button
//               onClick={handleSpeak}
//               className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
//               title="Speak text"
//             >
//               <Volume2 size={20} />
//             </button>
//             <button
//               onClick={clearText}
//               className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
//               title="Clear text"
//             >
//               <RefreshCw size={20} />
//             </button>
//           </div>
//         </div>
//         <div className="w-full lg:w-1/2 flex flex-wrap bg-gray-50 p-4 rounded-lg min-h-[16rem]">
//           {text.split("").map((char, index) => (
//             <div key={index} className="w-1/6 p-2">
//               {signs[char] ? (
//                 <img
//                   src={signs[char]}
//                   alt={`Sign for ${char}`}
//                   className="w-full h-auto"
//                   onError={(e) => {
//                     e.target.onerror = null;
//                     e.target.src = "/signs/default.png"; // Fallback image
//                   }}
//                 />
//               ) : (
//                 <div className="w-full h-24 flex items-center justify-center border rounded-lg">
//                   {char}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//       {text && (
//         <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
//           <h2 className="text-xl font-bold mb-2">Current Sentence</h2>
//           <div className="flex justify-center">
//             {signs[text[currentIndex]] ? (
//               <img
//                 src={signs[text[currentIndex]]}
//                 alt={`Sign for ${text[currentIndex]}`}
//                 className="w-24 h-24"
//                 onError={(e) => {
//                   e.target.onerror = null;
//                   e.target.src = "/signs/default.png"; // Fallback image
//                 }}
//               />
//             ) : (
//               <div className="w-24 h-24 flex items-center justify-center border rounded-lg">
//                 {text[currentIndex]}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SignTranslate;

"use client";
import React, { useState, useEffect } from 'react';
import { Volume2, RefreshCw, Download, Play, Pause, Mic } from 'lucide-react'; // Added Mic icon
import jsPDF from 'jspdf';

const signs = {
  A: "/signs/A.png",
  B: "/signs/B.png",
  C: "/signs/C.png",
  D: "/signs/D.png",
  E: "/signs/E.png",
  F: "/signs/F.png",
  G: "/signs/G.png",
  H: "/signs/H.png",
  I: "/signs/I.png",
  J: "/signs/J.png",
  K: "/signs/K.png",
  L: "/signs/L.png",
  M: "/signs/M.png",
  N: "/signs/N.png",
  O: "/signs/O.png",
  P: "/signs/P.png",
  Q: "/signs/Q.png",
  R: "/signs/R.png",
  S: "/signs/S.png",
  T: "/signs/T.png",
  U: "/signs/U.png",
  V: "/signs/V.png",
  W: "/signs/W.png",
  X: "/signs/X.png",
  Y: "/signs/Y.png",
  Z: "/signs/Z.png",
  " ": "/signs/space.png",
};

const SignTranslate = () => {
  const [text, setText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isListening, setIsListening] = useState(false); // Added state for listening

  const handleChange = (e) => {
    setText(e.target.value.toUpperCase());
    setCurrentIndex(0); // Reset index when text changes
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearText = () => {
    setText("");
    setCurrentIndex(0);
  };

  const handleDownload = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("Text to Hand Sign Translation", 10, 10);
    pdf.text("Entered Text:", 10, 20);
    pdf.text(text, 10, 30);

    let xOffset = 10;
    let yOffset = 40;
    const lineHeight = 30;
    const imageSize = 30;

    text.split("").forEach((char, index) => {
      if (signs[char]) {
        const img = new Image();
        img.src = signs[char];
        pdf.addImage(img, "PNG", xOffset, yOffset, imageSize, imageSize);
        pdf.text(char, xOffset + imageSize + 5, yOffset + imageSize / 2 + 5);

        xOffset += imageSize + 20;
        if (xOffset + imageSize > 200) {
          xOffset = 10;
          yOffset += lineHeight;
        }
      }
    });

    pdf.save("sign_translation.pdf");
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
    }, 1000); // Change image every second

    return () => clearInterval(interval);
  }, [text, isPaused]);

  const handleStart = () => {
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toUpperCase();
      setText(transcript);
      setCurrentIndex(0);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Text to Hand Sign Translation</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2 space-y-2">
          <textarea
            value={text}
            onChange={handleChange}
            className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter text here..."
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleSpeak}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Speak text"
            >
              <Volume2 size={20} />
            </button>
            <button
              onClick={clearText}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Clear text"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleSpeechRecognition}
              className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 ${isListening && "bg-gray-200"}`}
              title="Start speech recognition"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-wrap flex-row bg-gray-50 p-4 rounded-lg min-h-[16rem] border-2 border-blue-400">
          {text.split("").map((char, index) => (
            <div
              key={index}
              className={`w-auto p-2 relative group border rounded-lg bg-$
              {index === currentIndex ? "yellow-200" : "white"}`}
            >
              {signs[char] ? (
                <>
                  <img
                    src={signs[char]}
                    alt={`Sign for ${char}`}
                    className="w-20 h-20"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/signs/default.png"; // Fallback image
                    }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-75 text-white text-sm text-center opacity-0 group-hover:opacity-100">
                    {char}
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 flex items-center justify-center border rounded-lg">
                  {char}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {text && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center border-2 border-green-500">
          <h2 className="text-xl font-bold mb-2">Current Sentence</h2>
          <div className="flex justify-center">
            {signs[text[currentIndex]] ? (
              <img
                src={signs[text[currentIndex]]}
                alt={`Sign for ${text[currentIndex]}`}
                className="w-36 h-36"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/signs/default.png"; // Fallback image
                }}
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center border rounded-lg">
                {text[currentIndex]}
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-center space-x-4">
            <button
              onClick={handleStart}
              className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ${!isPaused && "opacity-50 pointer-events-none"}`}
              disabled={!isPaused}
            >
              Start
            </button>
            <button
              onClick={handlePause}
              className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ${isPaused && "opacity-50 pointer-events-none"}`}
              disabled={isPaused}
            >
              Pause
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignTranslate;

