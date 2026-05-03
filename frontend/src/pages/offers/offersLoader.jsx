import { loaderFetch } from '../../utils/loaderFetch.js';
import {
  getRadiusMiles,
  withDistanceFilteredRecords,
} from '../../utils/distance.js';
import { buildPublicListingItem } from '../../utils/listingBuilders.js';

const ALL_FILTER = 'All offers';

export default async function offersLoader({ request }) {
  const payload = await loaderFetch(
    '/api/listings',
    request,
    'Unable to load offers.'
  );
  const radiusMiles = getRadiusMiles(request);
  const records = withDistanceFilteredRecords(
    payload.records ?? [],
    payload.current_user,
    radiusMiles
  );
  const items = records.map(buildPublicListingItem);
  const realFilters = Array.from(
    new Set(items.flatMap((item) => item.tags))
  ).sort();

  return {
    filters: items.length > 0 ? [ALL_FILTER, ...realFilters] : [],
    items,
    radiusMiles,
  };
}
