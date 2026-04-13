import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <p className="text-xl">Welcome! Chat coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
