import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { motion } from "motion/react";

//Error page rendered during a route loader action or component render.
//Don't worry it won't trigger for a fetch request inside a page
export default function ErrorCheck() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  //Checks if a router occured
  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data;
  } else message = error.message; //Checks if a normal js error occured

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-lime-100 px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 right-[-60px] h-80 w-80 rounded-full bg-lime-300/30 blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-80px] left-1/3 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl"
          animate={{ x: [0, 10, 0], y: [0, -20, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-12 text-center shadow-2xl">
        <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
          FeedForward
        </p>

        <h1 className="mt-4 text-4xl font-extrabold text-white">{title}</h1>

        <p className="mt-4 text-slate-300">{message}</p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex rounded-2xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-500"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
