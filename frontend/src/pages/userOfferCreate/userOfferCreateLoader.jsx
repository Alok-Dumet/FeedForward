import { redirect } from "react-router-dom";

import { getSessionUserId } from "../../session.js";

export default async function userOfferCreateLoader({ params }, session) {
  const sessionUserId = getSessionUserId(session);

  if (params.id !== sessionUserId) {
    return redirect(`/users/${sessionUserId}/offers/create`);
  }

  return {
    user: {
      id: sessionUserId,
      name: session.user.organization_name,
      role: "Food Provider",
      address_text: session.user.address_text,
      latitude: session.user.latitude,
      longitude: session.user.longitude,
    },
  };
}
