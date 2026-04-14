import { redirect } from "react-router-dom";

export default async function homeLoader({ request }) {
  const res = await fetch("/api/session", {
    signal: request.signal
  });

  if (res.status === 401) {
    return redirect("/login");
  }

  if (!res.ok) {
    throw new Response("Failed to load session", { status: res.status });
  }

  const data = await res.json();
  return data;
}
