// function formatDateTime(value) {
//   if (!value) {
//     return "Unknown";
//   }

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return value;
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   }).format(date);
// }

// function buildTimeline(record) {
//   if (record.status === "Completed" && record.claim?.resolved_at) {
//     return `Completed on ${formatDateTime(record.claim.resolved_at)}`;
//   }

//   if (record.status === "Cancelled" && record.claim?.resolved_at) {
//     return `Cancelled on ${formatDateTime(record.claim.resolved_at)}`;
//   }

//   if (record.status === "Claimed" && record.claim?.claimed_at) {
//     return `Claimed on ${formatDateTime(record.claim.claimed_at)}`;
//   }

//   if (record.status === "Expired") {
//     return `Expired after ${formatDateTime(record.pickup_window_end)}`;
//   }

//   return `Posted on ${formatDateTime(record.created_at)}`;
// }

// export default async function historyLoader({ request }) {
//   const res = await fetch("/api/history", {
//     signal: request.signal,
//     headers: {
//       Accept: "application/json",
//     },
//   });

//   const payload = await res.json().catch(() => null);

//   if (!res.ok || !payload) {
//     throw new Response("Unable to load history.", { status: res.status || 500 });
//   }

//   return {
//     filters: payload.filters ?? [],
//     items: (payload.records ?? []).map((record) => ({
//       id: record.listing_id,
//       status: record.status,
//       title: record.food_description ?? record.food_name ?? `Listing ${record.listing_id}`,
//       quantity: [record.quantity, record.quantity_unit].filter(Boolean).join(" "),
//       timeline: buildTimeline(record),
//       location: record.location ?? "Location unavailable",
//       recordType: record.listing_type === "offer" ? "Offer record" : "Request record",
//       summary: record.outcome,
//       tags: [record.listing_type, record.status].map((value) =>
//         value.charAt(0).toUpperCase() + value.slice(1)
//       ),
//     })),
//   };
// }

export default async function historyLoader() {
  return {
    filters: [
      "All records",
      "Completed",
      "Expired",
      "Canceled",
      "Last 30 days",
    ],
    stats: [
      { label: "Archived Records", value: "18" },
      { label: "Completed This Month", value: "9" },
      { label: "Inactive Requests", value: "4" },
    ],
    items: [
      {
        id: "history-1",
        status: "Completed",
        title: "Prepared lunch trays",
        quantity: "24 servings",
        timeline: "Completed on April 2, 2026",
        location: "Downtown Brooklyn",
        recordType: "Offer record",
        summary:
          "This offer was matched and picked up successfully after lunch service. It is now stored as a past record for review only.",
        tags: ["Offer", "Same day", "Archived"],
      },
      {
        id: "history-2",
        status: "Expired",
        title: "Weekend pantry produce request",
        quantity: "22 produce boxes",
        timeline: "Expired on March 28, 2026",
        location: "South Bronx",
        recordType: "Request record",
        summary:
          "This request passed its needed-by window before a final match was confirmed and has been moved into the inactive archive.",
        tags: ["Request", "Time-sensitive", "Inactive"],
      },
      {
        id: "history-3",
        status: "Canceled",
        title: "Shelter breakfast restock",
        quantity: "18 breakfast kits",
        timeline: "Canceled on March 21, 2026",
        location: "Harlem",
        recordType: "Request record",
        summary:
          "The request was canceled by the owner after internal inventory changed and alternate breakfast supplies became available.",
        tags: ["Request", "Canceled", "Archived"],
      },
      {
        id: "history-4",
        status: "Archived",
        title: "Bakery recovery boxes",
        quantity: "8 crates",
        timeline: "Archived on March 17, 2026",
        location: "Lower Manhattan",
        recordType: "Offer record",
        summary:
          "This completed bakery offer remains available in history for reference, reporting, and future operational planning.",
        tags: ["Offer", "Completed", "Reference"],
      },
    ],
  };
}