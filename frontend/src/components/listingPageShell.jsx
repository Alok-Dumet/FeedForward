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
  secondaryAction = null,
  filtersLabel = "Mock filters:",
  hideHero = false,
  lightHeader = false,
}) {
  const {
    eyebrowKey = "category",
    highlightLabel = "Quantity",
    highlightValueKey = "quantity",
    variant = "default",
    metaKey,
    action,
    detailFields = [
      { label: "Pickup Window", key: "pickupWindow" },
      { label: "Location", key: "location" },
      { label: "Best For", key: "audience" },
    ],
  } = cardConfig;

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {!hideHero ? (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={
              lightHeader
                ? "rounded-[2rem] border border-white/70 bg-white/75 px-6 py-6 shadow-xl backdrop-blur-md"
                : "rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                {eyebrow ? (
                  <p
                    className={
                      lightHeader
                        ? "text-sm font-medium tracking-[0.2em] text-amber-700 uppercase"
                        : "text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase"
                    }
                  >
                    {eyebrow}
                  </p>
                ) : null}
                <h1
                  className={
                    lightHeader
                      ? "text-3xl font-bold text-slate-900 sm:text-4xl"
                      : "mt-4 text-4xl font-extrabold sm:text-5xl"
                  }
                >
                  {title}
                </h1>
                <p
                  className={
                    lightHeader
                      ? "mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base"
                      : "mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base"
                  }
                >
                  {description}
                </p>
              </div>

              {secondaryAction ? (
                <Link
                  to={secondaryAction.to}
                  className={
                    lightHeader
                      ? "inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
                      : "inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  }
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>

            {stats.length > 0 ? (
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
            ) : null}
          </motion.section>
        ) : null}

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
              variant={variant}
              eyebrow={item[eyebrowKey]}
              title={item.title}
              metaText={metaKey ? item[metaKey] : undefined}
              summary={item.summary}
              highlightLabel={highlightLabel}
              highlightValue={item[highlightValueKey]}
              action={
                action
                  ? {
                      ...action,
                      to: typeof action.to === "function" ? action.to(item) : action.to,
                    }
                  : undefined
              }
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
