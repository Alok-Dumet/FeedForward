import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 6;

export default function usePagination(items, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageCount,
    pageItems,
    pageSize,
    setPage,
    totalItems: items.length,
  };
}
