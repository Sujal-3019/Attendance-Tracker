
import { Navigate, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading, authError, retrySession } = useAuth();

  if (isLoading) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Restoring your session...
      </p>
    );
  }

  if (authError) {
    return (
      <div className="space-y-3 p-6" role="alert">
        <p className="text-sm text-destructive">{authError}</p>
        <Button variant="outline" onClick={retrySession}>
          Retry
        </Button>
      </div>
    );
  }

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
