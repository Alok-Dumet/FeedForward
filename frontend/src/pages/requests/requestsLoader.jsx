import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatAvailabilityWindows } from "../../utils/formatDates.js";
import {
  getRadiusMiles,
  withDistanceFilteredRecords,
} from "../../utils/distance.js";
import {
  formatFoodQuantity,
  formatNumber,
  getFoodSummary,
  getFoodTags,
  getFoodTitle,
  getPrimaryFood,
} from "../../utils/foods.js";

const ALL_FILTER = "All requests";

//We will reshape one /api/listings record into the card shape that listingPageShell expects
function buildRequestItem(record) {
  const primaryFood = getPrimaryFood(record);
  const distance =
    typeof record.distance_miles === "number" ? `${formatNumber(record.distance_miles)} mi away` : null;

  const locationLabel = distance
    ? `${record.location.address_text} (${distance})`
    : record.location.address_text;

  return {
    id: record.id,
    title: getFoodTitle(record),
    quantity: formatFoodQuantity(primaryFood),
    availability: formatAvailabilityWindows(record.availability_windows),
    location: locationLabel,
    audience: record.creator.organization_name,
    summary: getFoodSummary(record),
    tags: getFoodTags(record),
  };
}

export default async function requestsLoader({ request }) {
  const payload = await loaderFetch("/api/listings", request, "Unable to load requests.");
  const radiusMiles = getRadiusMiles(request);
  const records = withDistanceFilteredRecords(
    payload.records ?? [],
    payload.current_user,
    radiusMiles,
  );
  const items = records.map(buildRequestItem);
  const realFilters = Array.from(new Set(items.flatMap((item) => item.tags))).sort();

  return {
    filters: items.length > 0 ? [ALL_FILTER, ...realFilters] : [],
    items,
    radiusMiles,
  };
}
