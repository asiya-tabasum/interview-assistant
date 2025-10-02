import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './app/store';
import Title from "./components/Title";
import Layout from './components/layout/Layout';
import IntervieweePage from './features/interview/IntervieweePage';
import InterviewerDashboard from './features/interview/InterviewerDashboard';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Title />} />
            <Route path="/interview" element={<Layout />}>
              <Route path="chat" element={<IntervieweePage />} />
              <Route path="dashboard" element={<InterviewerDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
