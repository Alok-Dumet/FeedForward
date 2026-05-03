import { motion as Motion } from 'motion/react';

import ListingCard from './listingCard.jsx';
import PaginationControls from './paginationControls.jsx';
import usePagination from '../hooks/usePagination.js';

export default function ListingPageShell({
  eyebrow,
  description,
  items,
  filters = [],
  cardConfig = {},
  filtersLabel = 'Filters:',
  activeFilters = [],
  onFilterChange,
  isFiltering = false,
  extraControls = null,
}) {
  const {
    eyebrowKey = 'category',
    highlightLabel = 'Quantity',
    highlightValueKey = 'quantity',
    variant = 'default',
    metaKey,
    action,
    detailFields = [
      { label: 'Available Times', key: 'availability' },
      { label: 'Location', key: 'location' },
      { label: 'Best For', key: 'audience' },
    ],
  } = cardConfig;
  const pagination = usePagination(items);

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
                {description}
              </h1>
            </div>
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
          className="surface-glass-panel px-6 py-5"
        >
          {extraControls ? <div className="mb-4">{extraControls}</div> : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">
                {filtersLabel}
              </span>
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={
                    onFilterChange ? () => onFilterChange(filter) : undefined
                  }
                  className={`btn-pill ${
                    activeFilters.includes(filter) ||
                    (filter === filters[0] && activeFilters.length === 0)
                      ? 'btn-pill-active'
                      : 'btn-pill-muted'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div
              className={`flex min-w-28 items-center justify-end gap-2 text-sm font-semibold text-slate-600 transition ${
                isFiltering ? 'opacity-100' : 'opacity-0'
              }`}
              aria-live="polite"
              aria-hidden={!isFiltering}
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              <span>Filtering</span>
            </div>
          </div>
        </Motion.section>

        <section className="grid gap-5">
          {pagination.pageItems.map((item) => (
            <ListingCard
              key={item.id}
              variant={variant}
              eyebrow={item[eyebrowKey]}
              title={item.title}
              metaText={metaKey ? item[metaKey] : undefined}
              summary={item.summary}
              highlightLabel={highlightLabel}
              highlightValue={item[highlightValueKey]}
              action={
                action
                  ? {
                      ...action,
                      to:
                        typeof action.to === 'function'
                          ? action.to(item)
                          : action.to,
                    }
                  : undefined
              }
              detailItems={detailFields.map((field) => ({
                label: field.label,
                value: item[field.key],
              }))}
              tags={item.tags}
            />
          ))}
        </section>

        <PaginationControls {...pagination} />
      </div>
    </main>
  );
}
