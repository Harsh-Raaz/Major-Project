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
import Chatbot from "./pages/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";

export default function RootApp() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/doctors/:id" element={<Doctors />} />
        <Route path="/slots/:id" element={<Slots />} />
        <Route path="/route/:id" element={<RoutePage />} />

        {/* Protected Routes */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirm" element={<Confirmation />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireRole="patient">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waitlist"
          element={
            <ProtectedRoute>
              <Waitlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search-history"
          element={
            <ProtectedRoute>
              <SearchHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

