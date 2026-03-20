import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <motion.section
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-12 shadow-2xl"
      >
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.25em" }}
          animate={{ opacity: 1, letterSpacing: "0.05em" }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-center text-4xl font-extrabold text-emerald-400 sm:text-6xl"
        >
          FEED FORWARD
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-5 max-w-2xl text-center text-base leading-7 text-slate-300 sm:text-lg"
        >
          Connecting surplus food providers with organizations that can put it
          to use.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/login"
              className="inline-flex rounded-2xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-500"
            >
              Log In
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/register"
              className="inline-flex rounded-2xl border-2 border-white/70 bg-white px-8 py-3 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              Register
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
}
