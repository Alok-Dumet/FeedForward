import { useLoaderData } from 'react-router-dom';

import useListingFilters from '../hooks/useListingFilters.js';
import ListingPageShell from './listingPageShell.jsx';
import RadiusSlider from './radiusSlider.jsx';

export default function PublicListingsPage({ config }) {
  const { items, filters, radiusMiles } = useLoaderData();
  const { activeFilters, filteredItems, isFiltering, setActiveFilters } =
    useListingFilters(items, filters);

  return (
    <ListingPageShell
      eyebrow={config.eyebrow}
      description={config.description}
      items={filteredItems}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      isFiltering={isFiltering}
      filtersLabel={config.filtersLabel}
      extraControls={<RadiusSlider defaultMiles={radiusMiles} />}
      cardConfig={{
        eyebrowKey: 'category',
        action: {
          label: 'View details',
          to: (item) => `/${config.routePrefix}/${item.id}`,
        },
        highlightLabel: config.highlightLabel,
        highlightValueKey: 'quantity',
        detailFields: config.detailFields,
      }}
    />
  );
}
