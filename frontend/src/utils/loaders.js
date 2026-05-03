import { redirect } from "react-router-dom";

import { getSessionUserId } from "../session.js";

//We will build a loader for /users/:id/{offers|requests}/create that redirects strangers to their own page
export function createUserListingLoader(roleLabel, listingPath) {
  return async function loader({ params }, session) {
    const sessionUserId = getSessionUserId(session);

    if (params.id !== sessionUserId) {
      return redirect(`/users/${sessionUserId}/${listingPath}/create`);
    }

    return {
      user: {
        id: sessionUserId,
        name: session.user.organization_name,
        role: roleLabel,
        address_text: session.user.address_text,
        latitude: session.user.latitude,
        longitude: session.user.longitude,
      },
    };
  };
}
