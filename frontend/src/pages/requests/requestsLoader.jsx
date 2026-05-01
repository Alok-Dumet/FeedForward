import { loaderFetch } from "../../utils/loaderFetch.js";
import { formatPickupWindow } from "../../utils/formatDates.js";

const ALL_FILTER = "All requests";
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
function buildRequestItem(record) {
  const category = formatFoodCategory(record.food.category);
  const storageType = record.food.is_perishable ? "Perishable" : "Shelf-stable";

  return {
    id: record.id,
    title: record.food.name,
    category,
    quantity: [record.food.quantity, record.food.quantity_unit].filter(Boolean).join(" "),
    neededBy: formatPickupWindow(record.pickup_window_start, record.pickup_window_end),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    summary: record.food.description ?? record.additional_instructions ?? "",
    tags: [storageType, category].filter(Boolean),
  };
}

export default async function requestsLoader({ request }) {
  const payload = await loaderFetch("/api/listings", request, "Unable to load requests.");
  const items = (payload.records ?? []).map(buildRequestItem);
  const realFilters = Array.from(new Set(items.flatMap((item) => item.tags))).sort();

  return {
    filters: items.length > 0 ? [ALL_FILTER, ...realFilters] : [],
    items,
  };
}
