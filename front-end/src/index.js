import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import HomePage from './components/Home/HomePage';
import Home from './components/User/Home'; 
import ForgotPass from "./components/Password/Forgotpass";
import ResetPassword from "./components/Password/ResetPassword";
import Profile from "./components/Profile/Profile";
import WritingPractice from "./components/User/WritingPractice";
import ListeningPractice from "./components/User/ListeningPractice";
import Membership from "./components/User/Membership";
import CourseDetail from './components/User/CourseDetail';
import Flashcard from "./components/User/Flashcard";
import Grammar from "./components/User/Grammar";
import PaymentForm from "./components/User/PaymentForm";
import PaymentSuccessSubscription from "./components/User/PaymentSuccessSubscription";
import StartQuiz from "./components/User/StartQuiz";
import FlashcardList from './components/User/FlashcardList';
import SpeakingPractice from './components/User/SpeakingPractice';
import QuizPublish from "./components/User/QuizPublish";
import TeacherInfo from './components/User/TeacherInfo';
import CourseFeedback from './components/User/CourseFeedback';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/" replace />; 
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={
          localStorage.getItem("user") ? <Navigate to="/home" replace /> : <HomePage />
        } />
        
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="writingpractice" element={<WritingPractice />} />
        <Route path="listeningpractice" element={<ListeningPractice />} />
        <Route path="forgotpassword" element={<ForgotPass />} />
        <Route path="reset-password" element={<ResetPassword />} />
        {/* <Route path="editlesson" element={<EditLesson />} /> */}
        <Route path="membership" element={<Membership />} />
        <Route path="/payment/:id" element={<PaymentForm />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/flashcards" element={<FlashcardList />} />
        <Route path="/flashcard/:setId" element={<Flashcard />} />
        <Route path="grammar" element={<Grammar />} />
        <Route path="payment-success" element={<PaymentSuccessSubscription />} />
        <Route path="/quiz/start/:quizId" element={<StartQuiz />} />
        <Route path="speakingpractice" element={<SpeakingPractice />} />
        <Route path="/quiz/publish" element={<QuizPublish />} />
        <Route path="/course/:id/feedback" element={<CourseFeedback />} />
        <Route path="/teacherinfo/:teacherId" element={<TeacherInfo />} />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>

    </Routes>
  </BrowserRouter>
);