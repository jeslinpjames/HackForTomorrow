'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of SequentialVideoPlayer with SSR disabled
const SequentialVideoPlayer = dynamic(
  () => import('../../components/SequentialVideoPlayer'),
  { ssr: false }
);

export default function TextToSigns() {
  const [topic, setTopic] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [videoSigns, setVideoSigns] = useState([]);
  const [textSigns, setTextSigns] = useState([]);
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

  const handleTranslateText = useCallback(async () => {
    if (!generatedText) return;
    setError('');
    setVideoSigns([]); // Only reset at the start of new translation
    setTextSigns([]);
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

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const signData = JSON.parse(line);
              if (signData.type === 'video') {
                setVideoSigns(prev => [...prev, {
                  url: signData.data,
                  caption: signData.caption
                }]);
              } else {
                setTextSigns(prev => [...prev, signData.data]);
              }
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
  }, [generatedText]); // Only recreate if generatedText changes

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
              <h2 className="text-2xl font-semibold hidden">Generated PSL Text</h2>
              <p className="p-4 bg-gray-50 rounded hidden">{generatedText}</p>
              <button 
                onClick={handleTranslateText}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Translate to Sign Language
              </button>
            </div>
          )}

          {videoSigns.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Sign Language Videos</h2>
              <SequentialVideoPlayer videoUrls={videoSigns} />
            </div>
          )}

          {textSigns.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Text Signs/Messages:</h3>
              {textSigns.map((text, index) => (
                <p key={index} className="text-gray-700">{text}</p>
              ))}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

