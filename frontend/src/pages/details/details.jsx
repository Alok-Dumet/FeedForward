import { Link, useLoaderData } from "react-router-dom";
import { motion } from "motion/react";

import DetailFieldGrid from "../../components/detailFieldGrid.jsx";

export default function Details() {
  const { record } = useLoaderData();

  const isOffer = record.type === "offer";
  const typeCopy = isOffer ? "Owned Offer" : "Owned Request";
  const ownerSummary = isOffer
    ? "This page shows one of your active offer records. It is structured for owner review and lightweight management, not public marketplace browsing."
    : "This page shows one of your active request records. It is structured for owner review and lightweight management, not public marketplace browsing.";
  const detailFields = [
    { label: "Category", value: record.category },
    { label: record.quantityLabel, value: record.quantityValue },
    { label: record.timingLabel, value: record.timingValue },
    { label: record.locationLabel, value: record.locationValue },
    { label: record.audienceLabel, value: record.audienceValue },
    { label: "Record ID", value: record.id },
  ];

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
                My Record Details
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{record.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {ownerSummary}
              </p>
            </div>

            <Link
              to={isOffer ? "/offers" : "/requests"}
              className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to {isOffer ? "Offers" : "Requests"}
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Type
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{typeCopy}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Status
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{record.status}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Updated
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{record.updatedDate}</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-6 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-amber-800 uppercase">
              {typeCopy}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
              {record.status}
            </span>
            <span className="text-sm font-medium text-slate-500">
              Created {record.createdDate}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
          className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
                Record Overview
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Item and scheduling details
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">{record.summary}</p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold tracking-[0.15em] text-emerald-700 uppercase">
                {record.quantityLabel}
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-900">
                {record.quantityValue}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <DetailFieldGrid fields={detailFields} />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4, ease: "easeOut" }}
          className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]"
        >
          <article className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
              Owner Notes
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Internal details for this record
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {record.notes}
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
              Owner Actions
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Manage this record</h2>
            <div className="mt-5 flex flex-col gap-3">
              {record.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        </motion.section>
      </div>
    </main>
  );
}
