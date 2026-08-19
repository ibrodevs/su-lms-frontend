import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { ADMIN_ROLES, STAFF_ROLES, STUDENT_ROLES } from "./auth/roles";
import { GuestRoute } from "./components/auth/GuestRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import StudentLayout from "./layouts/StudentLayout";
import StaffLayout from "./layouts/StaffLayout";
import ForbiddenPage from "./pages/errors/ForbiddenPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
const StudentCalendarPage = lazy(() => import("./pages/student/StudentCalendarPage"));
const StudentCoursePage = lazy(() => import("./pages/student/StudentCoursePage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboardPage"));
const StudentLessonPage = lazy(() => import("./pages/student/StudentLessonPage"));
const StudentMaterialPage = lazy(() => import("./pages/student/StudentMaterialPage"));
const StudentProgressPage = lazy(() => import("./pages/student/StudentProgressPage"));
const StaffDashboardPage = lazy(() => import("./pages/staff/StaffDashboardPage"));
const StaffCoursesPage = lazy(() => import("./pages/staff/StaffCoursesPage"));
const StaffCourseFormPage = lazy(() => import("./pages/staff/StaffCourseFormPage"));
const StaffCourseDetailPage = lazy(() => import("./pages/staff/StaffCourseDetailPage"));
const CourseBuilderPage = lazy(() => import("./pages/staff/CourseBuilderPage"));
const LessonEditorPage = lazy(() => import("./pages/staff/LessonEditorPage"));
const StaffMaterialsPage = lazy(() => import("./pages/staff/StaffMaterialsPage"));
const StaffCalendarPage = lazy(() => import("./pages/staff/StaffCalendarPage"));
const CoursePreviewPage = lazy(() => import("./pages/staff/CoursePreviewPage"));
const StaffTemplatesPage = lazy(() => import("./pages/staff/StaffTemplatesPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));

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

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
      <Route path="/login">
        <GuestRoute>
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        </GuestRoute>
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
        <ProtectedRoute allowedRoles={STUDENT_ROLES}>
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
            <Route>
              <NotFoundPage />
            </Route>
            </Switch>
          </StudentLayout>
        </ProtectedRoute>
      </Route>
      <Route exact path="/courses/:courseId/preview">
        <ProtectedRoute allowedRoles={STAFF_ROLES}>
          <CoursePreviewPage />
        </ProtectedRoute>
      </Route>
      <Route path={["/teacher", "/content", "/admin", "/courses", "/materials", "/templates", "/calendar"]}>
        <ProtectedRoute allowedRoles={STAFF_ROLES}>
          <StaffLayout>
            <Switch>
            <Route exact path={["/teacher", "/content", "/admin"]}>
              <StaffDashboardPage />
            </Route>
            <Route exact path="/admin/users">
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <AdminUsersPage />
              </ProtectedRoute>
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
            <Route exact path="/courses/:courseId/builder">
              <CourseBuilderPage />
            </Route>
            <Route exact path="/courses/:courseId/lessons/:lessonId/edit">
              <LessonEditorPage />
            </Route>
            <Route exact path="/courses/:courseId">
              <StaffCourseDetailPage />
            </Route>
            <Route exact path="/materials">
              <StaffMaterialsPage />
            </Route>
            <Route exact path="/calendar">
              <StaffCalendarPage />
            </Route>
            <Route exact path="/templates">
              <StaffTemplatesPage />
            </Route>
            <Route>
              <NotFoundPage />
            </Route>
            </Switch>
          </StaffLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute allowedRoles={STUDENT_ROLES}>
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
