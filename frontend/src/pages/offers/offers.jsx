import { useLoaderData } from 'react-router-dom';

import ListingPageShell from '../../components/listingPageShell.jsx';
import RadiusSlider from '../../components/radiusSlider.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';

export default function Offers() {
  const { items, filters, radiusMiles } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, filters);

  return (
    <ListingPageShell
      eyebrow="Available Offers"
      description="Browse available surplus food offers"
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      isFiltering={isFiltering}
      filtersLabel="Filter offers:"
      extraControls={<RadiusSlider defaultMiles={radiusMiles} />}
      cardConfig={{
        eyebrowKey: 'category',
        action: {
          label: 'View details',
          to: (item) => `/offers/${item.id}`,
        },
        highlightLabel: 'Quantity',
        highlightValueKey: 'quantity',
        detailFields: [
          { label: 'Available Times', key: 'availability' },
          { label: 'Location', key: 'location' },
          { label: 'Best For', key: 'audience' },
        ],
      }}
    />
  );
}
