import { redirect } from "react-router-dom";

import { getSessionUserId } from "../../session.js";

export default async function userRequestCreateLoader({ params }, session) {
  const sessionUserId = getSessionUserId(session);

  if (params.id !== sessionUserId) {
    return redirect(`/users/${sessionUserId}/requests/create`);
  }

  return {
    user: {
      id: sessionUserId,
      name: session.user.organization_name,
      role: "Recipient Organization",
    },
  };
}
