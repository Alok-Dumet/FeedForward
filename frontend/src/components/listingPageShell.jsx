import { Link } from "react-router-dom";
import { motion } from "motion/react";

import ListingCard from "./listingCard.jsx";

export default function ListingPageShell({
  eyebrow,
  title,
  description,
  items,
  filters = [],
  stats = [],
  cardConfig = {},
  secondaryAction = { label: "Back to Home", to: "/home" },
  filtersLabel = "Mock filters:",
}) {
  const {
    eyebrowKey = "category",
    highlightLabel = "Quantity",
    highlightValueKey = "quantity",
    detailFields = [
      { label: "Pickup Window", key: "pickupWindow" },
      { label: "Location", key: "location" },
      { label: "Best For", key: "audience" },
    ],
  } = cardConfig;

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
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {description}
              </p>
            </div>

            <Link
              to={secondaryAction.to}
              className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {secondaryAction.label}
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">{filtersLabel}</span>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.section>

        <section className="grid gap-5">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              eyebrow={item[eyebrowKey]}
              title={item.title}
              summary={item.summary}
              highlightLabel={highlightLabel}
              highlightValue={item[highlightValueKey]}
              detailItems={detailFields.map((field) => ({
                label: field.label,
                value: item[field.key],
              }))}
              tags={item.tags}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
