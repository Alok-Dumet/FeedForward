import { redirect } from "react-router-dom";

import { getDefaultRouteForUserType, getUserType, requireSession } from "../../session.js";

export default async function homeLoader({ request }) {
  const session = await requireSession(request);

  if (session instanceof Response) {
    return session;
  }

  return redirect(getDefaultRouteForUserType(getUserType(session)));
}
