import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS } from '../../utils/constants.js';

export default function UserRequests() {
  const { items } = useLoaderData();
  const { activeFilter, filteredItems, isFiltering, setActiveFilter } =
    useListingFilters(items, MY_LISTINGS_FILTERS);

  return (
    <ListingPageShell
      eyebrow="My Requests"
      description="Manage your active requests"
      items={filteredItems}
      filters={MY_LISTINGS_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isFiltering={isFiltering}
      filtersLabel="Show:"
      cardConfig={{
        eyebrowKey: 'status',
        highlightLabel: 'Need',
        action: {
          label: 'View details',
          to: (item) => item.detailsPath,
        },
        detailFields: [
          { label: 'Available Times', key: 'availability' },
          { label: 'Area', key: 'location' },
          { label: 'Serving', key: 'audience' },
        ],
      }}
    />
  );
}
