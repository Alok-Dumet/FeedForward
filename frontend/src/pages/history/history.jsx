import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';

export default function History() {
  const { items, filters } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, filters);

  return (
    <ListingPageShell
      eyebrow="History"
      description="Review completed and cancelled listings"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      isFiltering={isFiltering}
      filtersLabel="History filters:"
      cardConfig={{
        variant: 'compactHistory',
        eyebrowKey: 'status',
        metaKey: 'timeline',
        action: {
          label: 'View details',
          to: (item) => `/history/${item.id}`,
        },
        highlightLabel: 'Quantity',
        highlightValueKey: 'quantity',
        detailFields: [
          { label: 'Timeline', key: 'timeline' },
          { label: 'Location', key: 'location' },
          { label: 'Type', key: 'recordType' },
        ],
      }}
    />
  );
}
