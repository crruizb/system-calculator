import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}
