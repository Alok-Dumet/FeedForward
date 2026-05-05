import { useState } from 'react';

const ALL_FILTERS = new Set(['All offers', 'All requests', 'All listings', 'All records']);

// Decides how to change filters based on what filter gets selected
// The all button removes all filters
// Selecting an active filter de-selects it
// Otherwise the filter is added
function getNextFilters(currentFilters, selectedFilter) {
  if (!selectedFilter || ALL_FILTERS.has(selectedFilter)) {
    return [];
  }

  if (currentFilters.includes(selectedFilter)) {
    return currentFilters.filter((filter) => filter !== selectedFilter);
  }

  return [...currentFilters, selectedFilter];
}

// Returns true if a listing matches all the currently selected filters
function itemHasEveryFilter(item, activeFilters) {
  return activeFilters.every((filter) => item.tags.includes(filter));
}

// Our custom hook that will return the currently active filters and items and a function updates them anytime a filter is selected
export default function useListingFilters(items) {
  const [activeFilters, setActiveFiltersState] = useState([]);

  // Whenever a user touches a filter we update what filters are active
  function setActiveFilters(selectedFilter) {
    setActiveFiltersState((currentFilters) => getNextFilters(currentFilters, selectedFilter));
  }

  // Filter all our items based on what filters are active
  const filteredItems = activeFilters.length === 0 ? items : items.filter((item) => itemHasEveryFilter(item, activeFilters));

  return {
    activeFilters,
    filteredItems,
    setActiveFilters,
  };
}
