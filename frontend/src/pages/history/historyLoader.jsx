import { loaderFetch } from '../../utils/format.js';
import { buildHistoryItem, formatHistoryStatus } from '../../utils/listings.js';

const HISTORY_OWNERSHIP_FILTERS = ['Posted by you', 'Claimed by you'];

export default async function historyLoader({ request }) {
  const payload = await loaderFetch('/api/history', request, 'Unable to load history.');
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
