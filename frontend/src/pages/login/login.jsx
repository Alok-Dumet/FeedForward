import { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion as Motion } from "motion/react";

import { getDefaultRouteForUserType, parseSession } from "../../session.js";
import { useSessionActions } from "../../hooks/useSession.js";
import { useToast } from "../../hooks/useToast.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message ?? "";
  const { setSession } = useSessionActions();
  const { showToast } = useToast();

  useEffect(() => {
    if (!message) {
      return;
    }

    showToast(message, "success");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, message, navigate, showToast]);

  //We will submit credentials to /api/login, then read /api/session to determine where to redirect
  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.currentTarget.elements.email.value;
    const password = e.currentTarget.elements.password.value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data?.error ?? "Unable to log in", "error");
        return;
      }

      const sessionRes = await fetch("/api/session", {
        headers: { Accept: "application/json" },
      });
      const session = sessionRes.ok ? await sessionRes.json() : data;
      const { userType } = parseSession(session);

      if (!userType) {
        showToast("Unable to determine account type", "error");
        return;
      }

      setSession(session);
      navigate(getDefaultRouteForUserType(userType), {
        replace: true,
      });
    } catch {
      showToast("Network Error", "error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-amber-700 uppercase">
            FeedForward
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Log in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back. Sign in to continue.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-amber-700 hover:text-amber-800"
          >
            Register
          </Link>
        </div>
      </Motion.section>
    </div>
  );
}
