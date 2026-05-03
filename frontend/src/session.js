import { redirect } from 'react-router-dom';

const DEFAULT_ROUTE_BY_USER_TYPE = {
  donor: '/requests',
  recipient: '/offers',
};
const USER_LISTING_SEGMENT_BY_USER_TYPE = {
  donor: 'offers',
  recipient: 'requests',
};
const USER_TYPE_BY_BACKEND_ROLE = {
  food_provider: 'donor',
  recipient_organization: 'recipient',
};

export const SESSION_QUERY_KEY = ['session'];

function getUserTypeFromRole(role) {
  if (!role) {
    return null;
  }

  return USER_TYPE_BY_BACKEND_ROLE[role] ?? null;
}

export function parseSession(raw) {
  const user = raw?.user ?? raw ?? null;
  const userIdValue = raw?.user?.id ?? raw?.id ?? null;
  const role = raw?.user?.role ?? raw?.role ?? null;
  const userType =
    getUserTypeFromRole(role) ?? raw?.user?.user_type ?? raw?.user_type ?? null;

  return {
    userId:
      userIdValue === null || userIdValue === undefined
        ? null
        : String(userIdValue),
    userType,
    organizationName: user?.organization_name ?? user?.name ?? '',
    role,
  };
}

export function getDefaultRouteForUserType(userType) {
  return DEFAULT_ROUTE_BY_USER_TYPE[userType] ?? '/login';
}

function getMyListingRouteForUserType(userType, userId, suffix = '') {
  if (!userId) {
    return getDefaultRouteForUserType(userType);
  }

  const listingSegment = USER_LISTING_SEGMENT_BY_USER_TYPE[userType];
  if (!listingSegment) {
    return '/login';
  }

  return `/users/${userId}/${listingSegment}${suffix}`;
}

export function getMyListingsRouteForUserType(userType, userId) {
  return getMyListingRouteForUserType(userType, userId);
}

export function getMyCreateRouteForUserType(userType, userId) {
  return getMyListingRouteForUserType(userType, userId, '/create');
}

async function parseJsonResponse(res) {
  const contentType = res.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchSession(request) {
  try {
    const res = await fetch('/api/session', {
      signal: request?.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    const session = await parseJsonResponse(res);

    if (res.status === 401) {
      return null;
    }

    if (res.ok && session) {
      return session;
    }

    return null;
  } catch {
    return null;
  }
}

export async function rootSessionLoader({ request }) {
  return fetchSession(request);
}

export async function requireSession(request) {
  const session = await fetchSession(request);

  if (!session) {
    return redirect('/login');
  }

  return session;
}

export function withProtectedLoader(loader, allowedUserTypes, getRedirectPath) {
  return async (args) => {
    const session = await requireSession(args.request);

    if (session instanceof Response) {
      return session;
    }

    const parsedSession = parseSession(session);
    const { userType } = parsedSession;

    if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
      const redirectPath = getRedirectPath?.({
        args,
        session,
        parsedSession,
        userId: parsedSession.userId,
        userType,
      });

      return redirect(redirectPath ?? getDefaultRouteForUserType(userType));
    }

    if (!loader) {
      return session;
    }

    return loader(args, session);
  };
}
