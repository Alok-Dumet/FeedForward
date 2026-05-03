import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS } from '../../utils/constants.js';

export default function UserOffers() {
  const { items } = useLoaderData();
  const { activeFilter, filteredItems, isFiltering, setActiveFilter } =
    useListingFilters(items, MY_LISTINGS_FILTERS);

  return (
    <ListingPageShell
      eyebrow="My Offers"
      description="Manage your active offers"
      items={filteredItems}
      filters={MY_LISTINGS_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
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
