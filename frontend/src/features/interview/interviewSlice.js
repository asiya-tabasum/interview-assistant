import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  candidates: [],
  currentCandidate: null,
  currentQuestion: null,
  questions: [],
  answers: [],
  interviewInProgress: false,
  timeRemaining: null,
  resumeData: null,
  finalScore: null,
  summary: '',
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    setResumeData: (state, action) => {
      state.resumeData = action.payload;
    },
    startInterview: (state) => {
      state.interviewInProgress = true;
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.timeRemaining = action.payload.timeLimit;
    },
    submitAnswer: (state, action) => {
      state.answers.push({
        questionId: state.currentQuestion.id,
        answer: action.payload,
        timeSpent: state.currentQuestion.timeLimit - state.timeRemaining,
      });
    },
    updateTimer: (state, action) => {
      state.timeRemaining = action.payload;
    },
    finishInterview: (state, action) => {
      state.interviewInProgress = false;
      state.finalScore = action.payload.score;
      state.summary = action.payload.summary;
      if (state.currentCandidate) {
        state.candidates.push({
          ...state.currentCandidate,
          score: action.payload.score,
          summary: action.payload.summary,
          answers: state.answers,
        });
      }
    },
    resetInterview: (state) => {
      state.currentQuestion = null;
      state.answers = [];
      state.interviewInProgress = false;
      state.timeRemaining = null;
      state.finalScore = null;
      state.summary = '';
    },
  },
});

export const {
  setCurrentCandidate,
  setResumeData,
  startInterview,
  setCurrentQuestion,
  submitAnswer,
  updateTimer,
  finishInterview,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;