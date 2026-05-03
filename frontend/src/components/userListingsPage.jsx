import { useLoaderData } from 'react-router-dom';

import useListingFilters from '../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS } from '../utils/constants.js';
import ListingPageShell from './listingPageShell.jsx';

export default function UserListingsPage({ config }) {
  const { items } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, MY_LISTINGS_FILTERS);

  return (
    <ListingPageShell
      eyebrow={config.eyebrow}
      description={config.description}
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
        ...config.cardConfig,
      }}
    />
  );
}
