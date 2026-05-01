import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatPickupWindow } from "../../utils/formatDates.js";

//We will reshape one /api/listings record into the card shape that listingPageShell expects
function buildRequestItem(record) {
  return {
    id: record.id,
    title: record.food.name,
    category: record.food.category,
    quantity: [record.food.quantity, record.food.quantity_unit].filter(Boolean).join(" "),
    neededBy: formatPickupWindow(record.pickup_window_start, record.pickup_window_end),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    summary: record.food.description ?? record.additional_instructions ?? "",
    tags: [record.food.is_perishable ? "Perishable" : "Shelf-stable", record.food.category].filter(Boolean),
  };
}

export default async function requestsLoader({ request }) {
  const payload = await loaderFetch("/api/listings", request, "Unable to load requests.");

  return {
    filters: [],
    items: (payload.records ?? []).map(buildRequestItem),
  };
}
