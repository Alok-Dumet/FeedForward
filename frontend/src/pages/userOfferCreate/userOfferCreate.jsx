import { Link, useLoaderData } from "react-router-dom";
import { motion } from "motion/react";

import FormField from "../../components/formField.jsx";

export default function UserOfferCreate() {
  const { user } = useLoaderData();

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
                Create Offer
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                Add a new offer for {user.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Use this owner-facing form to stage a new food offer record. The UI is
                intentionally frontend-only for now, but the field structure is kept
                straightforward so it can connect to backend submission later.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/users/${user.id}/offers`}
                className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Back to My Offers
              </Link>
              <button
                type="button"
                className="inline-flex rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
              >
                Save draft
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Owner
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{user.name}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Role
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{user.role}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">
                Default Area
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{user.location}</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
          className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]"
        >
          <form className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
              Offer Form
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Food and pickup details
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Fill in the operational details for this offer. All actions on this page
              are UI-only placeholders for now.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                label="Offer title"
                hint="Use a short name that makes the item easy to identify later."
              >
                <input
                  type="text"
                  placeholder="Prepared lunch trays"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Category">
                <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300">
                  <option>Prepared meals</option>
                  <option>Bakery</option>
                  <option>Produce</option>
                  <option>Dairy</option>
                </select>
              </FormField>

              <FormField
                label="Quantity"
                hint="Examples: 24 servings, 8 trays, 6 boxes."
              >
                <input
                  type="text"
                  placeholder="24 servings"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Pickup window">
                <input
                  type="text"
                  placeholder="Today, 5:30 PM - 7:00 PM"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Location">
                <input
                  type="text"
                  defaultValue={user.location}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Best for">
                <input
                  type="text"
                  placeholder="Shelters and mutual-aid groups"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="Offer summary"
                hint="Add the core details someone on your team would need when reviewing this record."
              >
                <textarea
                  rows="5"
                  placeholder="Freshly prepared rice bowls and roasted vegetables packaged after lunch service."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="Handling notes"
                hint="Optional notes for pickup coordination, storage, or packaging."
              >
                <textarea
                  rows="4"
                  placeholder="Stored warm until 5:00 PM, then transferred to insulated carriers."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Publish offer
              </button>
              <button
                type="button"
                className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
              >
                Save as draft
              </button>
              <Link
                to={`/users/${user.id}/offers`}
                className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="grid gap-5">
            <article className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
              <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
                Helper Notes
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                What to include in this draft
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Use the title and quantity fields to make internal review faster.</li>
                <li>Keep the pickup window specific enough for future matching logic.</li>
                <li>Use notes for handling constraints, not for public marketing copy.</li>
              </ul>
            </article>

            <article className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
              <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
                Preview State
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Intended record status
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-700 uppercase">
                  Draft until submitted
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
                  Owner-facing only
                </span>
              </div>
            </article>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
