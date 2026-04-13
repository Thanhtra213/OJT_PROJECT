import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

// ── LAZY IMPORTS: USER ────────────────────────────
const HomePage = lazy(() => import('./components/Home/HomePage'));
const Home = lazy(() => import('./components/User/Home')); 
const ForgotPass = lazy(() => import("./components/Password/Forgotpass"));
const ResetPassword = lazy(() => import("./components/Password/ResetPassword"));
const Profile = lazy(() => import("./components/Profile/Profile"));
const WritingPractice = lazy(() => import("./components/User/WritingPractice"));
const Membership = lazy(() => import("./components/User/Membership"));
const CourseDetail = lazy(() => import('./components/User/CourseDetail'));
const Flashcard = lazy(() => import("./components/User/Flashcard"));
const Grammar = lazy(() => import("./components/User/Grammar"));
const PaymentForm = lazy(() => import("./components/User/PaymentForm"));
const PaymentSuccessSubscription = lazy(() => import("./components/User/PaymentSuccessSubscription"));
const StartQuiz = lazy(() => import("./components/User/StartQuiz"));
const FlashcardList = lazy(() => import('./components/User/FlashcardList'));
const SpeakingPractice = lazy(() => import('./components/User/SpeakingPractice'));
const QuizPublish = lazy(() => import("./components/User/QuizPublish"));
const TeacherInfo = lazy(() => import('./components/User/TeacherInfo'));
const CourseFeedback = lazy(() => import('./components/User/CourseFeedback'));
const MyvocabList = lazy(() => import("./components/User/Flashcardgame/MyVocabList"));
const GameLauncher = lazy(() => import("./components/User/Flashcardgame/Gamelauncher")); 

// ── LAZY IMPORTS: ADMIN ───────────────────────────
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard')); 
const ExamDetail = lazy(() => import('./components/Admin/ExamDetail'));

// ── LAZY IMPORTS: TEACHER ─────────────────────────
const TeacherDashboard = lazy(() => import("./components/Teacher/Dashboard"));
const TeacherCourseWorkspace = lazy(() => import("./components/Teacher/CourseDetail"));
const TeacherCreateEditCourse = lazy(() => import("./components/Teacher/CreateEditCourse"));
const TeacherCreateEditFlashcardSet = lazy(() => import("./components/Teacher/CreateEditFlashcardSet"));
const TeacherFlashcardWorkspace = lazy(() => import("./components/Teacher/FlashcardItem"));
const TeacherCreateEditQuiz = lazy(() => import("./components/Teacher/CreateEditQuizz"));
const TeacherQuizWorkspace = lazy(() => import("./components/Teacher/QuizDetail"));
const TeacherGuide = lazy(() => import("./components/Teacher/Guide"));
const TeacherCreateLesson = lazy(() => import("./components/Teacher/CreateLesson"));
const TeacherEditLesson = lazy(() => import("./components/Teacher/EditLesson"));

// ── PROTECTED ROUTES ──────────────────────────────
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/" replace />; 
};

const AdminRoute = ({ children }) => {
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
  if (role !== "ADMIN") return <Navigate to="/home" replace />;
  return children;
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

// ── FALLBACK LOADER ───────────────────────────────
const GlobalLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '40px', height: '40px', 
        border: '4px solid #e2e8f0', borderTopColor: '#00c896', 
        borderRadius: '50%', animation: 'spin 1s linear infinite',
        margin: '0 auto 16px' 
      }} />
      <div style={{ color: '#64748b', fontWeight: 600, fontSize: '15px' }}>Đang tải trang...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── RENDER ─────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ThemeProvider>
      <Suspense fallback={<GlobalLoader />}>
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
            <Route path="/flashcard/my-vocab" element={<MyvocabList />} />
            <Route path="/game" element={<GameLauncher />} />
            
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="forgotpassword" element={<ForgotPass />} />
            <Route path="resetpassword" element={<ResetPassword />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/examdetail/:quizId" element={
              <AdminRoute>
                <ExamDetail />
              </AdminRoute>
            } />

            {/* TEACHER ROUTES */}
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
      </Suspense>
    </ThemeProvider>
  </BrowserRouter>
);