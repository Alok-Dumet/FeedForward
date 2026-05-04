import { redirect } from 'react-router-dom';

import { parseSession } from '../session.js';
import { FOOD_CATEGORY_LABELS, formatAvailabilityWindows, formatNumber, getRadiusMiles, haversineMiles, loaderFetch, summarizeFoods } from './format.js';

//We will reuse these filter labels on the current user's listings pages
export const MY_LISTINGS_FILTERS = ['All listings', 'Posted by you', 'Claimed by you'];

//We will use this as the blank food item when creating or editing listings
export const EMPTY_FOOD = {
  name: '',
  description: '',
  category: 'produce',
  is_perishable: false,
  quantity: '',
  quantity_unit: '',
  expiration_date: '',
};

//We will use this as the blank availability window when creating or editing listings
export const EMPTY_AVAILABILITY_WINDOW = {
  day: 'monday',
  start_time: '09:00',
  end_time: '17:00',
};

//We will reshape one public listing record into the card shape that listingPageShell expects
function buildPublicListingItem(record) {
  const distance = `${formatNumber(record.distance_miles)} mi away`;
  const summary = summarizeFoods(record);

  return {
    id: record.id,
    title: summary.title,
    summary: summary.summary,
    quantity: summary.quantity,
    tags: summary.tags,
    availability: formatAvailabilityWindows(record.availability_windows),
    location: `${record.location.address_text} (${distance})`,
    audience: record.creator.organization_name,
  };
}

//We will reshape a current-user listing record into the card shape userOffers/userRequests expect
function buildOwnListingItem(record) {
  let ownership = 'Claimed by you';
  if (record.relationship === 'own') {
    ownership = 'Posted by you';
  }

  let listingPath = 'requests';
  if (record.listing_type === 'offer') {
    listingPath = 'offers';
  }

  const summary = summarizeFoods(record);

  return {
    id: record.id,
    status: record.status,
    title: summary.title,
    summary: summary.summary,
    quantity: summary.quantity,
    availability: formatAvailabilityWindows(record.availability_windows),
    location: record.location.address_text,
    audience: record.creator.organization_name,
    detailsPath: `/${listingPath}/${record.id}?from=my-listings`,
    tags: [ownership],
  };
}

//We will create a loader for public offers or requests pages
export function createPublicListingsLoader({ allFilterLabel, errorMessage }) {
  return async function publicListingsLoader({ request }) {
    const payload = await loaderFetch('/api/listings', request, errorMessage);
    const radiusMiles = getRadiusMiles(request);
    const origin = {
      latitude: payload.current_user.latitude,
      longitude: payload.current_user.longitude,
    };

    //We will compute distance for each record, drop ones outside the radius, then sort nearest-first
    const records = (payload.records ?? [])
      .map((record) => {
        const distance = haversineMiles(origin, record.location);
        return {
          ...record,
          distance_miles: Math.round(distance * 10) / 10,
        };
      })
      .filter((record) => record.distance_miles <= radiusMiles)
      .sort((a, b) => a.distance_miles - b.distance_miles);

    return {
      filters: [allFilterLabel, 'Perishable', 'Shelf-stable', ...Object.values(FOOD_CATEGORY_LABELS)],
      items: records.map(buildPublicListingItem),
      radiusMiles,
    };
  };
}

//We will create a loader for the current user's own listing pages
export function createUserListingsLoader(errorMessage) {
  return async function userListingsLoader({ request }) {
    const payload = await loaderFetch('/api/listings?scope=mine', request, errorMessage);
    return {
      items: (payload.records ?? []).map(buildOwnListingItem),
    };
  };
}

//We will load data for /users/:id/{offers|requests}/create and reject mismatched user ids
export async function userListingCreateLoader({ params }, session) {
  const { userId, organizationName } = parseSession(session);
  let user = {};
  if (session && session.user) {
    user = session.user;
  }

  if (params.id !== userId) {
    return redirect('/not_authorized');
  }

  return {
    user: {
      id: userId,
      name: organizationName,
      address_text: user.address_text,
      latitude: user.latitude,
      longitude: user.longitude,
    },
  };
}
