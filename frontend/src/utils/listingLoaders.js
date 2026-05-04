import { getRadiusMiles, withDistanceFilteredRecords } from './distance.js';
import { FOOD_CATEGORY_LABELS } from './foods.js';
import {
  buildOwnListingItem,
  buildPublicListingItem,
} from './listingBuilders.js';
import { loaderFetch } from './loaderFetch.js';

function getListingFilters(allFilterLabel) {
  return [
    allFilterLabel,
    'Perishable',
    'Shelf-stable',
    ...Object.values(FOOD_CATEGORY_LABELS),
  ];
}

export function createPublicListingsLoader({ allFilterLabel, errorMessage }) {
  return async function publicListingsLoader({ request }) {
    const payload = await loaderFetch('/api/listings', request, errorMessage);
    const radiusMiles = getRadiusMiles(request);
    const records = withDistanceFilteredRecords(
      payload.records ?? [],
      payload.current_user,
      radiusMiles
    );
    const items = records.map(buildPublicListingItem);

    return {
      filters: getListingFilters(allFilterLabel),
      items,
      radiusMiles,
    };
  };
}

export function createUserListingsLoader(errorMessage) {
  return async function userListingsLoader({ request }) {
    const payload = await loaderFetch(
      '/api/my-listings',
      request,
      errorMessage
    );

    return {
      items: (payload.records ?? []).map(buildOwnListingItem),
    };
  };
}
