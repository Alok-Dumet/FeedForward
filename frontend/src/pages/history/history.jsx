import { useLoaderData } from 'react-router-dom';

import ListingCard from '../../components/listingCard.jsx';
import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';

export default function History() {
  const { items, filters } = useLoaderData();
  const { activeFilters, filteredItems, setActiveFilters } = useListingFilters(items);

  return (
    <ListingPageShell
      sectionLabel="History"
      description="Review completed and cancelled listings"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      filtersLabel="History filters:"
      renderItem={(item) => (
        <ListingCard key={item.id} variant="compactHistory" title={item.title} metaText={item.timeline} tags={item.tags} action={{ label: 'View details', to: `/history/${item.id}` }} />
      )}
    />
  );
}
