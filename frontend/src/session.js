import { redirect } from "react-router-dom";

const DEFAULT_ROUTE_BY_USER_TYPE = {
  donor: "/requests",
  recipient: "/offers",
};
const USER_TYPE_BY_BACKEND_ROLE = {
  food_provider: "donor",
  recipient_organization: "recipient",
};

export const SESSION_QUERY_KEY = ["session"];

function getUserTypeFromRole(role) {
  if (!role) {
    return null;
  }

  return USER_TYPE_BY_BACKEND_ROLE[role] ?? null;
}

export function getUserType(session) {
  return (
    getUserTypeFromRole(session?.user?.role) ??
    getUserTypeFromRole(session?.role) ??
    session?.user?.user_type ??
    session?.user_type ??
    null
  );
}

export function getSessionUserId(session) {
  const userId = session?.user?.id ?? session?.id ?? null;

  if (userId === null || userId === undefined) {
    return null;
  }

  return String(userId);
}

export function getDefaultRouteForUserType(userType) {
  return DEFAULT_ROUTE_BY_USER_TYPE[userType] ?? "/login";
}

export function getMyListingsRouteForUserType(userType, userId) {
  if (!userId) {
    return getDefaultRouteForUserType(userType);
  }

  if (userType === "donor") {
    return `/users/${userId}/offers`;
  }

  if (userType === "recipient") {
    return `/users/${userId}/requests`;
  }

  return "/login";
}

export function getMyCreateRouteForUserType(userType, userId) {
  if (!userId) {
    return getDefaultRouteForUserType(userType);
  }

  if (userType === "donor") {
    return `/users/${userId}/offers/create`;
  }

  if (userType === "recipient") {
    return `/users/${userId}/requests/create`;
  }

  return "/login";
}

async function parseJsonResponse(res) {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
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
    const res = await fetch("/api/session", {
      signal: request?.signal,
      headers: {
        Accept: "application/json",
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
    return redirect("/login");
  }

  return session;
}

export function withProtectedLoader(loader, allowedUserTypes, getRedirectPath) {
  return async (args) => {
    const session = await requireSession(args.request);

    if (session instanceof Response) {
      return session;
    }

    const userType = getUserType(session);

    if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
      const redirectPath = getRedirectPath?.({
        args,
        session,
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
