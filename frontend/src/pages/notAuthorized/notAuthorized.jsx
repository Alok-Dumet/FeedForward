import { Link, useRouteLoaderData } from "react-router-dom";
import { motion } from "motion/react";

import { getDefaultRouteForUserType, getUserType } from "../../session.js";

const ROLE_DISPLAY_NAMES = {
  donor: "Food Provider",
  recipient: "Recipient Organization",
};

export default function NotAuthorized() {
  const session = useRouteLoaderData("root");
  const userType = getUserType(session);
  const defaultRoute = getDefaultRouteForUserType(userType);

  const otherRole = userType === "donor" ? "recipient" : "donor";
  const requiredRoleName = ROLE_DISPLAY_NAMES[otherRole] ?? "a different role";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-md"
      >
        <p className="text-sm font-medium tracking-[0.2em] text-amber-700 uppercase">
          FeedForward
        </p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Not Authorized
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          This page is only available to users with the{" "}
          <span className="font-semibold text-slate-900">{requiredRoleName}</span>{" "}
          role.
        </p>

        <div className="mt-8">
          <Link
            to={defaultRoute}
            className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to your dashboard
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
