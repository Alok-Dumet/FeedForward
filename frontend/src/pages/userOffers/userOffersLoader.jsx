import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatPickupWindow } from "../../utils/formatDates.js";

//We will turn a backend listing record into the card shape userOffers.jsx expects
function buildItem(record) {
  const ownership = record.relationship === "own" ? "Posted by you" : "Claimed by you";

  return {
    id: record.id,
    status: record.status,
    title: record.food.name,
    summary: record.food.description ?? record.additional_instructions ?? "",
    quantity: [record.food.quantity, record.food.quantity_unit].filter(Boolean).join(" "),
    pickupWindow: formatPickupWindow(record.pickup_window_start, record.pickup_window_end),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    tags: [ownership, record.food.is_perishable ? "Perishable" : "Shelf-stable", record.food.category].filter(Boolean),
  };
}

export default async function userOffersLoader({ request }) {
  const payload = await loaderFetch("/api/my-listings", request, "Unable to load your offers.");

  return {
    filters: [],
    items: (payload.records ?? []).map(buildItem),
  };
}
