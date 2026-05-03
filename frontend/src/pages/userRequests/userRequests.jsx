import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";
import useListingFilters from "../../hooks/useListingFilters.js";

const FILTERS = ["All listings", "Posted by you", "Accepted by you"];

export default function UserRequests() {
  const { items } = useLoaderData();
  const { activeFilter, filteredItems, isFiltering, setActiveFilter } =
    useListingFilters(items, FILTERS);

  return (
    <ListingPageShell
      eyebrow="My Requests"
      description="Manage your active requests"
      items={filteredItems}
      filters={FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isFiltering={isFiltering}
      filtersLabel="Show:"
      cardConfig={{
        eyebrowKey: "status",
        highlightLabel: "Need",
        action: {
          label: "View details",
          to: (item) => item.detailsPath,
        },
        detailFields: [
          { label: "Available Times", key: "availability" },
          { label: "Area", key: "location" },
          { label: "Serving", key: "audience" },
        ],
      }}
    />
  );
}
