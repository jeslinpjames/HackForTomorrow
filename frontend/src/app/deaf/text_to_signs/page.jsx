'use client';

import { useState, useEffect } from 'react';

export default function TextToSigns() {
  const [topic, setTopic] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [translatedSigns, setTranslatedSigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateText = async () => {
    setLoading(true);
    setError('');  // Clear any previous errors
    try {
      const response = await fetch("http://localhost:5000/generate_psl_text", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGeneratedText(data.generated_text);
    } catch (error) {
      console.error("Error generating PSL text:", error);
      setError('Failed to generate text. Please try again.');
    }
    setLoading(false);
  };

  const handleTranslateText = async () => {
    if (!generatedText) return;
    setError('');
    setTranslatedSigns([]); // Reset signs before new translation
    setLoading(true);

    try {
      console.log("Starting translation request...");
      const response = await fetch("http://localhost:5000/translate_to_sign", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: generatedText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          console.log("Stream complete");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete chunk

        for (const line of lines) {
          if (line.trim()) {
            try {
              const signData = JSON.parse(line);
              console.log("Received sign data type:", signData.type);
              if (signData.type === 'video') {
                console.log("Video data length:", signData.data.length);
              }
              setTranslatedSigns(prev => [...prev, signData]);
            } catch (e) {
              console.error("Error parsing line:", e, line);
            }
          }
        }
      }

    } catch (error) {
      console.error("Error translating to sign language:", error);
      setError('Failed to translate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSign = (sign, index) => {
    if (sign.type === 'error') {
      return <div key={index} className="p-4 bg-red-50 text-red-500 rounded">{sign.error}</div>;
    }

    return (
      <div key={index} className="p-4 bg-gray-50 rounded">
        {sign.type === 'video' ? (
          <div className="aspect-w-16 aspect-h-9">
            <video
              src={sign.data}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onError={(e) => console.error("Video error:", e)}
            />
          </div>
        ) : (
          <p className="text-gray-700">{sign.data}</p>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Learn Sign Language</h1>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button 
              onClick={handleGenerateText}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate PSL Text
            </button>
          </div>

          {error && (
            <div className="p-4 text-red-500 bg-red-50 rounded mt-2">
              {error}
            </div>
          )}

          {loading && <p className="text-gray-500">Loading...</p>}

          {generatedText && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Generated PSL Text</h2>
              <p className="p-4 bg-gray-50 rounded">{generatedText}</p>
              <button 
                onClick={handleTranslateText}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Translate to Sign Language
              </button>
            </div>
          )}

          {Array.isArray(translatedSigns) && translatedSigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Sign Language Videos</h2>
              <div className="grid gap-4">
                {translatedSigns.map((sign, index) => renderSign(sign, index))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

