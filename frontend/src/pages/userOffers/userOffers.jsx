import { Link, useLoaderData } from "react-router-dom";
import { motion } from "motion/react";

import ListingCard from "../../components/listingCard.jsx";

export default function UserOffers() {
  const { user, stats, filters, items } = useLoaderData();

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
                My Offers
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                {user.name}&apos;s offer records
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                This page shows the offers owned by this user account. It is designed
                for tracking, updating, and reviewing personal records rather than
                browsing the public marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/home"
                className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Back to Home
              </Link>
              <button
                type="button"
                className="inline-flex rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
              >
                Create new offer
              </button>
            </div>
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
          className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-6 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-amber-800 uppercase">
              {user.role}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-700 uppercase">
              User ID {user.id}
            </span>
            <span className="text-sm font-medium text-slate-500">
              Operating area {user.location}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Offer states:</span>
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
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.4, ease: "easeOut" }}
              className="grid gap-4"
            >
              <ListingCard
                eyebrow={item.status}
                title={item.title}
                summary={item.summary}
                highlightLabel="Quantity"
                highlightValue={item.quantity}
                detailItems={[
                  { label: "Pickup Window", value: item.pickupWindow },
                  { label: "Location", value: item.location },
                  { label: "Best For", value: item.audience },
                ]}
                tags={item.tags}
              />

              <div className="flex flex-wrap gap-3 px-2">
                <Link
                  to="/details"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
                >
                  View details
                </Link>
                <button
                  type="button"
                  className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
                >
                  Edit offer
                </button>
              </div>
            </motion.div>
          ))}
        </section>
      </div>
    </main>
  );
}
