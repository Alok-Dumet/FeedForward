import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import RadiusSlider from '../../components/radiusSlider.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';

export default function Requests() {
  const { items, filters, radiusMiles } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, filters);

  return (
    <ListingPageShell
      eyebrow="Active Requests"
      description="Browse active community food requests"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      isFiltering={isFiltering}
      filtersLabel="Filter requests:"
      extraControls={<RadiusSlider defaultMiles={radiusMiles} />}
      cardConfig={{
        eyebrowKey: 'category',
        action: {
          label: 'View details',
          to: (item) => `/requests/${item.id}`,
        },
        highlightLabel: 'Need',
        highlightValueKey: 'quantity',
        detailFields: [
          { label: 'Available Times', key: 'availability' },
          { label: 'Area', key: 'location' },
          { label: 'Serving', key: 'audience' },
        ],
      }}
    />
  );
}
