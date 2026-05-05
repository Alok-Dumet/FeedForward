import { loaderFetch } from '../../utils/format.js';

async function loadListingDetails({ params, request }, page) {
  const payload = await loaderFetch(`/api/listings/${encodeURIComponent(params.id)}`, request, 'Unable to load listing details.');

  if (page.type && (!payload.record || payload.record.type !== page.type)) {
    throw new Response('Listing not found.', { status: 404 });
  }

  const url = new URL(request.url);
  let currentUser = null;
  if (payload.record) {
    currentUser = payload.record.current_user;
  }
  let resolvedPage = page;

  if (url.searchParams.get('from') === 'my-listings' && currentUser && currentUser.id) {
    const isDonor = currentUser.role === 'food_provider';
    let backTo = `/users/${currentUser.id}/requests`;
    let backLabel = 'My Requests';
    if (isDonor) {
      backTo = `/users/${currentUser.id}/offers`;
      backLabel = 'My Offers';
    }

    resolvedPage = {
      ...page,
      backTo,
      backLabel,
    };
  }

  return {
    page: resolvedPage,
    record: payload.record,
  };
}

export async function offerDetailsLoader(args) {
  return loadListingDetails(args, {
    type: 'offer',
    sectionLabel: 'Offer Details',
    backTo: '/offers',
    backLabel: 'Offers',
  });
}

export async function requestDetailsLoader(args) {
  return loadListingDetails(args, {
    type: 'request',
    sectionLabel: 'Request Details',
    backTo: '/requests',
    backLabel: 'Requests',
  });
}

export async function historyDetailsLoader(args) {
  return loadListingDetails(args, {
    sectionLabel: 'History Details',
    backTo: '/history',
    backLabel: 'History',
  });
}
