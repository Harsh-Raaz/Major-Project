import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, User, BarChart3 } from "lucide-react";

const navLinkClass = ({ isActive }) =>
  `relative pb-1 text-sm font-medium transition ${
    isActive ? "text-white" : "text-white/70 hover:text-white"
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#0A1628]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <NavLink to="/" className="font-display text-xl font-bold text-white">
          CrowdCare
          <span className="ml-1 text-[#00B8A9]">.</span>
        </NavLink>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-wrap items-center gap-5">
            <NavLink to="/" end className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  Home
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#00B8A9]" />
                  )}
                </span>
              )}
            </NavLink>
            <NavLink to="/hospitals" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  Find Hospitals
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#00B8A9]" />
                  )}
                </span>
              )}
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={navLinkClass}>
                {({ isActive }) => (
                  <span className="relative">
                    My Appointments
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#00B8A9]" />
                    )}
                  </span>
                )}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                {({ isActive }) => (
                  <span className="relative inline-flex items-center gap-1">
                    <BarChart3 size={16} />
                    Admin
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#00B8A9]" />
                    )}
                  </span>
                )}
              </NavLink>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:border-[#00B8A9]/70 hover:text-[#7ff6ec]"
                >
                  <User size={16} />
                  {user?.name || user?.email}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A1628] transition hover:scale-[1.02]"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:border-white hover:bg-white/5"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-full bg-[#00B8A9] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,184,169,0.24)] transition hover:scale-[1.02]"
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
