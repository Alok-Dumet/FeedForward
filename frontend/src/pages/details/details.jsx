import { useState } from "react";
import { Link, useLoaderData } from "react-router-dom";

import { formatPickupWindow } from "../../utils/formatDates.js";

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function humanize(value) {
  if (!value) {
    return "To be confirmed";
  }

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) {
    return "To be confirmed";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFmt.format(date);
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "To be confirmed"}</dd>
    </div>
  );
}

export default function Details() {
  const { page, record } = useLoaderData();
  const quantity =
    [record.food?.quantity, record.food?.quantity_unit].filter(Boolean).join(" ") ||
    "To be confirmed";
  const [status, setStatus] = useState(record.status);
  const [claimState, setClaimState] = useState({ status: "idle", message: "" });

  const isOffer = record.type === "offer";
  const isRequest = record.type === "request";
  const isHistory = page.backTo === "/history";
  const isOwnListing = record.current_user?.id === record.creator_user_id;
  const canAccept = !isHistory && status === "available" && !isOwnListing;
  const claimPending = claimState.status === "submitting";

  async function handleAcceptListing() {
    setClaimState({ status: "submitting", message: "" });

    try {
      const res = await fetch("/api/listings/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: record.id,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setClaimState({
          status: "error",
          message: data?.error ?? "Unable to update this listing.",
        });
        return;
      }

      setStatus("claimed");
      setClaimState({
        status: "success",
        message: isOffer ? "Offer accepted." : "Request response recorded.",
      });
    } catch {
      setClaimState({ status: "error", message: "Network error." });
    }
  }

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-amber-700 uppercase">
                {page.sectionLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {record.food?.name ?? `Listing ${record.id}`}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {humanize(record.type)} #{record.id}
              </p>
            </div>

            <Link
              to={page.backTo}
              className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              Back to {page.backLabel}
            </Link>
          </div>

          {!isHistory ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={handleAcceptListing}
                disabled={!canAccept || claimPending}
                className="inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {claimPending ? "Working..." : isOffer ? "Accept Offer" : "Respond to Request"}
              </button>
              {isOwnListing ? (
                <p className="mt-2 text-sm text-slate-600">
                  You created this listing, so it cannot be accepted from this view.
                </p>
              ) : null}
              {!isOwnListing && status !== "available" ? (
                <p className="mt-2 text-sm text-slate-600">
                  This listing is no longer available.
                </p>
              ) : null}
              {claimState.message ? (
                <p
                  className={`mt-2 text-sm font-medium ${
                    claimState.status === "error" ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {claimState.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">Food Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField label="Quantity" value={quantity} />
            <DetailField label="Category" value={humanize(record.food?.category)} />
            <DetailField
              label="Handling"
              value={record.food?.is_perishable ? "Perishable" : "Shelf-stable"}
            />
            <DetailField
              label="Expiration Date"
              value={formatDate(record.food?.expiration_date)}
            />
          </dl>

          {record.food?.description ? (
            <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Description
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {record.food.description}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Pickup and Coordination
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField
              label={isRequest ? "Needed By" : "Pickup Window"}
              value={formatPickupWindow(record.pickup_window_start, record.pickup_window_end)}
            />
            <DetailField label="Address" value={record.location?.address_text} />
            <DetailField
              label="Travel Distance"
              value={`${record.travel_distance_miles ?? 0} miles`}
            />
            <DetailField
              label="Discard Deadline"
              value={formatDate(record.discard_deadline)}
            />
          </dl>

          {record.additional_instructions ? (
            <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Instructions
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {record.additional_instructions}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">Listing Information</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField
              label={isOffer ? "Provider Organization" : "Requesting Organization"}
              value={record.creator?.organization_name}
            />
            <DetailField label="Status" value={humanize(status)} />
            <DetailField label="Created" value={formatDate(record.created_at)} />
            <DetailField label="Last Updated" value={formatDate(record.updated_at)} />
          </dl>
        </section>
      </div>
    </main>
  );
}
