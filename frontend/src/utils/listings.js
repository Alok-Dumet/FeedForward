import { redirect } from 'react-router-dom';

import { parseSession } from '../session.js';
import { FOOD_CATEGORY_LABELS, formatAvailabilityWindows, formatNumber, getRadiusMiles, haversineMiles, loaderFetch, summarizeFoods } from './format.js';

export const MY_LISTINGS_FILTERS = ['All listings', 'Posted by you', 'Claimed by you'];

export const EMPTY_FOOD = {
  name: '',
  description: '',
  category: 'produce',
  is_perishable: false,
  quantity: '',
  quantity_unit: '',
  expiration_date: '',
};

export const EMPTY_AVAILABILITY_WINDOW = {
  day: 'monday',
  start_time: '09:00',
  end_time: '17:00',
};

export const DAY_OPTIONS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export function getTrimmedFood(food) {
  return {
    name: food.name.trim(),
    description: food.description.trim(),
    category: food.category,
    is_perishable: food.is_perishable,
    quantity: food.quantity,
    quantity_unit: food.quantity_unit.trim(),
    expiration_date: food.expiration_date,
  };
}

//We will reshape one public listing record into the card shape that listingPageShell expects
export function buildPublicListingItem(record) {
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
export function buildOwnListingItem(record) {
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

export function formatHistoryStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

const historyDateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

function formatHistoryDate(value) {
  const date = new Date(value);
  return historyDateFmt.format(date);
}

//We will reshape one history listing record into the card shape the history page expects
export function buildHistoryItem(record) {
  let ownership = 'Claimed by you';
  if (record.relationship === 'own') {
    ownership = 'Posted by you';
  }

  let recordType = 'Request record';
  if (record.listing_type === 'offer') {
    recordType = 'Offer record';
  }

  const status = formatHistoryStatus(record.status);
  let timeline = `Posted on ${formatHistoryDate(record.created_at)}`;
  if (['completed', 'cancelled'].includes(record.status)) {
    let resolvedAt = record.updated_at;
    if (record.claim && record.claim.resolved_at) {
      resolvedAt = record.claim.resolved_at;
    }

    timeline = `${status} on ${formatHistoryDate(resolvedAt)}`;
  }

  const summary = summarizeFoods(record);

  return {
    id: record.listing_id,
    status,
    title: summary.title,
    summary: '',
    quantity: summary.quantity,
    timeline,
    location: record.location,
    recordType,
    tags: [ownership, status],
  };
}

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

export function createUserListingsLoader(errorMessage) {
  return async function userListingsLoader({ request }) {
    const payload = await loaderFetch('/api/listings?scope=mine', request, errorMessage);
    return {
      items: (payload.records ?? []).map(buildOwnListingItem),
    };
  };
}

//We will build a loader for /users/:id/{offers|requests}/create that rejects mismatched user ids
export function createUserListingLoader(roleLabel) {
  return async function loader({ params }, session) {
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
        role: roleLabel,
        address_text: user.address_text,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    };
  };
}
