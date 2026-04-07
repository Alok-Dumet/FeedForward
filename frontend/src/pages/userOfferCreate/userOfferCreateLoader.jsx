function formatUserName(id) {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function userOfferCreateLoader({ params }) {
  const userId = params.id ?? "user-01";
  const displayName = formatUserName(userId);

  return {
    user: {
      id: userId,
      name: displayName || "Community Partner",
      role: "Restaurant Partner",
      location: "Downtown Brooklyn",
    },
  };
}
