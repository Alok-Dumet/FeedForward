import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteLoaderData } from 'react-router-dom';

export const DEFAULT_ROUTE_BY_ROLE = {
  food_provider: '/requests',
  recipient_organization: '/offers',
};
export const USER_LISTING_SEGMENT_BY_ROLE = {
  food_provider: 'offers',
  recipient_organization: 'requests',
};

//We will pull out the uerId, role, and organizationName from the users session
export function parseSession(sessionData) {
  if (!sessionData || !sessionData.user) {
    return {
      userId: null,
      role: null,
      organizationName: '',
    };
  }

  return {
    userId: String(sessionData.user.id),
    role: sessionData.user.role,
    organizationName: sessionData.user.organization_name,
  };
}

//We will build routes for the logged in user's own listing pages
export function getMyListingRouteForRole(role, userId, suffix = '') {
  if (!userId) {
    return DEFAULT_ROUTE_BY_ROLE[role] ?? '/login';
  }

  const listingSegment = USER_LISTING_SEGMENT_BY_ROLE[role];
  if (!listingSegment) {
    return '/login';
  }

  return `/users/${userId}/${listingSegment}${suffix}`;
}

//We will ask the backend who is logged in and return null when nobody is
export async function fetchSession(request) {
  try {
    const sessionResponse = await fetch('/api/session', {
      signal: request ? request.signal : undefined,
      headers: { Accept: 'application/json' },
    });

    if (!sessionResponse.ok) {
      return null;
    }

    return await sessionResponse.json();
  } catch {
    return null;
  }
}

//We will keep the current session in TanStack Query so any component can read it
export function useSession() {
  const rootSession = useRouteLoaderData('root') ?? null;

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => fetchSession(),
    initialData: rootSession,
    staleTime: Infinity,
  });

  const session = sessionQuery.data ?? null;
  let user = null;
  if (session) {
    user = session.user;
  }
  const { userId, role, organizationName } = parseSession(session);
  const defaultRoute = DEFAULT_ROUTE_BY_ROLE[role] ?? '/login';

  return {
    ...sessionQuery,
    session,
    user,
    role,
    userId,
    defaultRoute,
    organizationName,
    isAuthenticated: Boolean(role),
  };
}

//We will expose helpers for changing the cached session after login or logout
export function useSessionActions() {
  const queryClient = useQueryClient();

  return {
    //We will store a new authenticated session in the shared cache
    setSession(session) {
      queryClient.setQueryData(['session'], session ?? null);
    },
    //We will clear the shared session cache when the user logs out
    clearSession() {
      queryClient.setQueryData(['session'], null);
    },
  };
}
