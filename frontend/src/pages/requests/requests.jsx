import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function Requests() {
  const { items, filters } = useLoaderData();

  return (
    <ListingPageShell
      eyebrow="Active Requests"
      title="Community food requests awaiting a match"
      description="This page is UI-only and uses mock data to represent demand from schools, shelters, and pantry partners. It is intentionally distinct from offers by focusing on what is needed, when it is needed, and who is being served."
      items={items}
      filters={filters}
      hideHero
      secondaryAction={{ label: "Back to Home", to: "/home" }}
      filtersLabel="Mock filters:"
      cardConfig={{
        eyebrowKey: "category",
        action: {
          label: "View details",
          to: (item) => `/requests/${item.id}`,
        },
        highlightLabel: "Need",
        highlightValueKey: "quantity",
        detailFields: [
          { label: "Needed By", key: "neededBy" },
          { label: "Area", key: "location" },
          { label: "Serving", key: "audience" },
        ],
      }}
    />
  );
}
