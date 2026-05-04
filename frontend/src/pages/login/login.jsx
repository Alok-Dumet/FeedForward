import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

import { DEFAULT_ROUTE_BY_ROLE, parseSession, useSessionActions } from '../../session.js';
import { useToast } from '../../components/toast.jsx';
import TextInput from '../../components/textInput.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  let message = '';
  if (location.state) {
    message = location.state.message ?? '';
  }
  const { setSession } = useSessionActions();
  const { showToast } = useToast();

  useEffect(() => {
    if (!message) {
      return;
    }

    showToast(message, 'success');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, message, navigate, showToast]);

  //We will submit credentials to /api/login, then read /api/session to determine where to redirect
  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.currentTarget.elements.email.value;
    const password = e.currentTarget.elements.password.value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        let errorMessage = 'Unable to log in';
        if (data && data.error) {
          errorMessage = data.error;
        }

        showToast(errorMessage, 'error');
        return;
      }

      const sessionRes = await fetch('/api/session', {
        headers: { Accept: 'application/json' },
      });
      let session = data;
      if (sessionRes.ok) {
        session = await sessionRes.json();
      }

      const { role } = parseSession(session);

      if (!role) {
        showToast('Unable to determine account type', 'error');
        return;
      }

      setSession(session);
      navigate(DEFAULT_ROUTE_BY_ROLE[role] ?? '/login', {
        replace: true,
      });
    } catch {
      showToast('Network Error', 'error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <p className="brand-label">FeedForward</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Log in</h1>
          <p className="mt-2 text-sm text-slate-600">Welcome back. Sign in to continue.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <TextInput label="Email" name="email" type="email" autoComplete="email" />
          <TextInput label="Password" name="password" type="password" autoComplete="current-password" />

          <button type="submit" className="btn-primary w-full px-4 py-3">
            Log In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-amber-700 hover:text-amber-800">
            Register
          </Link>
        </div>
      </section>
    </div>
  );
}
