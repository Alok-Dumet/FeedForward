import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function Offers() {
  const { items, filters } = useLoaderData();
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? null);
  const filteredItems = useMemo(() => {
    if (!activeFilter || activeFilter === filters[0]) {
      return items;
    }

    return items.filter((item) => item.tags.includes(activeFilter));
  }, [activeFilter, filters, items]);

  return (
    <ListingPageShell
      eyebrow="Available Offers"
      title="Surplus food offers ready for pickup"
      description="Browse available surplus food offers from local providers and narrow the list by food category or handling type."
      items={filteredItems}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      hideHero
      secondaryAction={null}
      filtersLabel="Filter offers:"
      cardConfig={{
        eyebrowKey: "category",
        action: {
          label: "View details",
          to: (item) => `/offers/${item.id}`,
        },
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
