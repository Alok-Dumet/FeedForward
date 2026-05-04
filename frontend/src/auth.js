import { redirect } from 'react-router-dom';

import { fetchSession } from './session.js';

//We will wrap this around our loaders so they do not load data unless a session exists
export function requireSession(loader) {
  return async (loaderArgs) => {
    const session = await fetchSession(loaderArgs.request);

    if (!session) {
      throw redirect('/not_authorized');
    }

    return loader(loaderArgs, session);
  };
}
