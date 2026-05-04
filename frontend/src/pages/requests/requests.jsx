/* eslint-disable react-refresh/only-export-components */
import { useLoaderData } from 'react-router-dom';

import ListingCard from '../../components/listingCard.jsx';
import ListingPageShell from '../../components/listingPageShell.jsx';
import RadiusSlider from '../../components/radiusSlider.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { createPublicListingsLoader } from '../../utils/listings.js';

export const requestsLoader = createPublicListingsLoader({
  allFilterLabel: 'All requests',
  errorMessage: 'Unable to load requests.',
});

export default function Requests() {
  const { items, filters, radiusMiles } = useLoaderData();
  const { activeFilters, filteredItems, setActiveFilters } = useListingFilters(items);

  return (
    <ListingPageShell
      eyebrow="Active Requests"
      description="Browse active community food requests"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      filtersLabel="Filter requests:"
      extraControls={<RadiusSlider defaultMiles={radiusMiles} />}
      renderItem={(item) => (
        <ListingCard
          key={item.id}
          eyebrow={item.category}
          title={item.title}
          summary={item.summary}
          highlightLabel="Need"
          highlightValue={item.quantity}
          tags={item.tags}
          action={{ label: 'View details', to: `/requests/${item.id}` }}
          detailItems={[
            { label: 'Available Times', value: item.availability },
            { label: 'Area', value: item.location },
            { label: 'Serving', value: item.audience },
          ]}
        />
      )}
    />
  );
}
