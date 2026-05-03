import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteLoaderData } from "react-router-dom";

import {
  SESSION_QUERY_KEY,
  fetchSession,
  getDefaultRouteForUserType,
  parseSession,
} from "../session.js";

export function useSession() {
  const rootSession = useRouteLoaderData("root") ?? null;

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => fetchSession(),
    initialData: rootSession,
    staleTime: Infinity,
  });

  const session = query.data ?? null;
  const user = session?.user ?? session ?? null;
  const { userId, userType, organizationName, role } = parseSession(session);
  const defaultRoute = userType ? getDefaultRouteForUserType(userType) : "/";

  return useMemo(
    () => ({
      ...query,
      session,
      user,
      userType,
      userId,
      defaultRoute,
      organizationName,
      role,
      isAuthenticated: Boolean(userType),
    }),
    [
      query,
      session,
      user,
      userType,
      userId,
      defaultRoute,
      organizationName,
      role,
    ]
  );
}

export function useSessionActions() {
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      setSession(session) {
        queryClient.setQueryData(SESSION_QUERY_KEY, session ?? null);
      },
      clearSession() {
        queryClient.setQueryData(SESSION_QUERY_KEY, null);
      },
    }),
    [queryClient]
  );
}
