import { loaderFetch } from "../../utils/loaderFetch.js";
import { buildOwnListingItem } from "../../utils/listingBuilders.js";

export default async function userOffersLoader({ request }) {
  const payload = await loaderFetch("/api/my-listings", request, "Unable to load your offers.");

  return {
    items: (payload.records ?? []).map(buildOwnListingItem),
  };
}
