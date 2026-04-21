import { redirect } from "react-router-dom";

import { getSessionUserId } from "../../session.js";

function formatUserName(id) {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function userRequestCreateLoader({ params }, session) {
  const sessionUserId = getSessionUserId(session);
  const userId = sessionUserId ?? params.id ?? "user-01";

  if (sessionUserId && params.id !== sessionUserId) {
    return redirect(`/users/${sessionUserId}/requests/create`);
  }

  const displayName =
    session?.user?.organization_name ?? session?.user?.name ?? formatUserName(userId);

  return {
    user: {
      id: userId,
      name: displayName || "Community Partner",
      role: "Community Pantry Team",
      location: "South Bronx",
    },
  };
}
