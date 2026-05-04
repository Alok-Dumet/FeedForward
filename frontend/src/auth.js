import { redirect } from 'react-router-dom';

import { fetchSession, parseSession } from './session.js';

//We will redirect users who do not have a backend session
export async function requireSession(request) {
  const session = await fetchSession(request);

  if (!session) {
    return redirect('/not_authorized');
  }

  return session;
}

//We will wrap route loaders with a frontend check before loading protected data
export function withProtectedLoader(loader, allowedRoles) {
  return async (loaderArgs) => {
    const session = await requireSession(loaderArgs.request);

    if (session instanceof Response) {
      return session;
    }

    const { role } = parseSession(session);

    if (allowedRoles && !allowedRoles.includes(role)) {
      return redirect('/not_authorized');
    }

    if (!loader) {
      return session;
    }

    return loader(loaderArgs, session);
  };
}
