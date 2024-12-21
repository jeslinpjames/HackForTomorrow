"use client";
import React, { useState } from 'react';

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
};

const SignTranslate = () => {
  const [text, setText] = useState("");

  const handleChange = (e) => {
    setText(e.target.value.toUpperCase());
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Text to Hand Sign Translation</h1>
      <div className="flex">
        <div className="w-1/2">
          <textarea
            value={text}
            onChange={handleChange}
            className="w-full h-64 p-2 border rounded-lg"
            placeholder="Enter text here..."
          />
        </div>
        <div className="w-1/2 flex flex-wrap">
          {text.split("").map((char, index) => (
            <div key={index} className="w-1/6 p-2">
              {signs[char] ? (
                <img
                  src={signs[char]}
                  alt={`Sign for ${char}`}
                  className="w-full h-auto"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/signs/default.png"; // Fallback image
                  }}
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center border rounded-lg">
                  {char}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignTranslate;