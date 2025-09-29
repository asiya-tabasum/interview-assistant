import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ResumeUpload from './components/ResumeUpload';
import ChatInterface from './components/ChatInterface';
import WelcomeBackModal from './components/WelcomeBackModal';
import { resetInterview } from './interviewSlice';

function IntervieweePage() {
  const dispatch = useDispatch();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const { interviewInProgress, resumeData } = useSelector((state) => state.interview);

  useEffect(() => {
    // Check if there's an ongoing interview when component mounts
    if (interviewInProgress) {
      setShowWelcomeBack(true);
    }
  }, [interviewInProgress]);

  const handleResumeStart = () => {
    dispatch(resetInterview());
  };

  const handleContinueInterview = () => {
    setShowWelcomeBack(false);
  };

  const handleStartNew = () => {
    dispatch(resetInterview());
    setShowWelcomeBack(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showWelcomeBack && (
        <WelcomeBackModal
          onContinue={handleContinueInterview}
          onStartNew={handleStartNew}
        />
      )}
      
      {!resumeData && !interviewInProgress ? (
        <ResumeUpload onStart={handleResumeStart} />
      ) : (
        <ChatInterface />
      )}
    </div>
  );
}

export default IntervieweePage;