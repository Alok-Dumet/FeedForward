import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatAvailabilityWindows } from "../../utils/formatDates.js";
import {
  formatFoodQuantity,
  getFoodSummary,
  getFoodTags,
  getFoodTitle,
  getPrimaryFood,
} from "../../utils/foods.js";

//We will turn a backend listing record into the card shape userOffers.jsx expects
function buildItem(record) {
  const ownership = record.relationship === "own" ? "Posted by you" : "Claimed by you";
  const primaryFood = getPrimaryFood(record);

  return {
    id: record.id,
    status: record.status,
    title: getFoodTitle(record),
    summary: getFoodSummary(record),
    quantity: formatFoodQuantity(primaryFood),
    availability: formatAvailabilityWindows(record.availability_windows),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    tags: [ownership, ...getFoodTags(record)],
  };
}

export default async function userOffersLoader({ request }) {
  const payload = await loaderFetch("/api/my-listings", request, "Unable to load your offers.");

  return {
    filters: [],
    items: (payload.records ?? []).map(buildItem),
  };
}
