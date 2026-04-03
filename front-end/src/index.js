import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import HomePage from './components/Home/HomePage';
import Home from './components/User/Home'; 
import ForgotPass from "./components/Password/Forgotpass";
import ResetPassword from "./components/Password/ResetPassword";
import Profile from "./components/Profile/Profile";
import WritingPractice from "./components/User/WritingPractice";
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

// CẤP QUYỀN SỬ DỤNG DARK MODE CHO TOÀN ỨNG DỤNG
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/" replace />; 
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<<<<<<< Updated upstream
  <ThemeProvider>
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
          <Route path="forgotpassword" element={<ForgotPass />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="/teacher/dashboard" element={<Dashboard />} />
          <Route path="guide" element={<Guide />} />
          <Route path="editlesson" element={<EditLesson />} />
          <Route path="membership" element={<Membership />} />
          <Route path="/payment/:id" element={<PaymentForm />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/teacher/editcourse/:id" element={<EditCourse />} />
          <Route path="/teacher/createcourse" element={<CreateCourse />} />
          <Route path="/flashcards" element={<FlashcardList />} />
          <Route path="/flashcard/:setId" element={<Flashcard />} />
          <Route path="grammar" element={<Grammar />} />
          <Route path="payment-success" element={<PaymentSuccessSubscription />} />
          <Route path="/teacher/create-quiz" element={<CreateEditQuizz />} />
          <Route path="/teacher/edit-quiz/:id" element={<CreateEditQuizz />} />
          <Route path="/teacher/create" element={<CreateEditFlashcardSet />} />
          <Route path="/teacher/edit/:id" element={<CreateEditFlashcardSet />} />
          <Route path="/teacher/flashcards/:setId" element={<FlashcardItem />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/quiz/start/:quizId" element={<StartQuiz />} />
          <Route path="speakingpractice" element={<SpeakingPractice />} />
          <Route path="/teacher/coursedetail/:courseId" element={<CoursesDetail />} />
          <Route path="/teacher/quizdetail/:quizId" element={<QuizDetail />} />
          <Route path="/admin/examdetail/:quizId" element={<ExamDetail />} />
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
  </ThemeProvider>
=======
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
        <Route path="forgotpassword" element={<ForgotPass />} />
        <Route path="reset-password" element={<ResetPassword />} />
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
>>>>>>> Stashed changes
);