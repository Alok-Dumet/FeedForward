import { useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { motion as Motion } from "motion/react";

import ListingCard from "../../components/listingCard.jsx";
import PaginationControls from "../../components/paginationControls.jsx";
import usePagination from "../../hooks/usePagination.js";

const FILTERS = ["All listings", "Posted by you", "Accepted by you"];

export default function UserOffers() {
  const { items } = useLoaderData();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const filteredItems = useMemo(() => {
    if (activeFilter === FILTERS[0]) {
      return items;
    }

    return items.filter((item) => item.tags.includes(activeFilter));
  }, [activeFilter, items]);
  const pagination = usePagination(filteredItems);

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
            My Offers
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
            Manage your active offers
          </h1>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Show:</span>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setActiveFilter(filter);
                  pagination.setPage(1);
                }}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "border-slate-900 bg-slate-900 text-white hover:border-slate-900 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-800"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </Motion.section>

        <section className="grid gap-5">
          {pagination.pageItems.map((item, index) => (
            <Motion.div
              key={item.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.4, ease: "easeOut" }}
              className="grid"
            >
              <ListingCard
                eyebrow={item.status}
                title={item.title}
                summary={item.summary}
                highlightLabel="Quantity"
                highlightValue={item.quantity}
                detailItems={[
                  { label: "Available Times", value: item.availability },
                  { label: "Location", value: item.location },
                  { label: "Best For", value: item.audience },
                ]}
                tags={item.tags}
                action={{
                  label: "View details",
                  to: item.detailsPath,
                }}
              />
            </Motion.div>
          ))}
        </section>

        <PaginationControls {...pagination} />
      </div>
    </main>
  );
}
