export default function PaginationControls({
  currentPage,
  pageCount,
  pageSize,
  setPage,
  totalItems,
}) {
  if (totalItems <= pageSize) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/70 bg-white/75 px-5 py-4 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur-md"
      aria-label="Pagination"
    >
      <span>
        Showing {startItem}-{endItem} of {totalItems}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-amber-300 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2">
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((page) => Math.min(pageCount, page + 1))}
          disabled={currentPage === pageCount}
          className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-amber-300 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
