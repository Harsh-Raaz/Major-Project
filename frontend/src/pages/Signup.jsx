import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ClipboardList, Activity, BellRing } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { validateSignupForm } from "../utils/validation";
import Loader from "../components/Loader";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = validateSignupForm(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await signup(form.email, form.password, form.phone, form.name);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="cc-hero-grid relative hidden overflow-hidden px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="cc-eyebrow border-white/15 text-white/65">Create Account</p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
            Build a smarter care journey from your very first booking.
          </h1>
          <p className="mt-4 max-w-xl text-white/72">
            Create an account to unlock a unified dashboard for appointments,
            notifications, waitlists, and ongoing care coordination.
          </p>
        </div>
        <div className="grid gap-4">
          {[ClipboardList, Activity, BellRing].map((Icon, index) => (
            <div
              key={index}
              className="cc-glass flex items-center gap-4 rounded-[24px] p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">
                  One account, full visibility
                </p>
                <p className="text-sm text-white/68">
                  From symptom search to post-visit follow-up in one place.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <p className="cc-eyebrow">Patient Registration</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#0A1628]">
            Create your CrowdCare account
          </h2>
          <p className="mt-3 text-slate-600">
            Secure your login and start booking with live care availability.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="cc-field">
              <span>Full Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </label>

            <label className="cc-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </label>

            <label className="cc-field">
              <span>Phone Number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  setForm({ ...form, phone: event.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="9876543210"
                maxLength="10"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
            </label>

            <label className="cc-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => {
                  setForm({ ...form, password: event.target.value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="********"
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </label>

            <label className="cc-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => {
                  setForm({ ...form, confirmPassword: event.target.value });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: "" });
                  }
                }}
                placeholder="********"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </label>

            <button type="submit" disabled={loading} className="cc-btn-primary w-full justify-center">
              {loading ? <Loader small /> : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#00B8A9] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
