import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from 'react-router-dom';

export default function useListingFilters(items, filters) {
  const navigation = useNavigation();
  const [activeFilters, setActiveFilters] = useState([]);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const allFilter = filters[0] ?? null;
  const filteredItems = useMemo(() => {
    if (activeFilters.length === 0) {
      return items;
    }

    return items.filter((item) =>
      activeFilters.every((filter) => item.tags.includes(filter))
    );
  }, [activeFilters, items]);

  useEffect(() => {
    if (!isLocalFiltering) {
      return undefined;
    }

    const handle = window.setTimeout(() => setIsLocalFiltering(false), 250);
    return () => window.clearTimeout(handle);
  }, [filteredItems, isLocalFiltering]);

  return {
    activeFilters,
    filteredItems,
    isFiltering: isLocalFiltering || navigation.state !== 'idle',
    setActiveFilters(filter) {
      setIsLocalFiltering(true);
      setActiveFilters((currentFilters) => {
        if (!filter || filter === allFilter) {
          return [];
        }
        if (currentFilters.includes(filter)) {
          return currentFilters.filter(
            (currentFilter) => currentFilter !== filter
          );
        }
        return [...currentFilters, filter];
      });
    },
  };
}
