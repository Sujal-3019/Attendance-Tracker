
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/features/auth/context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  // No authenticated user: return to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // A user with the wrong role goes to their own workspace.
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    if (user.role === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
