// Fetch JSON for route loaders and convert failed responses into React Router errors
export async function loaderFetch(url, request, errorMessage) {
  const res = await fetch(url, {
    signal: request.signal, //We use this to cancel fetches if a user navigates to a different page. Coolio!
    headers: { Accept: 'application/json' },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload) {
    throw new Response(errorMessage, { status: res.status || 500 });
  }

  return payload;
}

// Read radius_miles from the current URL, falling back when the query value is missing or invalid
export function getRadiusMiles(request, fallback = 150) {
  const url = new URL(request.url);
  const urlRadius = Number(url.searchParams.get('radius_miles'));

  if (Number.isFinite(urlRadius) && urlRadius > 0) {
    return urlRadius;
  }

  return fallback;
}

// Calculate the distance between two latitude/longitude points in miles
export function haversineMiles(origin, destination) {
  const originLat = Number(origin.latitude);
  const originLon = Number(origin.longitude);
  const destinationLat = Number(destination.latitude);
  const destinationLon = Number(destination.longitude);

  const lat1 = (originLat * Math.PI) / 180;
  const lat2 = (destinationLat * Math.PI) / 180;
  const deltaLat = ((destinationLat - originLat) * Math.PI) / 180;
  const deltaLon = ((destinationLon - originLon) * Math.PI) / 180;

  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));

  return 3958.8 * c;
}

//Our format for date and time
const timeFmt = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });

const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

// Format a backend time string for display
function formatTime(value) {
  const date = new Date(`2026-01-01T${value}`);
  return timeFmt.format(date);
}

// Turn listing availability entries into a compact schedule for cards and details pages
export function formatAvailabilityWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return 'Availability to be coordinated';
  }

  return windows
    .map((window) => {
      const day = DAY_LABELS[window.day];
      return `${day} ${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
    })
    .join('; ');
}

export const FOOD_CATEGORY_LABELS = {
  produce: 'Produce',
  dairy: 'Dairy',
  baked_goods: 'Baked Goods',
  canned_goods: 'Canned Goods',
  frozen: 'Frozen',
  prepared_meals: 'Prepared Meals',
  beverages: 'Beverages',
  dry_goods: 'Dry Goods',
  meat_seafood: 'Meat & Seafood',
  snacks: 'Snacks',
  baby_food: 'Baby Food',
  mixed: 'Mixed',
  other: 'Other',
};

// Format numeric values to not have trailing zeros if its a while number
export function formatNumber(value) {
  const number = Number(value);
  if (Number.isInteger(number)) {
    return String(number);
  }

  return String(number)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

// Returns the title, summary, tags, and quantity for displaying a listing's foods
export function summarizeFoods(record) {
  const foods = Array.isArray(record.foods) ? record.foods : [];
  const primary = foods[0];
  const describedFood = foods.find((food) => food.description);

  if (!primary) {
    return {
      title: 'Food listing',
      summary: record.additional_instructions ?? '',
      tags: [],
      quantity: 'To be confirmed',
    };
  }

  let title = primary.name;
  if (foods.length > 1) {
    title = `${primary.name} + ${foods.length - 1} more`;
  }

  let summary = '';
  if (foods.length > 1) {
    const names = foods.map((food) => food.name).join(', ');
    summary = names;
    if (describedFood && describedFood.description) {
      summary = `${names}. ${describedFood.description}`;
    }
  } else {
    summary = record.additional_instructions;
    if (describedFood && describedFood.description) {
      summary = describedFood.description;
    }
  }

  const categories = foods.map((food) => FOOD_CATEGORY_LABELS[food.category]);
  const hasPerishable = foods.some((food) => food.is_perishable);
  const hasShelfStable = foods.some((food) => food.is_perishable === false);
  const tags = [...new Set(categories)];
  if (hasShelfStable) {
    tags.unshift('Shelf-stable');
  }
  if (hasPerishable) {
    tags.unshift('Perishable');
  }

  return {
    title,
    summary,
    tags,
    quantity: `${formatNumber(primary.quantity)} ${primary.quantity_unit}`,
  };
}
