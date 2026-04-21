import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import Doctors from "./pages/Doctors";
import Slots from "./pages/Slots";
import Booking from "./pages/Booking";
import Confirmation from "./pages/Confirmation";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import RoutePage from "./pages/RoutePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Waitlist from "./pages/Waitlist";
import SearchHistory from "./pages/SearchHistory";
import Reviews from "./pages/Reviews";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

export default function RootApp() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/hospitals" element={<AppLayout><Hospitals /></AppLayout>} />
        <Route path="/doctors/:id" element={<AppLayout><Doctors /></AppLayout>} />
        <Route path="/slots/:id" element={<AppLayout><Slots /></AppLayout>} />
        <Route path="/route/:id" element={<AppLayout><RoutePage /></AppLayout>} />

        {/* Protected Routes */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Booking />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirm"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Confirmation />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="patient">
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/waitlist"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Waitlist />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search-history"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SearchHistory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reviews />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AppLayout>
                <Admin />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

