export default async function offersLoader() {
  return {
    filters: ["Prepared meals", "Produce", "Bakery", "Same day pickup"],
    stats: [
      { label: "Active Offers", value: "12" },
      { label: "Pickup Today", value: "8" },
      { label: "Partner Zones", value: "5" },
    ],
    items: [
      {
        id: "offer-1",
        title: "Prepared lunch trays",
        category: "Prepared Meals",
        quantity: "24 servings",
        pickupWindow: "Today, 5:30 PM - 7:00 PM",
        location: "Downtown Brooklyn",
        audience: "Shelters and mutual-aid groups",
        summary:
          "Freshly prepared rice bowls and roasted vegetables packaged after lunch service.",
        tags: ["Ready to serve", "Hot held", "Same day"],
      },
      {
        id: "offer-2",
        title: "Assorted bread and pastries",
        category: "Bakery",
        quantity: "6 crates",
        pickupWindow: "Tomorrow, 7:00 AM - 9:00 AM",
        location: "Lower Manhattan",
        audience: "Community fridges and nonprofits",
        summary:
          "End-of-day baguettes, sandwich rolls, muffins, and croissants in sealed trays.",
        tags: ["Breakfast", "Vegetarian", "Bulk pickup"],
      },
      {
        id: "offer-3",
        title: "Mixed produce boxes",
        category: "Produce",
        quantity: "14 boxes",
        pickupWindow: "Today, 3:00 PM - 6:00 PM",
        location: "Long Island City",
        audience: "Food pantries and schools",
        summary:
          "Tomatoes, lettuce, cucumbers, and herbs packed from overstock inventory.",
        tags: ["Raw ingredients", "Cold storage", "Family-friendly"],
      },
    ],
  };
}
