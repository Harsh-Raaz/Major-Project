import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { validateLoginForm } from "../utils/validation";
import Loader from "../components/Loader";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="cc-hero-grid relative hidden overflow-hidden px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="cc-eyebrow border-white/15 text-white/65">CrowdCare</p>
          <h1 className="mt-5 font-display text-5xl font-bold leading-tight">
            Clinical access designed for calmer patient journeys.
          </h1>
          <p className="mt-4 max-w-xl text-white/72">
            Log in to manage appointments, receive wait-time updates, and keep
            every care decision in one secure place.
          </p>
        </div>
        <div className="grid gap-4">
          {[HeartPulse, ShieldCheck, Stethoscope].map((Icon, index) => (
            <div
              key={index}
              className="cc-glass flex items-center gap-4 rounded-[24px] p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">
                  Precision-first care access
                </p>
                <p className="text-sm text-white/68">
                  Real-time hospital discovery, booking, and patient updates.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <p className="cc-eyebrow">Welcome Back</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#0A1628]">
            Sign in to CrowdCare
          </h2>
          <p className="mt-3 text-slate-600">
            Continue to your dashboard and appointment timeline.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
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
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </label>

            <button type="submit" disabled={loading} className="cc-btn-primary w-full justify-center">
              {loading ? <Loader small /> : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-[#00B8A9] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
