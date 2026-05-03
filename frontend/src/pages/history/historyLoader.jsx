import { loaderFetch } from '../../utils/loaderFetch.js';
import {
  formatFoodQuantity,
  getFoodTags,
  getFoodTitle,
  getPrimaryFood,
} from '../../utils/foods.js';

const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
const HISTORY_OWNERSHIP_FILTERS = ['Posted by you', 'Claimed by you'];

function formatStatus(status) {
  if (status === 'completed') {
    return 'Completed';
  }
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  return status;
}

//We will turn one /api/history record into the card shape the history page expects
function buildItem(record) {
  const ownership =
    record.relationship === 'own' ? 'Posted by you' : 'Claimed by you';
  const recordType =
    record.listing_type === 'offer' ? 'Offer record' : 'Request record';
  const primaryFood = getPrimaryFood(record);
  const status = formatStatus(record.status);

  return {
    id: record.listing_id,
    status,
    title: getFoodTitle(record),
    summary: '',
    quantity: formatFoodQuantity(primaryFood),
    timeline: buildTimeline(record),
    location: record.location ?? 'Location unavailable',
    recordType,
    tags: [ownership, status, recordType, ...getFoodTags(record)],
  };
}

//We will pick the most informative timestamp to show on the card based on the record's final status
function buildTimeline(record) {
  if (record.claim?.resolved_at) {
    return `${formatStatus(record.status)} on ${formatDate(record.claim.resolved_at)}`;
  }
  return `Posted on ${formatDate(record.created_at)}`;
}

function formatDate(value) {
  if (!value) {
    return 'an unknown date';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateFmt.format(date);
}

export default async function historyLoader({ request }) {
  const payload = await loaderFetch(
    '/api/history',
    request,
    'Unable to load history.'
  );

  return {
    filters: [
      ...(payload.filters ?? []).map((filter) =>
        filter === 'all' ? 'All records' : formatStatus(filter)
      ),
      ...HISTORY_OWNERSHIP_FILTERS,
    ],
    items: (payload.records ?? []).map(buildItem),
  };
}
