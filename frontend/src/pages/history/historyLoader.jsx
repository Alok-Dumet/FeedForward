import { loaderFetch } from '../../utils/format.js';
import { summarizeFoods } from '../../utils/format.js';

const HISTORY_OWNERSHIP_FILTERS = ['Posted by you', 'Claimed by you'];
const historyDateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

//We will turn backend history statuses into display labels
function formatHistoryStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

//We will format history dates for the timeline text
function formatHistoryDate(value) {
  const date = new Date(value);
  return historyDateFmt.format(date);
}

//We will reshape one history listing record into the card shape the history page expects
function buildHistoryItem(record) {
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

export default async function historyLoader({ request }) {
  const payload = await loaderFetch('/api/listings?scope=history', request, 'Unable to load history.');
  const filters = (payload.filters ?? []).map((filter) => {
    if (filter === 'all') {
      return 'All records';
    }

    return formatHistoryStatus(filter);
  });

  return {
    filters: [...filters, ...HISTORY_OWNERSHIP_FILTERS],
    items: (payload.records ?? []).map(buildHistoryItem),
  };
}
