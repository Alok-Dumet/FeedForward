export default async function homeLoader({ request }) {
  return [{name: "John"},  {name: "Chris"}];

  //Fetch the available donations
  const res = await fetch("/api/donations", {
    signal: request.signal,
  });

  //Stop if the HTTP request failed
  if (!res.ok) {
    throw new Response("Failed to load feed", { status: res.status });
  }

  //Give the data back to React Router
  const data = await res.json();
  return data;
}
