import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function History() {
  const { items, filters } = useLoaderData();

  return (
    <ListingPageShell
      title="History"
      description="Review completed, expired, canceled, and archived records in one place."
      items={items}
      filters={filters}
      stats={[]}
      secondaryAction={null}
      filtersLabel="History filters:"
      lightHeader
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
