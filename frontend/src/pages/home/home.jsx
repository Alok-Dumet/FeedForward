import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function Home() {
  const { user } = useLoaderData();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      const res = await fetch("/api/logout", {
        method: "POST"
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to log out");
        return;
      }

      setError("");
      navigate("/login");
    } catch {
      setError("Network Error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur-md"
      >
        <p className="text-sm font-medium tracking-[0.2em] text-amber-700 uppercase">
          FeedForward
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Signed in successfully
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This page is now using `/api/session` to confirm that your session
          cookie is valid and to load the current user from the backend.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-100 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
              Email
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {user.email}
            </p>
          </div>

          <div className="rounded-3xl bg-slate-100 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
              Role
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {user.role}
            </p>
          </div>

          <div className="rounded-3xl bg-slate-100 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
              Organization
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {user.organization_name}
            </p>
          </div>

        </div>

        {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Log Out
          </button>

          <a
            href="/api/session"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
          >
            View Session JSON
          </a>
        </div>
      </motion.section>
    </main>
  );
}
