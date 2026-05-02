import { loaderFetch } from "../../utils/loaderFetch.js";
import {
  formatFoodQuantity,
  getFoodTags,
  getFoodTitle,
  getPrimaryFood,
} from "../../utils/foods.js";

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

//We will turn one /api/history record into the card shape the history page expects
function buildItem(record) {
  const ownership = record.relationship === "own" ? "Posted by you" : "Claimed by you";
  const recordType = record.listing_type === "offer" ? "Offer record" : "Request record";
  const primaryFood = getPrimaryFood(record);

  return {
    id: record.listing_id,
    status: record.status,
    title: getFoodTitle(record),
    summary: record.outcome,
    quantity: formatFoodQuantity(primaryFood),
    timeline: buildTimeline(record),
    location: record.location ?? "Location unavailable",
    recordType,
    tags: [ownership, record.status, recordType, ...getFoodTags(record)],
  };
}

//We will pick the most informative timestamp to show on the card based on the record's final status
function buildTimeline(record) {
  if (record.status === "Completed" && record.claim?.resolved_at) {
    return `Completed on ${formatDate(record.claim.resolved_at)}`;
  }
  if (record.status === "Cancelled" && record.claim?.resolved_at) {
    return `Cancelled on ${formatDate(record.claim.resolved_at)}`;
  }
  if (record.status === "Expired") {
    return `Expired after ${formatDate(record.pickup_window_end)}`;
  }
  return `Posted on ${formatDate(record.created_at)}`;
}

function formatDate(value) {
  if (!value) {
    return "an unknown date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFmt.format(date);
}

export default async function historyLoader({ request }) {
  const payload = await loaderFetch("/api/history", request, "Unable to load history.");

  return {
    filters: payload.filters ?? [],
    items: (payload.records ?? []).map(buildItem),
  };
}
