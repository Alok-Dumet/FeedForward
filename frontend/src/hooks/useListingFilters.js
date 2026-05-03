import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from 'react-router-dom';

export default function useListingFilters(items, filters) {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? null);
  const [isLocalFiltering, setIsLocalFiltering] = useState(false);
  const filteredItems = useMemo(() => {
    if (!activeFilter || activeFilter === filters[0]) {
      return items;
    }

    return items.filter((item) => item.tags.includes(activeFilter));
  }, [activeFilter, filters, items]);

  useEffect(() => {
    if (!isLocalFiltering) {
      return undefined;
    }

    const handle = window.setTimeout(() => setIsLocalFiltering(false), 250);
    return () => window.clearTimeout(handle);
  }, [filteredItems, isLocalFiltering]);

  return {
    activeFilter,
    filteredItems,
    isFiltering: isLocalFiltering || navigation.state !== 'idle',
    setActiveFilter(filter) {
      setIsLocalFiltering(true);
      setActiveFilter(filter);
    },
  };
}
