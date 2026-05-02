import { Link, useLoaderData } from "react-router-dom";
import { motion as Motion } from "motion/react";

import FormField from "../../components/formField.jsx";

export default function UserRequestCreate() {
  const { user } = useLoaderData();

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
                Create Request
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                Add a new request for {user.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Use this owner-facing form to prepare a new request record. The page is
                UI-only for now, but the field structure is intentionally simple so it
                can connect to backend creation later without rework.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/users/${user.id}/requests`}
                className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Back to My Requests
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
          className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]"
        >
          <form className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
              Request Form
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Need and delivery details
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Fill in the operational details for this request. All actions on this
              page are UI-only placeholders for now.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                label="Request title"
                hint="Use a short label that helps your team identify the need quickly."
              >
                <input
                  type="text"
                  placeholder="Weekend pantry produce request"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Need category">
                <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300">
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  <option value="baked_goods">Baked Goods</option>
                  <option value="canned_goods">Canned Goods</option>
                  <option value="frozen">Frozen</option>
                  <option value="prepared_meals">Prepared Meals</option>
                  <option value="beverages">Beverages</option>
                  <option value="dry_goods">Dry Goods</option>
                  <option value="meat_seafood">Meat & Seafood</option>
                  <option value="snacks">Snacks</option>
                  <option value="baby_food">Baby Food</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField
                label="Needed quantity"
                hint="Examples: 35 meals, 22 produce boxes, 18 kits."
              >
                <input
                  type="text"
                  placeholder="22 produce boxes"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Needed by">
                <input
                  type="text"
                  placeholder="Saturday, before 11:00 AM"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Service area">
                <input
                  type="text"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Who is this for?">
                <input
                  type="text"
                  placeholder="Families picking up weekly groceries"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="Request summary"
                hint="Describe the need in a way that helps internal review and future matching."
              >
                <textarea
                  rows="5"
                  placeholder="Volunteers are preparing produce tables for a Saturday distribution focused on households with children and older adults."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField
                label="Coordination notes"
                hint="Optional notes for delivery timing, packing constraints, or on-site handling."
              >
                <textarea
                  rows="4"
                  placeholder="Volunteers can sort produce on site. Firm items are preferred if pickup timing changes."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Publish request
              </button>
              <Link
                to={`/users/${user.id}/requests`}
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
                What to include in this request
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Be explicit about the quantity needed so future matching is easier.</li>
                <li>Use the timing field to show urgency or delivery coordination needs.</li>
                <li>Use notes for operational constraints rather than broad outreach copy.</li>
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
                  Not submitted
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
                  Owner-facing only
                </span>
              </div>
            </article>
          </div>
        </Motion.section>
      </div>
    </main>
  );
}
