import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS } from '../../utils/constants.js';

export default function UserOffers() {
  const { items } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, MY_LISTINGS_FILTERS);

  return (
    <ListingPageShell
      eyebrow="My Offers"
      description="Manage your active offers"
      items={filteredItems}
      filters={MY_LISTINGS_FILTERS}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      isFiltering={isFiltering}
      filtersLabel="Show:"
      cardConfig={{
        eyebrowKey: 'status',
        action: {
          label: 'View details',
          to: (item) => item.detailsPath,
        },
      }}
    />
  );
}
