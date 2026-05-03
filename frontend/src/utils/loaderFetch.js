//We will use this helper from any loader so every page calls our API the same way
export async function loaderFetch(url, request, errorMessage) {
  const res = await fetch(url, {
    signal: request.signal, //We use this to cancel fetches if a user navigates to a different page. Coolio!
    headers: { Accept: 'application/json' },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload) {
    throw new Response(errorMessage, { status: res.status || 500 });
  }

  return payload;
}
