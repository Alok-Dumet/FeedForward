import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function Requests() {
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
      eyebrow="Active Requests"
      title="Community food requests awaiting a match"
      description="Browse active community food requests and narrow the list by food category or handling type."
      items={filteredItems}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      hideHero
      secondaryAction={null}
      filtersLabel="Filter requests:"
      cardConfig={{
        eyebrowKey: "category",
        action: {
          label: "View details",
          to: (item) => `/requests/${item.id}`,
        },
        highlightLabel: "Need",
        highlightValueKey: "quantity",
        detailFields: [
          { label: "Needed By", key: "neededBy" },
          { label: "Area", key: "location" },
          { label: "Serving", key: "audience" },
        ],
      }}
    />
  );
}
