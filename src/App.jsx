import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { student } from "./data/mockData";
import HomePage from "./pages/HomePage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import MaterialReaderPage from "./pages/MaterialReaderPage";
import LessonQuizPage from "./pages/LessonQuizPage";
import QuizResultPage from "./pages/QuizResultPage";
import QuickTestsPage from "./pages/QuickTestsPage";

function LoginPage({ onLogin }) {
  const [value, setValue] = useState(student.id);

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">B</div>
        <p className="eyebrow">Frontend demo</p>
        <h1>Bilim Ordo</h1>
        <p className="muted">
          Учебная платформа с предметами, уроками, материалами и тестами внутри каждого урока.
        </p>
        <label htmlFor="studentId">Student ID</label>
        <input
          id="studentId"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="BO-2024-XXXX"
        />
        <button
          className="primary-action"
          type="button"
          onClick={() => onLogin(value.trim() || student.id)}
        >
          Войти в демо
        </button>
      </section>
    </main>
  );
}

function Shell({ onLogout }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" to="/">
          <span className="brand-mark small">B</span>
          <span>
            <strong>Bilim Ordo</strong>
            <small>{student.group}</small>
          </span>
        </Link>
        <nav>
          <NavLink to="/" end>
            <LayoutDashboard size={18} /> Главная
          </NavLink>
          <NavLink to="/subjects">
            <BookOpen size={18} /> Предметы
          </NavLink>
          <NavLink to="/tests">
            <ListChecks size={18} /> Тесты
          </NavLink>
        </nav>
        <button className="ghost-action" type="button" onClick={onLogout}>
          <LogOut size={18} /> Выйти
        </button>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Студент</span>
            <strong>{student.name}</strong>
          </div>
          <div className="topbar-pill">
            <GraduationCap size={18} /> {student.id}
          </div>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route path="/subjects/:subjectId/lessons/:lessonId" element={<LessonDetailPage />} />
          <Route
            path="/subjects/:subjectId/lessons/:lessonId/materials/:materialId"
            element={<MaterialReaderPage />}
          />
          <Route path="/subjects/:subjectId/lessons/:lessonId/quiz" element={<LessonQuizPage />} />
          <Route
            path="/subjects/:subjectId/lessons/:lessonId/quiz/result"
            element={<QuizResultPage />}
          />
          <Route path="/tests" element={<QuickTestsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [studentId, setStudentId] = useState(() => localStorage.getItem("bilim-student-id"));
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = "ru";
  }, []);

  if (!studentId) {
    return (
      <LoginPage
        onLogin={(id) => {
          localStorage.setItem("bilim-student-id", id);
          setStudentId(id);
        }}
      />
    );
  }

  return (
    <Shell
      onLogout={() => {
        localStorage.removeItem("bilim-student-id");
        setStudentId(null);
        navigate("/");
      }}
    />
  );
}
