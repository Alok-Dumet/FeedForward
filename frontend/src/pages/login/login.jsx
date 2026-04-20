import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";

import {
  createMockSession,
  getDefaultRouteForUserType,
  getUserType,
  inferMockUserType,
  persistMockSession,
} from "../../session.js";

export default function Login() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message ?? "";

  async function handleSubmit(e) {
    e.preventDefault();

    const email = e.currentTarget.elements.email.value;
    const password = e.currentTarget.elements.password.value;
    const normalizedEmail = email.trim().toLowerCase();

    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }

    if (import.meta.env.DEV && normalizedEmail.endsWith("@feedforward.local")) {
      const userType = inferMockUserType(normalizedEmail);

      persistMockSession(
        createMockSession(userType, {
          user: {
            email: normalizedEmail,
          },
        }),
      );

      setError("");
      navigate(getDefaultRouteForUserType(userType), { replace: true });
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await res.json() : null;

      if (!res.ok) {
        if (import.meta.env.DEV && !contentType.includes("application/json")) {
          const userType = inferMockUserType(email);
          const mockSession = createMockSession(userType, {
            user: {
              email,
            },
          });

          persistMockSession(mockSession);
          setError("");
          navigate(getDefaultRouteForUserType(userType), { replace: true });
          return;
        }

        setError(data?.error ?? "Unable to log in");
      } else {
        const userTypeFromLogin = getUserType(data);
        let userType = userTypeFromLogin;

        if (!userType) {
          const sessionRes = await fetch("/api/session", {
            headers: {
              Accept: "application/json",
            },
          });
          const sessionContentType = sessionRes.headers.get("content-type") ?? "";

          if (!sessionRes.ok || !sessionContentType.includes("application/json")) {
            if (import.meta.env.DEV) {
              userType = inferMockUserType(email);
              persistMockSession(
                createMockSession(userType, {
                  user: {
                    email,
                  },
                }),
              );
            } else {
              setError("Unable to load session");
              return;
            }
          } else {
            const sessionData = await sessionRes.json();
            userType = getUserType(sessionData);
          }
        }

        if (import.meta.env.DEV && userType) {
          persistMockSession(
            createMockSession(userType, {
              user: {
                email,
              },
            }),
          );
        }

        setError("");
        navigate(getDefaultRouteForUserType(userType), { replace: true });
      }
    } catch {
      if (import.meta.env.DEV) {
        const userType = inferMockUserType(email);

        persistMockSession(
          createMockSession(userType, {
            user: {
              email,
            },
          }),
        );

        setError("");
        navigate(getDefaultRouteForUserType(userType), { replace: true });
        return;
      }

      setError("Network Error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.section
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

          {message && (
            <p className="text-sm font-medium text-emerald-700">{message}</p>
          )}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
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
      </motion.section>
    </div>
  );
}
