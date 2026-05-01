import { loaderFetch } from "../../utils/loaderFetch.js";

async function loadListingDetails({ params, request }, page) {
  const payload = await loaderFetch(
    `/api/listings/details?id=${encodeURIComponent(params.id)}`,
    request,
    "Unable to load listing details.",
  );

  if (page.type && payload.record?.type !== page.type) {
    throw new Response("Listing not found.", { status: 404 });
  }

  return {
    page,
    record: payload.record,
  };
}

export async function offerDetailsLoader(args) {
  return loadListingDetails(args, {
    type: "offer",
    sectionLabel: "Offer Details",
    backTo: "/offers",
    backLabel: "Offers",
  });
}

export async function requestDetailsLoader(args) {
  return loadListingDetails(args, {
    type: "request",
    sectionLabel: "Request Details",
    backTo: "/requests",
    backLabel: "Requests",
  });
}

export async function historyDetailsLoader(args) {
  return loadListingDetails(args, {
    sectionLabel: "History Details",
    backTo: "/history",
    backLabel: "History",
  });
}
