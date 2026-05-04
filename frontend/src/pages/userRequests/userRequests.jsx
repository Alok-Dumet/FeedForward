/* eslint-disable react-refresh/only-export-components */
import { useLoaderData } from 'react-router-dom';

import ListingCard from '../../components/listingCard.jsx';
import ListingPageShell from '../../components/listingPageShell.jsx';
import useListingFilters from '../../hooks/useListingFilters.js';
import { MY_LISTINGS_FILTERS, createUserListingsLoader } from '../../utils/listings.js';

export const userRequestsLoader = createUserListingsLoader('Unable to load your requests.');

export default function UserRequests() {
  const { items } = useLoaderData();
  const { activeFilters, filteredItems, setActiveFilters } = useListingFilters(items);

  return (
    <ListingPageShell
      eyebrow="My Requests"
      description="Manage your active requests"
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
          highlightLabel="Need"
          highlightValue={item.quantity}
          tags={item.tags}
          action={{ label: 'View details', to: item.detailsPath }}
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
