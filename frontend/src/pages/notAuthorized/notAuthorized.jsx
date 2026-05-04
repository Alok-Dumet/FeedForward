import { Link } from 'react-router-dom';
import { motion as Motion } from 'motion/react';

import { useSession } from '../../session.js';

export default function NotAuthorized() {
  const { defaultRoute, isAuthenticated } = useSession();
  let actionPath = '/login';
  let actionLabel = 'Log in';
  if (isAuthenticated) {
    actionPath = defaultRoute;
    actionLabel = 'Back to listings';
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-md"
      >
        <p className="text-sm font-medium tracking-[0.2em] text-amber-700 uppercase">FeedForward</p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">Not Authorized</h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">You do not have permission to view this page.</p>

        <div className="mt-8">
          <Link to={actionPath} className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            {actionLabel}
          </Link>
        </div>
      </Motion.section>
    </main>
  );
}
