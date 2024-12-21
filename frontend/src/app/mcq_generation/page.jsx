"use client"
import { useState, useEffect, useCallback } from 'react';  // Remove useRef
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVoiceAssistance } from "@/hooks/useVoiceAssistance";

const MCQPage = () => {
    const [chapterName, setChapterName] = useState('');
    const [mcqs, setMcqs] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState('');
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasAnnounced, setHasAnnounced] = useState(false);
    const { speak } = useVoiceAssistance();  // Remove announce

    const handleGenerateMCQs = async () => {
        if (!chapterName.trim()) {
            const errorMsg = "Please enter a chapter name";
            setError(errorMsg);
            speak(errorMsg);
            return;
        }

        setLoading(true);
        speak("Generating MCQs, please wait...");
        setError('');

        try {
            const response = await axios.post(
                'http://127.0.0.1:5001/mcq/generatemcq/',
                { chapter_name: chapterName },
                { 
                    headers: { 
                        'Content-Type': 'application/json'
                    } 
                }
            );
            setMcqs(response.data.answer_key);
            speak("MCQs generated successfully. You can now review the questions.");
            setError('');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to generate MCQs. Please try again.';
            setError(errorMsg);
            speak(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        speak(`Selected option: ${option}`);
    };

    const handleConfirmAnswer = () => {
        if (!selectedOption) {
            speak("Please select an option first");
            return;
        }

        const currentQuestion = mcqs[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correct_answer_option;
        
        if (isCorrect) {
            speak("Correct answer!");
            setScore(prev => prev + 1);
        } else {
            speak(`Incorrect. The correct answer was ${currentQuestion.correct_answer_option}`);
        }

        if (currentQuestionIndex < mcqs.length - 1) {
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption('');
                speak(`Next question: ${mcqs[currentQuestionIndex + 1].question}`);
            }, 2000);
        } else {
            setTimeout(() => {
                setShowScore(true);
                speak(`Quiz completed! Your score is ${score + (isCorrect ? 1 : 0)} out of ${mcqs.length}`);
            }, 2000);
        }
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption('');
        setScore(0);
        setShowScore(false);
        speak("Quiz restarted. Let's begin again!");
    };

    const handleQuestionHover = useCallback((text) => {
        speak(text);
    }, [speak]);

    // Render current question
    const renderCurrentQuestion = () => {
        const question = mcqs[currentQuestionIndex];

        return (
            <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                    <div 
                        className="mb-4 font-semibold text-lg"
                        onMouseEnter={() => {
                            speak(`Question ${currentQuestionIndex + 1}: ${question.question}`);
                        }}
                    >
                        Question {currentQuestionIndex + 1}: {question.question}
                    </div>
                    <div className="space-y-3">
                        {question.options.map((option, idx) => (
                            <div 
                                key={idx}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100"
                                onClick={() => handleOptionSelect(option)}
                                onMouseEnter={() => speak(`Option ${option}`)}
                            >
                                <input
                                    type="radio"
                                    checked={selectedOption === option}
                                    onChange={() => handleOptionSelect(option)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600"
                                />
                                <label className="ml-2 cursor-pointer">
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                    <Button 
                        className="mt-4 w-full"
                        onClick={handleConfirmAnswer}
                        disabled={!selectedOption}
                    >
                        Confirm Answer
                    </Button>
                </CardContent>
            </Card>
        );
    };

    const renderScore = () => (
        <Card className="text-center p-6">
            <CardContent>
                <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
                <p className="text-xl mb-4">Your Score: {score} out of {mcqs.length}</p>
                <Button onClick={handleRestartQuiz}>Restart Quiz</Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-200 via-sky-200 to-blue-200 p-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        MCQ Quiz
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!mcqs.length ? (
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <Input 
                                    value={chapterName}
                                    onChange={(e) => setChapterName(e.target.value)}
                                    placeholder="Enter chapter name"
                                    className="flex-grow"
                                    aria-label="Enter chapter name to generate MCQs"
                                    onMouseEnter={() => handleQuestionHover("Enter chapter name")}
                                />
                                <Button 
                                    onClick={handleGenerateMCQs}
                                    disabled={loading}
                                    aria-label={loading ? 'Generating MCQs...' : 'Generate MCQs'}
                                    onMouseEnter={() => handleQuestionHover(loading ? "Generating MCQs" : "Generate MCQs")}
                                >
                                    {loading ? 'Generating...' : 'Generate MCQs'}
                                </Button>
                            </div>

                            {error && (
                                <div 
                                    className="text-red-500 text-sm text-center"
                                    role="alert"
                                    onMouseEnter={() => handleQuestionHover(error)}
                                >
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : showScore ? (
                        renderScore()
                    ) : (
                        renderCurrentQuestion()
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MCQPage;
