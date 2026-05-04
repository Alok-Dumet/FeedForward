import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <section className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-12 shadow-2xl">
        <h1 className="text-center text-4xl font-extrabold text-emerald-400 sm:text-6xl">FEED FORWARD</h1>

        <p className="mt-5 max-w-2xl text-center text-base leading-7 text-slate-300 sm:text-lg">Connecting surplus food providers with organizations that can put it to use.</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <div>
            <Link to="/login" className="inline-flex rounded-2xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-500">
              Log In
            </Link>
          </div>

          <div>
            <Link to="/register" className="inline-flex rounded-2xl border-2 border-white/70 bg-white px-8 py-3 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100">
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
