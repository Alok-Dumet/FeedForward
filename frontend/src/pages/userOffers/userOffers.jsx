import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";
import useListingFilters from "../../hooks/useListingFilters.js";

const FILTERS = ["All listings", "Posted by you", "Accepted by you"];

export default function UserOffers() {
  const { items } = useLoaderData();
  const { activeFilter, filteredItems, isFiltering, setActiveFilter } =
    useListingFilters(items, FILTERS);

  return (
    <ListingPageShell
      eyebrow="My Offers"
      description="Manage your active offers"
      items={filteredItems}
      filters={FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isFiltering={isFiltering}
      filtersLabel="Show:"
      cardConfig={{
        eyebrowKey: "status",
        action: {
          label: "View details",
          to: (item) => item.detailsPath,
        },
      }}
    />
  );
}
