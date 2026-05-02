import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigation } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";
import RadiusSlider from "../../components/radiusSlider.jsx";

export default function Requests() {
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
      eyebrow="Active Requests"
      title="Community food requests awaiting a match"
      description="Browse active community food requests and narrow the list by food category or handling type."
      items={filteredItems}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      isFiltering={isFiltering}
      secondaryAction={null}
      filtersLabel="Filter requests:"
      extraControls={
        <RadiusSlider defaultMiles={radiusMiles} />
      }
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
