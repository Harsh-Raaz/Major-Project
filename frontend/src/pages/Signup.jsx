import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { validateSignupForm } from '../utils/validation';
import Loader from '../components/Loader';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-blue-900">Create Account</h1>
        <p className="mt-2 text-blue-700">
          Sign up to start booking appointments
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-blue-900">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => {
                setForm({ ...form, name: event.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`mt-2 w-full rounded-lg border px-4 py-2 outline-none ring-blue-300 focus:ring-2 ${
                errors.name
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-200 bg-white'
              }`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`mt-2 w-full rounded-lg border px-4 py-2 outline-none ring-blue-300 focus:ring-2 ${
                errors.email
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-200 bg-white'
              }`}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => {
                setForm({ ...form, phone: event.target.value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={`mt-2 w-full rounded-lg border px-4 py-2 outline-none ring-blue-300 focus:ring-2 ${
                errors.phone
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-200 bg-white'
              }`}
              placeholder="9876543210"
              maxLength="10"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              className={`mt-2 w-full rounded-lg border px-4 py-2 outline-none ring-blue-300 focus:ring-2 ${
                errors.password
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-200 bg-white'
              }`}
              placeholder="********"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-blue-600">
              Min 8 chars, 1 uppercase letter, 1 number
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => {
                setForm({ ...form, confirmPassword: event.target.value });
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' });
                }
              }}
              className={`mt-2 w-full rounded-lg border px-4 py-2 outline-none ring-blue-300 focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-300 bg-red-50'
                  : 'border-blue-200 bg-white'
              }`}
              placeholder="********"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader small /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-blue-700">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
