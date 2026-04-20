import { redirect } from "react-router-dom";

import { getSessionUserId } from "../../session.js";

function formatUserName(id) {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function userRequestsLoader({ params }, session) {
  const sessionUserId = getSessionUserId(session);
  const userId = sessionUserId ?? params.id ?? "user-01";

  if (sessionUserId && params.id !== sessionUserId) {
    return redirect(`/users/${sessionUserId}/requests`);
  }

  const displayName =
    session?.user?.organization_name ?? session?.user?.name ?? formatUserName(userId);

  return {
    user: {
      id: userId,
      name: displayName || "Community Partner",
      role: "Community Pantry Team",
      location: "South Bronx",
    },
    stats: [
      { label: "Open Requests", value: "5" },
      { label: "Urgent Today", value: "2" },
      { label: "Completed This Week", value: "6" },
    ],
    filters: ["Draft", "Awaiting match", "Scheduled", "Recently completed"],
    items: [
      {
        id: "owned-request-1",
        title: "Weekend pantry produce request",
        status: "Awaiting match",
        quantity: "22 produce boxes",
        neededBy: "Saturday, before 11:00 AM",
        location: "South Bronx",
        audience: "Families picking up weekly groceries",
        summary:
          "This is one of your active pantry requests and is waiting for a confirmed donor match before the Saturday distribution window.",
        tags: ["Fresh produce", "Family support", "Weekend pickup"],
      },
      {
        id: "owned-request-2",
        title: "After-school meal support",
        status: "Scheduled",
        quantity: "35 meals needed",
        neededBy: "Today, before 4:30 PM",
        location: "South Bronx",
        audience: "Students in after-care programs",
        summary:
          "This request has a planned handoff window and is being coordinated for same-day distribution after tutoring hours.",
        tags: ["Prepared meals", "Kid-friendly", "Same day"],
      },
      {
        id: "owned-request-3",
        title: "Shelter breakfast restock",
        status: "Draft",
        quantity: "18 breakfast kits",
        neededBy: "To be confirmed",
        location: "South Bronx",
        audience: "Adults in temporary shelter housing",
        summary:
          "This draft request is saved for the next shelter breakfast cycle and still needs a final timing window before it is ready.",
        tags: ["Morning support", "Grab-and-go", "Draft"],
      },
    ],
  };
}
