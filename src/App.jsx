import { Redirect, Route, Switch } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ForbiddenPage from "./pages/errors/ForbiddenPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";

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
      <Route path="/profile">
        <AppLayout>
          {({ openLogout }) => <ProfilePage openLogout={openLogout} />}
        </AppLayout>
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
