import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCurrentQuestion,
  submitAnswer,
  updateTimer,
  finishInterview,
} from '../interviewSlice';

const DIFFICULTY_TIMERS = {
  easy: 20,
  medium: 60,
  hard: 120,
};

function ChatInterface() {
  const dispatch = useDispatch();
  const {
    currentQuestion,
    timeRemaining,
    answers,
    resumeData,
    currentCandidate,
  } = useSelector((state) => state.interview);
  
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      setMessages([
        {
          type: 'system',
          content: `Hello ${currentCandidate.name}! Welcome to your interview. I'll be asking you 6 questions: 2 easy, 2 medium, and 2 hard questions about full-stack development. Let's begin!`,
        },
      ]);
      // Get the first question
      fetchNextQuestion();
    }
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: currentQuestion.text,
      }]);
      
      // Start timer
      startTimer(currentQuestion.difficulty);
    }
  }, [currentQuestion]);

  useEffect(() => {
    // Scroll to bottom when messages change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startTimer = (difficulty) => {
    clearInterval(timerRef.current);
    
    const timeLimit = DIFFICULTY_TIMERS[difficulty];
    dispatch(updateTimer(timeLimit));
    
    timerRef.current = setInterval(() => {
      dispatch(updateTimer((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      }));
    }, 1000);
  };

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    handleSubmit();
  };

  const fetchNextQuestion = () => {
    // In a real app, this would call the backend API
    // For now, we'll simulate it
    const questionTypes = [
      { difficulty: 'easy', count: 2 },
      { difficulty: 'medium', count: 2 },
      { difficulty: 'hard', count: 2 },
    ];

    const currentCount = answers.length;
    if (currentCount >= 6) {
      // Interview complete
      handleInterviewComplete();
      return;
    }

    let difficulty;
    if (currentCount < 2) difficulty = 'easy';
    else if (currentCount < 4) difficulty = 'medium';
    else difficulty = 'hard';

    const mockQuestion = {
      id: currentCount + 1,
      text: `${difficulty.toUpperCase()} Question ${currentCount + 1}: Please explain ${getRandomQuestion(difficulty)}`,
      difficulty,
      timeLimit: DIFFICULTY_TIMERS[difficulty],
    };

    dispatch(setCurrentQuestion(mockQuestion));
  };

  const getRandomQuestion = (difficulty) => {
    const questions = {
      easy: [
        "what is React Virtual DOM?",
        "what are React hooks?",
      ],
      medium: [
        "how does React's diffing algorithm work?",
        "explain Redux middleware",
      ],
      hard: [
        "how would you optimize a React application's performance?",
        "explain how you would implement your own state management solution",
      ],
    };

    return questions[difficulty][Math.floor(Math.random() * questions[difficulty].length)];
  };

  const handleSubmit = () => {
    if (!userInput.trim() && timeRemaining > 0) return;

    clearInterval(timerRef.current);

    // Add user's answer to messages
    setMessages(prev => [...prev, {
      type: 'user',
      content: userInput || '(Time expired - No answer provided)',
    }]);

    // Submit the answer
    dispatch(submitAnswer(userInput));
    setUserInput('');

    // Get next question
    fetchNextQuestion();
  };

  const handleInterviewComplete = () => {
    // In a real app, this would call the backend API for scoring
    // For now, we'll simulate it
    const mockScore = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    const mockSummary = 'The candidate demonstrated good knowledge of React fundamentals but could improve on advanced concepts. Strong problem-solving skills were evident throughout the interview.';

    dispatch(finishInterview({
      score: mockScore,
      summary: mockSummary,
    }));

    setMessages(prev => [...prev, {
      type: 'system',
      content: `Interview complete! Your score: ${mockScore}%\n\n${mockSummary}`,
    }]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-lg shadow-lg">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Timer */}
      {timeRemaining > 0 && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
          <span className={`font-mono ${
            timeRemaining < 10 ? 'text-red-600' : 'text-gray-600'
          }`}>
            Time remaining: {formatTime(timeRemaining)}
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type your answer..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!currentQuestion || timeRemaining === 0}
          />
          <button
            onClick={handleSubmit}
            disabled={!currentQuestion || timeRemaining === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;