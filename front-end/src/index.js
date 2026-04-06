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
import AdminDashboard from './components/Admin/AdminDashboard'; 
import ExamDetail from './components/Admin/ExamDetail';
import TeacherDashboard from "./components/Teacher/Dashboard";
import TeacherCourseWorkspace from "./components/Teacher/CourseDetail";
import TeacherCreateEditCourse from "./components/Teacher/CreateEditCourse";
import TeacherCreateEditFlashcardSet from "./components/Teacher/CreateEditFlashcardSet";
import TeacherFlashcardWorkspace from "./components/Teacher/FlashcardItem";
import TeacherCreateEditQuiz from "./components/Teacher/CreateEditQuizz";
import TeacherQuizWorkspace from "./components/Teacher/QuizDetail";
import TeacherGuide from "./components/Teacher/Guide";
import TeacherCreateLesson from "./components/Teacher/CreateLesson";
import TeacherEditLesson from "./components/Teacher/EditLesson";

// CẤP QUYỀN SỬ DỤNG DARK MODE CHO TOÀN ỨNG DỤNG
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/" replace />; 
};

const TeacherRoute = ({ children }) => {
  const raw = localStorage.getItem("user");
  let user = null;
  try {
    if (raw && raw !== "undefined" && raw !== "null") {
      user = JSON.parse(raw);
    }
  } catch {
    user = null;
  }
  if (!user) return <Navigate to="/" replace />;
  const role = String(user.role || "").toUpperCase();
  if (role !== "TEACHER") return <Navigate to="/home" replace />;
  return children;
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ThemeProvider>
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

        <Route path="/teacher/dashboard" element={
          <TeacherRoute>
            <TeacherDashboard />
          </TeacherRoute>
        } />
        <Route path="/teacher/coursedetail/:courseId" element={
          <TeacherRoute>
            <TeacherCourseWorkspace />
          </TeacherRoute>
        } />
        <Route path="/teacher/create-course" element={
          <TeacherRoute>
            <TeacherCreateEditCourse />
          </TeacherRoute>
        } />
        <Route path="/teacher/createcourse" element={
          <TeacherRoute>
            <TeacherCreateEditCourse />
          </TeacherRoute>
        } />
        <Route path="/teacher/editcourse/:id" element={
          <TeacherRoute>
            <TeacherCreateEditCourse />
          </TeacherRoute>
        } />
        <Route path="/teacher/edit-course/:id" element={
          <TeacherRoute>
            <TeacherCreateEditCourse />
          </TeacherRoute>
        } />
        <Route path="/teacher/create" element={
          <TeacherRoute>
            <TeacherCreateEditFlashcardSet />
          </TeacherRoute>
        } />
        <Route path="/teacher/edit/:id" element={
          <TeacherRoute>
            <TeacherCreateEditFlashcardSet />
          </TeacherRoute>
        } />
        <Route path="/teacher/flashcards/:setId" element={
          <TeacherRoute>
            <TeacherFlashcardWorkspace />
          </TeacherRoute>
        } />
        <Route path="/teacher/create-quiz" element={
          <TeacherRoute>
            <TeacherCreateEditQuiz />
          </TeacherRoute>
        } />
        <Route path="/teacher/edit-quiz/:id" element={
          <TeacherRoute>
            <TeacherCreateEditQuiz />
          </TeacherRoute>
        } />
        <Route path="/teacher/quizdetail/:quizId" element={
          <TeacherRoute>
            <TeacherQuizWorkspace />
          </TeacherRoute>
        } />
        <Route path="/teacher/quizdetail/:quizId/:groupType" element={
          <TeacherRoute>
            <TeacherQuizWorkspace />
          </TeacherRoute>
        } />
        <Route path="/teacher/guide" element={
          <TeacherRoute>
            <TeacherGuide />
          </TeacherRoute>
        } />
        <Route path="/teacher/create-lesson" element={
          <TeacherRoute>
            <TeacherCreateLesson />
          </TeacherRoute>
        } />
        <Route path="/teacher/edit-lesson/:id" element={
          <TeacherRoute>
            <TeacherEditLesson />
          </TeacherRoute>
        } />
      </Route>

    </Routes>
    </ThemeProvider>
  </BrowserRouter>
);