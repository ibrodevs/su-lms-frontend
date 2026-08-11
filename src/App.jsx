import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import StudentLayout from "./layouts/StudentLayout";
import StaffLayout from "./layouts/StaffLayout";
import ForbiddenPage from "./pages/errors/ForbiddenPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { getStaffSession } from "./services/staffSession";
import { getStudentLocalState } from "./services/studentStorage";
const StudentCalendarPage = lazy(() => import("./pages/student/StudentCalendarPage"));
const StudentCoursePage = lazy(() => import("./pages/student/StudentCoursePage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboardPage"));
const StudentLessonPage = lazy(() => import("./pages/student/StudentLessonPage"));
const StudentMaterialPage = lazy(() => import("./pages/student/StudentMaterialPage"));
const StudentProgressPage = lazy(() => import("./pages/student/StudentProgressPage"));
const StudentAssignmentsPage = lazy(() => import("./pages/student/StudentAssignmentsPage"));
const StudentAssignmentDetailPage = lazy(() => import("./pages/student/StudentAssignmentDetailPage"));
const StudentTestsPage = lazy(() => import("./pages/student/StudentTestsPage"));
const StudentTestRunPage = lazy(() => import("./pages/student/StudentTestRunPage"));
const StudentTestResultPage = lazy(() => import("./pages/student/StudentTestResultPage"));
const StudentSchedulePage = lazy(() => import("./pages/student/StudentSchedulePage"));
const StudentNotificationsPage = lazy(() => import("./pages/student/StudentNotificationsPage"));
const StaffDashboardPage = lazy(() => import("./pages/staff/StaffDashboardPage"));
const StaffCoursesPage = lazy(() => import("./pages/staff/StaffCoursesPage"));
const StaffCourseFormPage = lazy(() => import("./pages/staff/StaffCourseFormPage"));
const StaffCourseDetailPage = lazy(() => import("./pages/staff/StaffCourseDetailPage"));

function RouteLoading() {
  return (
    <div className="student-theme grid min-h-screen place-items-center p-6">
      <div className="grid justify-items-center gap-3 text-center">
        <span className="size-10 animate-pulse rounded-full border-4 border-ecto border-t-transparent" />
        <p className="text-sm font-black text-ash">Загрузка раздела…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  return getStudentLocalState().authenticated ? children : <Redirect to="/login" />;
}

function StaffProtectedRoute({ children }) {
  return getStaffSession()?.authenticated ? children : <Redirect to="/login" />;
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
      <Route path="/login">
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Route>
      <Route path="/forgot-password">
        <AuthLayout>
          <ForgotPasswordPage />
        </AuthLayout>
      </Route>
      <Route path="/reset-password">
        <AuthLayout>
          <ResetPasswordPage />
        </AuthLayout>
      </Route>
      <Route path="/student">
        <ProtectedRoute>
          <StudentLayout>
            <Switch>
            <Route exact path="/student">
              <StudentDashboardPage />
            </Route>
            <Route exact path="/student/courses">
              <StudentCoursesPage />
            </Route>
            <Route
              exact
              path="/student/courses/:courseId/lessons/:lessonId"
            >
              <StudentLessonPage />
            </Route>
            <Route exact path="/student/courses/:courseId">
              <StudentCoursePage />
            </Route>
            <Route exact path="/student/materials/:materialId">
              <StudentMaterialPage />
            </Route>
            <Route exact path="/student/progress">
              <StudentProgressPage />
            </Route>
            <Route exact path="/student/calendar">
              <StudentCalendarPage />
            </Route>
            <Route exact path="/student/schedule">
              <StudentSchedulePage />
            </Route>
            <Route exact path="/student/assignments">
              <StudentAssignmentsPage />
            </Route>
            <Route exact path="/student/assignments/:assignmentId">
              <StudentAssignmentDetailPage />
            </Route>
            <Route exact path="/student/tests">
              <StudentTestsPage />
            </Route>
            <Route exact path="/student/tests/:testId/result">
              <StudentTestResultPage />
            </Route>
            <Route exact path="/student/tests/:testId">
              <StudentTestRunPage />
            </Route>
            <Route exact path="/student/notifications">
              <StudentNotificationsPage />
            </Route>
            <Route>
              <NotFoundPage />
            </Route>
            </Switch>
          </StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path={["/teacher", "/content", "/admin", "/courses"]}>
        <StaffProtectedRoute>
          <StaffLayout>
            <Switch>
            <Route exact path={["/teacher", "/content", "/admin"]}>
              <StaffDashboardPage />
            </Route>
            <Route exact path="/courses">
              <StaffCoursesPage />
            </Route>
            <Route exact path="/courses/create">
              <StaffCourseFormPage />
            </Route>
            <Route exact path="/courses/:courseId/edit">
              <StaffCourseFormPage />
            </Route>
            <Route exact path="/courses/:courseId">
              <StaffCourseDetailPage />
            </Route>
            <Route>
              <NotFoundPage />
            </Route>
            </Switch>
          </StaffLayout>
        </StaffProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <StudentLayout>
            {({ openLogout }) => <ProfilePage openLogout={openLogout} />}
          </StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/403">
        <ForbiddenPage />
      </Route>
      <Redirect exact from="/" to="/login" />
      <Route>
        <NotFoundPage />
      </Route>
      </Switch>
    </Suspense>
  );
}
