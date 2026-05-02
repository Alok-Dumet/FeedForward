import { useLoaderData } from "react-router-dom";
import { motion as Motion } from "motion/react";

import ListingCard from "../../components/listingCard.jsx";

export default function UserRequests() {
  const { filters, items } = useLoaderData();

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-xl backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Request states:</span>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
              >
                {filter}
              </button>
            ))}
          </div>
        </Motion.section>

        <section className="grid gap-5">
          {items.map((item, index) => (
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
                highlightLabel="Need"
                highlightValue={item.quantity}
                detailItems={[
                  { label: "Needed By", value: item.neededBy },
                  { label: "Area", value: item.location },
                  { label: "Serving", value: item.audience },
                ]}
                tags={item.tags}
                action={{
                  label: "Details",
                  to: `/requests/${item.id}`,
                  placement: "inline",
                }}
              />
            </Motion.div>
          ))}
        </section>
      </div>
    </main>
  );
}
