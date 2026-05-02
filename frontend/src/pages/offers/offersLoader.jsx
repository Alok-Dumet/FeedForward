import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatPickupWindow } from "../../utils/formatDates.js";
import {
  getRadiusMiles,
  withDistanceFilteredRecords,
} from "../../utils/distance.js";

const ALL_FILTER = "All offers";
const FOOD_CATEGORY_LABELS = {
  produce: "Produce",
  dairy: "Dairy",
  baked_goods: "Baked Goods",
  canned_goods: "Canned Goods",
  frozen: "Frozen",
  prepared_meals: "Prepared Meals",
  beverages: "Beverages",
  dry_goods: "Dry Goods",
  meat_seafood: "Meat & Seafood",
  snacks: "Snacks",
  baby_food: "Baby Food",
  mixed: "Mixed",
  other: "Other",
};

function formatFoodCategory(category) {
  if (!category) {
    return "";
  }

  return (
    FOOD_CATEGORY_LABELS[category] ??
    category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

//We will reshape one /api/listings record into the card shape that listingPageShell expects
function buildOfferItem(record) {
  const category = formatFoodCategory(record.food.category);
  const storageType = record.food.is_perishable ? "Perishable" : "Shelf-stable";
  const distance =
    typeof record.distance_miles === "number" ? `${record.distance_miles} mi away` : null;

  const locationLabel = distance
    ? `${record.location.address_text} (${distance})`
    : record.location.address_text;

  return {
    id: record.id,
    title: record.food.name,
    category,
    quantity: [record.food.quantity, record.food.quantity_unit].filter(Boolean).join(" "),
    pickupWindow: formatPickupWindow(record.pickup_window_start, record.pickup_window_end),
    location: locationLabel,
    audience: record.creator.organization_name,
    summary: record.food.description ?? record.additional_instructions ?? "",
    tags: [storageType, category].filter(Boolean),
  };
}

export default async function offersLoader({ request }) {
  const payload = await loaderFetch("/api/listings", request, "Unable to load offers.");
  const radiusMiles = getRadiusMiles(request, payload.current_user?.preferred_radius_miles);
  const records = withDistanceFilteredRecords(
    payload.records ?? [],
    payload.current_user,
    radiusMiles,
  );
  const items = records.map(buildOfferItem);
  const realFilters = Array.from(new Set(items.flatMap((item) => item.tags))).sort();

  return {
    filters: items.length > 0 ? [ALL_FILTER, ...realFilters] : [],
    items,
    radiusMiles,
    preferredRadiusMiles: payload.current_user?.preferred_radius_miles ?? null,
  };
}
