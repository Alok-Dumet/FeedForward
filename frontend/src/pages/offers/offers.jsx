import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigation } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";
import RadiusSlider from "../../components/radiusSlider.jsx";

export default function Offers() {
  const { items, filters, radiusMiles } = useLoaderData();
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? null);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const filteredItems = useMemo(() => {
    if (!activeFilter || activeFilter === filters[0]) {
      return items;
    }

    return items.filter((item) => item.tags.includes(activeFilter));
  }, [activeFilter, filters, items]);
  const isFiltering = isLocalFiltering || navigation.state !== "idle";

  useEffect(() => {
    if (!isLocalFiltering) {
      return undefined;
    }

    const handle = window.setTimeout(() => setIsLocalFiltering(false), 250);
    return () => window.clearTimeout(handle);
  }, [filteredItems, isLocalFiltering]);

  function handleFilterChange(filter) {
    setIsLocalFiltering(true);
    setActiveFilter(filter);
  }

  return (
    <ListingPageShell
      eyebrow="Available Offers"
      title="Surplus food offers ready for pickup"
      description="Browse available surplus food offers"
      items={filteredItems}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      isFiltering={isFiltering}
      secondaryAction={null}
      filtersLabel="Filter offers:"
      extraControls={
        <RadiusSlider defaultMiles={radiusMiles} />
      }
      cardConfig={{
        eyebrowKey: "category",
        action: {
          label: "View details",
          to: (item) => `/offers/${item.id}`,
        },
        highlightLabel: "Quantity",
        highlightValueKey: "quantity",
        detailFields: [
          { label: "Available Times", key: "availability" },
          { label: "Location", key: "location" },
          { label: "Best For", key: "audience" },
        ],
      }}
    />
  );
}
