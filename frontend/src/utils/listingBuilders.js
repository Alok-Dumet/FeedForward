import { formatAvailabilityWindows } from "./formatDates.js";
import { formatFoodQuantity, formatNumber, getFoodSummary, getFoodTags, getFoodTitle, getPrimaryFood } from "./foods.js";

//We will reshape one /api/listings record into the card shape that listingPageShell expects
export function buildPublicListingItem(record) {
  const distance =
    typeof record.distance_miles === "number" ? `${formatNumber(record.distance_miles)} mi away` : null;
  const locationLabel = distance
    ? `${record.location.address_text} (${distance})`
    : record.location.address_text;

  return {
    id: record.id,
    title: getFoodTitle(record),
    quantity: formatFoodQuantity(getPrimaryFood(record)),
    availability: formatAvailabilityWindows(record.availability_windows),
    location: locationLabel,
    audience: record.creator.organization_name,
    summary: getFoodSummary(record),
    tags: getFoodTags(record),
  };
}

//We will reshape a /api/my-listings record into the card shape userOffers/userRequests expect
export function buildOwnListingItem(record) {
  const ownership = record.relationship === "own" ? "Posted by you" : "Accepted by you";
  const listingPath = record.listing_type === "offer" ? "offers" : "requests";

  return {
    id: record.id,
    status: record.status,
    title: getFoodTitle(record),
    summary: getFoodSummary(record),
    quantity: formatFoodQuantity(getPrimaryFood(record)),
    availability: formatAvailabilityWindows(record.availability_windows),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    detailsPath: `/${listingPath}/${record.id}?from=my-listings`,
    tags: [ownership, ...getFoodTags(record)],
  };
}
