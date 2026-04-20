import { redirect } from "react-router-dom";

const DEFAULT_ROUTE_BY_USER_TYPE = {
  donor: "/requests",
  recipient: "/offers",
};
const MOCK_SESSION_STORAGE_KEY = "feedforward_mock_session";
const MOCK_SESSION_LOGGED_OUT_KEY = "feedforward_mock_logged_out";

export function getUserType(session) {
  return session?.user?.user_type ?? session?.user_type ?? null;
}

export function getDefaultRouteForUserType(userType) {
  return DEFAULT_ROUTE_BY_USER_TYPE[userType] ?? "/login";
}

function canUseMockSession() {
  return import.meta.env.DEV && typeof window !== "undefined";
}

function getMockProfile(userType) {
  if (userType === "donor") {
    return {
      id: "mock-donor-01",
      email: "donor@feedforward.local",
      role: "Donor Partner",
      organization_name: "Local Donor Kitchen",
      user_type: "donor",
    };
  }

  return {
    id: "mock-recipient-01",
    email: "recipient@feedforward.local",
    role: "Recipient Organization",
    organization_name: "Community Pantry Network",
    user_type: "recipient",
  };
}

function readStoredMockSession() {
  if (!canUseMockSession()) {
    return null;
  }

  if (window.localStorage.getItem(MOCK_SESSION_LOGGED_OUT_KEY) === "true") {
    return null;
  }

  const storedSession = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession);

    if (getUserType(parsedSession)) {
      return parsedSession;
    }
  } catch {
    window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  }

  return null;
}

export function createMockSession(userType = "recipient", overrides = {}) {
  const safeUserType = userType === "donor" ? "donor" : "recipient";
  const baseUser = getMockProfile(safeUserType);
  const { user: userOverrides = {}, ...sessionOverrides } = overrides;

  return {
    ...sessionOverrides,
    user_type: safeUserType,
    user: {
      ...baseUser,
      ...userOverrides,
      user_type: safeUserType,
    },
  };
}

export function persistMockSession(session) {
  if (!canUseMockSession()) {
    return;
  }

  window.localStorage.removeItem(MOCK_SESSION_LOGGED_OUT_KEY);
  window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearMockSession() {
  if (!canUseMockSession()) {
    return;
  }

  window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  window.localStorage.setItem(MOCK_SESSION_LOGGED_OUT_KEY, "true");
}

export function getMockSession() {
  if (!canUseMockSession()) {
    return null;
  }

  return readStoredMockSession();
}

export function inferMockUserType(email = "") {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.includes("donor")) {
    return "donor";
  }

  if (normalizedEmail.includes("recipient")) {
    return "recipient";
  }

  return getUserType(readStoredMockSession()) ?? "recipient";
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
      if (canUseMockSession()) {
        persistMockSession(session);
      }

      return session;
    }

    if (canUseMockSession()) {
      return getMockSession();
    }

    return null;
  } catch {
    if (canUseMockSession()) {
      return getMockSession();
    }

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

export function withProtectedLoader(loader, allowedUserTypes) {
  return async (args) => {
    const session = await requireSession(args.request);

    if (session instanceof Response) {
      return session;
    }

    const userType = getUserType(session);

    if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
      return redirect(getDefaultRouteForUserType(userType));
    }

    if (!loader) {
      return session;
    }

    return loader(args, session);
  };
}
