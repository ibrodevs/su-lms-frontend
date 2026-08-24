import { getStaffRole } from "../../auth/roles";
import { useAuth } from "../../auth/useAuth";
import StaffLayout from "../../layouts/StaffLayout";
import StudentLayout from "../../layouts/StudentLayout";
import ProfilePage from "./ProfilePage";

export default function ProfileShell() {
  const { user } = useAuth();

  if (getStaffRole(user?.roles ?? [])) {
    return <StaffLayout>{({ openLogout }) => <ProfilePage openLogout={openLogout} />}</StaffLayout>;
  }

  return <StudentLayout>{({ openLogout }) => <ProfilePage openLogout={openLogout} />}</StudentLayout>;
}
