import { redirect } from "react-router-dom";

import { parseSession } from "../session.js";

//We will build a loader for /users/:id/{offers|requests}/create that redirects strangers to their own page
export function createUserListingLoader(roleLabel, listingPath) {
  return async function loader({ params }, session) {
    const { userId, organizationName } = parseSession(session);
    const user = session?.user ?? session ?? {};

    if (params.id !== userId) {
      return redirect(`/users/${userId}/${listingPath}/create`);
    }

    return {
      user: {
        id: userId,
        name: organizationName,
        role: roleLabel,
        address_text: user.address_text,
        latitude: user.latitude,
        longitude: user.longitude,
      },
    };
  };
}
