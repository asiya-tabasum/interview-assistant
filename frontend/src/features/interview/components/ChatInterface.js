import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  setCurrentQuestion,
  submitAnswer as submitAnswerRedux,
  updateTimer,
  finishInterview,
} from "../interviewSlice";

const API_BASE = "http://localhost:8000";

function ChatInterface() {
  const dispatch = useDispatch();
  const { currentQuestion, timeRemaining, currentCandidate } =
  useSelector((state) => state.interview);

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch next question from backend
  const fetchNextQuestion = useCallback(async () => {
    if (!currentCandidate?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/next-question/${currentCandidate.id}`
      );
      if (res.data && res.data.question) {
        dispatch(setCurrentQuestion(res.data));
      } else {
        // Interview complete
        fetchFinalSummary();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "system", content: "Error fetching next question." },
      ]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [currentCandidate?.id, dispatch]);

  // Submit answer to backend
  const submitAnswer = useCallback(
    async (answerText, timeSpent, timeUp = false) => {
      if (!currentCandidate?.id || !currentQuestion) return;
      setLoading(true);
      try {
        await axios.post(`${API_BASE}/submit-answer`, {
          candidate_id: currentCandidate.id,
          question: currentQuestion.text,
          answer: timeUp ? "(Time expired - No answer provided)" : answerText,
          time_spent: timeSpent,
          difficulty: currentQuestion.difficulty,
        });
        dispatch(submitAnswerRedux(answerText));
        setUserInput("");
        fetchNextQuestion();
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { type: "system", content: "Error submitting answer." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [currentCandidate?.id, currentQuestion, dispatch, fetchNextQuestion]
  );

  // Fetch final summary and score from backend
  const fetchFinalSummary = useCallback(async () => {
    if (!currentCandidate?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/candidates/${currentCandidate.id}`
      );
      if (res.data) {
        dispatch(
          finishInterview({ score: res.data.score, summary: res.data.summary })
        );
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: `Interview complete! Your score: ${res.data.score}%\n\n${res.data.summary}`,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "system", content: "Error fetching interview summary." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentCandidate?.id, dispatch]);

  // Timer logic
  useEffect(() => {
    if (!currentQuestion) return;
    clearInterval(timerRef.current);
    let timeLeft = currentQuestion.time_limit;
    dispatch(updateTimer(timeLeft));
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      dispatch(updateTimer(timeLeft));
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        setMessages((prev) => [
          ...prev,
          { type: "user", content: "(Time expired - No answer provided)" },
        ]);
        submitAnswer("", currentQuestion.time_limit, true);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, dispatch, submitAnswer]);

  // Initial greeting + first question
  useEffect(() => {
    if (messages.length === 0 && currentCandidate?.name) {
      setMessages([
        {
          type: "system",
          content: `Hello ${currentCandidate.name}! Welcome to your interview. I'll be asking you 6 questions: 2 easy, 2 medium, and 2 hard questions about full-stack development. Let's begin!`,
        },
      ]);
      fetchNextQuestion();
    }
    // eslint-disable-next-line
  }, [currentCandidate, messages.length, fetchNextQuestion]);

  // Show new question
  useEffect(() => {
    if (currentQuestion) {
      setMessages((prev) => [
        ...prev,
        { type: "system", content: currentQuestion.text },
      ]);
    }
  }, [currentQuestion]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle user submit
  const handleSubmit = () => {
    if (!userInput.trim() || !currentQuestion || loading) return;
    setMessages((prev) => [...prev, { type: "user", content: userInput.trim() }]);
    submitAnswer(userInput.trim(), currentQuestion.time_limit - timeRemaining, false);
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-lg shadow-lg">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Timer */}
      {timeRemaining > 0 && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
          <span
            className={`font-mono ${
              timeRemaining < 10 ? "text-red-600" : "text-gray-600"
            }`}
          >
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
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!currentQuestion || timeRemaining === 0 || loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!currentQuestion || timeRemaining === 0 || loading}
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
