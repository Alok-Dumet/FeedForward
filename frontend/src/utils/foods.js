export const FOOD_CATEGORY_LABELS = {
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

export function formatFoodCategory(category) {
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

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return value;
  }

  return Number.isInteger(number)
    ? String(number)
    : String(number).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatFoodQuantity(food) {
  return [formatNumber(food?.quantity), food?.quantity_unit].filter(Boolean).join(" ");
}

export function getPrimaryFood(record) {
  return record.foods?.[0] ?? null;
}

export function getFoodTitle(record) {
  const foods = record.foods ?? [];
  const firstFood = foods[0];

  if (!firstFood) {
    return `Listing ${record.id ?? record.listing_id}`;
  }

  return foods.length > 1 ? `${firstFood.name} + ${foods.length - 1} more` : firstFood.name;
}

export function getFoodSummary(record) {
  const foods = record.foods ?? [];
  const describedFood = foods.find((food) => food.description);

  if (foods.length > 1) {
    const names = foods.map((food) => food.name).filter(Boolean).join(", ");
    return describedFood?.description
      ? `${names}. ${describedFood.description}`
      : names;
  }

  return describedFood?.description ?? record.additional_instructions ?? "";
}

export function getFoodTags(record) {
  const foods = record.foods ?? [];
  const categories = foods.map((food) => formatFoodCategory(food.category)).filter(Boolean);
  const hasPerishable = foods.some((food) => food.is_perishable);
  const hasShelfStable = foods.some((food) => food.is_perishable === false);

  return [
    hasPerishable ? "Perishable" : null,
    hasShelfStable ? "Shelf-stable" : null,
    ...new Set(categories),
  ].filter(Boolean);
}
