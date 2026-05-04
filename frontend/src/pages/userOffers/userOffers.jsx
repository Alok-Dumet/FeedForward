/* eslint-disable react-refresh/only-export-components */
import { useLoaderData } from 'react-router-dom';

import ListingCard from '../../components/listingCard.jsx';
import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS, createUserListingsLoader } from '../../utils/listings.js';

export const userOffersLoader = createUserListingsLoader('Unable to load your offers.');

export default function UserOffers() {
  const { items } = useLoaderData();
  const { activeFilters, filteredItems, setActiveFilters } = useListingFilters(items);

  return (
    <ListingPageShell
      eyebrow="My Offers"
      description="Manage your active offers"
      items={filteredItems}
      filters={MY_LISTINGS_FILTERS}
      activeFilters={activeFilters}
      onFilterChange={setActiveFilters}
      filtersLabel="Show:"
      renderItem={(item) => (
        <ListingCard
          key={item.id}
          eyebrow={item.status}
          title={item.title}
          summary={item.summary}
          highlightLabel="Quantity"
          highlightValue={item.quantity}
          tags={item.tags}
          action={{ label: 'View details', to: item.detailsPath }}
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
