import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function Offers() {
  const { items, filters, stats } = useLoaderData();

  return (
    <ListingPageShell
      eyebrow="Available Offers"
      title="Surplus food offers ready for pickup"
      description="This page is UI-first and currently powered by mock data. It is designed to help restaurants publish available food while keeping the listing structure reusable for future recipient or request flows."
      items={items}
      filters={filters}
      stats={stats}
      secondaryAction={{ label: "Back to Home", to: "/home" }}
      filtersLabel="Mock filters:"
      cardConfig={{
        eyebrowKey: "category",
        highlightLabel: "Quantity",
        highlightValueKey: "quantity",
        detailFields: [
          { label: "Pickup Window", key: "pickupWindow" },
          { label: "Location", key: "location" },
          { label: "Best For", key: "audience" },
        ],
      }}
    />
  );
}
