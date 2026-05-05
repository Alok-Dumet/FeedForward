import { Link } from 'react-router-dom';

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
      <section className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-md">
        <p className="brand-label">FeedForward</p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">Not Authorized</h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">You do not have permission to view this page.</p>

        <div className="mt-8">
          <Link to={actionPath} className="btn-primary inline-flex px-6 py-3 text-sm">
            {actionLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
