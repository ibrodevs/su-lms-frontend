import { Redirect, Route, Switch } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import StudentLayout from "./layouts/StudentLayout";
import ForbiddenPage from "./pages/errors/ForbiddenPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import StudentCalendarPage from "./pages/student/StudentCalendarPage";
import StudentCoursePage from "./pages/student/StudentCoursePage";
import StudentCoursesPage from "./pages/student/StudentCoursesPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentLessonPage from "./pages/student/StudentLessonPage";
import StudentMaterialPage from "./pages/student/StudentMaterialPage";
import StudentProgressPage from "./pages/student/StudentProgressPage";

export default function App() {
  return (
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
      </Route>
      <Route path="/profile">
        <StudentLayout>
          {({ openLogout }) => <ProfilePage openLogout={openLogout} />}
        </StudentLayout>
      </Route>
      <Route path="/403">
        <ForbiddenPage />
      </Route>
      <Redirect exact from="/" to="/login" />
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}
