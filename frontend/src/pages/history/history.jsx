import { useLoaderData } from "react-router-dom";

import ListingPageShell from "../../components/listingPageShell.jsx";

export default function History() {
  const { items, filters, stats } = useLoaderData();

  return (
    <ListingPageShell
      eyebrow="Record History"
      title="Past offers, requests, and inactive activity"
      description="This history page collects completed, expired, canceled, and archived records so users can review past activity without mixing it into active offer and request workflows."
      items={items}
      filters={filters}
      stats={stats}
      secondaryAction={{ label: "Back to Home", to: "/home" }}
      filtersLabel="History filters:"
      cardConfig={{
        eyebrowKey: "status",
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
