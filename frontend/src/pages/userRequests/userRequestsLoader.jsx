import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatPickupWindow } from "../../utils/formatDates.js";
import {
  formatFoodQuantity,
  getFoodSummary,
  getFoodTags,
  getFoodTitle,
  getPrimaryFood,
} from "../../utils/foods.js";

//We will turn a backend listing record into the card shape userRequests.jsx expects
function buildItem(record) {
  const ownership = record.relationship === "own" ? "Posted by you" : "Claimed by you";
  const primaryFood = getPrimaryFood(record);

  return {
    id: record.id,
    status: record.status,
    title: getFoodTitle(record),
    summary: getFoodSummary(record),
    quantity: formatFoodQuantity(primaryFood),
    neededBy: formatPickupWindow(record.pickup_window_start, record.pickup_window_end),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    tags: [ownership, ...getFoodTags(record)],
  };
}

export default async function userRequestsLoader({ request }) {
  const payload = await loaderFetch("/api/my-listings", request, "Unable to load your requests.");

  return {
    filters: [],
    items: (payload.records ?? []).map(buildItem),
  };
}
