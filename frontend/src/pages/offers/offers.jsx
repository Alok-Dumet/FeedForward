/* eslint-disable react-refresh/only-export-components */
import { useLoaderData } from 'react-router-dom';

import ListingCard from '../../components/listingCard.jsx';
import ListingPageShell from '../../components/listingPageShell.jsx';
import RadiusSlider from '../../components/radiusSlider.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { createPublicListingsLoader } from '../../utils/listings.js';

export const offersLoader = createPublicListingsLoader({
  allFilterLabel: 'All offers',
  errorMessage: 'Unable to load offers.',
});

export default function Offers() {
  const { items, filters, radiusMiles } = useLoaderData();
  const { activeFilters, filteredItems, setActiveFilters } = useListingFilters(items);

  return (
    <ListingPageShell
      sectionLabel="Available Offers"
      description="Browse available surplus food offers"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      filtersLabel="Filter offers:"
      extraControls={<RadiusSlider defaultMiles={radiusMiles} />}
      renderItem={(item) => (
        <ListingCard
          key={item.id}
          eyebrow={item.category}
          title={item.title}
          summary={item.summary}
          highlightLabel="Quantity"
          highlightValue={item.quantity}
          tags={item.tags}
          action={{ label: 'View details', to: `/offers/${item.id}` }}
          detailItems={[
            { label: 'Available Times', value: item.availability },
            { label: 'Location', value: item.location },
            { label: 'Organization', value: item.audience },
          ]}
        />
      )}
    />
  );
}
