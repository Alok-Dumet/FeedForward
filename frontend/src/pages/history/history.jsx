import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function History() {
  const { items, filters } = useLoaderData();

  return (
    <ListingPageShell
      eyebrow="History"
      title="History"
      description="Review completed and cancelled listings"
      items={items}
      filters={filters}
      secondaryAction={null}
      filtersLabel="History filters:"
      cardConfig={{
        variant: "compactHistory",
        eyebrowKey: "status",
        metaKey: "timeline",
        action: {
          label: "View details",
          to: (item) => `/history/${item.id}`,
        },
        highlightLabel: "Quantity",
        highlightValueKey: "quantity",
        detailFields: [
          { label: "Timeline", key: "timeline" },
          { label: "Location", key: "location" },
          { label: "Type", key: "recordType" },
        ],
      }}
    />
  );
}
