import { loaderFetch } from '../../utils/loaderFetch.js';
import { buildOwnListingItem } from '../../utils/listingBuilders.js';

export default async function userRequestsLoader({ request }) {
  const payload = await loaderFetch(
    '/api/my-listings',
    request,
    'Unable to load your requests.'
  );

  return {
    items: (payload.records ?? []).map(buildOwnListingItem),
  };
}
