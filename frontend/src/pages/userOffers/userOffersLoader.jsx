function formatUserName(id) {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function userOffersLoader({ params }) {
  const userId = params.id ?? "user-01";
  const displayName = formatUserName(userId);

  return {
    user: {
      id: userId,
      name: displayName || "Community Partner",
      role: "Restaurant Partner",
      location: "Downtown Brooklyn",
    },
    stats: [
      { label: "Active Offers", value: "4" },
      { label: "Scheduled Today", value: "2" },
      { label: "Completed This Week", value: "7" },
    ],
    filters: ["Draft", "Awaiting pickup", "Matched", "Completed recently"],
    items: [
      {
        id: "owned-offer-1",
        title: "Prepared lunch trays",
        status: "Awaiting pickup",
        quantity: "24 servings",
        pickupWindow: "Today, 5:30 PM - 7:00 PM",
        location: "Downtown Brooklyn",
        audience: "Shelters and mutual-aid groups",
        summary:
          "This is one of your currently active meal offers and is staged for same-day pickup after lunch service.",
        tags: ["Ready to serve", "Hot held", "Same day"],
      },
      {
        id: "owned-offer-2",
        title: "Bakery recovery boxes",
        status: "Matched",
        quantity: "8 crates",
        pickupWindow: "Tomorrow, 7:00 AM - 9:00 AM",
        location: "Downtown Brooklyn",
        audience: "Community fridges and pantry volunteers",
        summary:
          "This offer has already been matched and is waiting on the planned morning handoff window.",
        tags: ["Breakfast", "Bulk pickup", "Packed"],
      },
      {
        id: "owned-offer-3",
        title: "Mixed produce boxes",
        status: "Draft",
        quantity: "14 boxes",
        pickupWindow: "To be confirmed",
        location: "Downtown Brooklyn",
        audience: "Food pantries and schools",
        summary:
          "This draft record is prepared for produce inventory that still needs a final pickup window before publishing.",
        tags: ["Raw ingredients", "Cold storage", "Draft"],
      },
    ],
  };
}
