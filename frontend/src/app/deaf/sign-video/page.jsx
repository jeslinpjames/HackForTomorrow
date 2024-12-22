'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Loader from '../../components/Loader';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleGenerateText = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }

    setIsGenerating(true);
    setError('');
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
    setIsGenerating(false);
  };

  const handleTranslateText = useCallback(async () => {
    if (!generatedText) return;
    
    setError('');
    setVideoSigns([]);
    setTextSigns([]);
    setIsTranslating(true);

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
      setIsTranslating(false);
    }
  }, [generatedText]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Learn Sign Language</h1>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
              Enter a topic to learn about
            </label>
            <div className="flex gap-4">
              <input
                id="topic"
                type="text"
                placeholder="e.g., Greetings, Weather, Family..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating || isTranslating}
              />
              <button 
                onClick={handleGenerateText}
                disabled={isGenerating || isTranslating || !topic.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader size="small" />
                    Generating...
                  </>
                ) : 'Generate Text'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {generatedText && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 hidden">Generated Text</h2>
              <p className="text-gray-700 hidden">{generatedText}</p>
              <button 
                onClick={handleTranslateText}
                disabled={isTranslating}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isTranslating ? (
                  <>
                    <Loader size="small" />
                    Translating...
                  </>
                ) : 'Translate to Sign Language'}
              </button>
            </div>
          )}

          {isTranslating && (
            <div className="flex flex-col items-center py-8">
              <Loader size="large" />
              <p className="mt-4 text-gray-600">Translating to sign language...</p>
            </div>
          )}

          {videoSigns.length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Sign Language Videos</h2>
              <SequentialVideoPlayer videoUrls={videoSigns} />
            </div>
          )}

          {textSigns.length > 0 && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-4 text-gray-800">Text Signs/Messages:</h3>
              <div className="space-y-2">
                {textSigns.map((text, index) => (
                  <p key={index} className="text-gray-700">{text}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

