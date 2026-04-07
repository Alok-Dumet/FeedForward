export default async function detailsLoader() {
  return {
    record: {
      id: "owned-request-14",
      type: "request",
      title: "Weekend pantry produce request",
      status: "Awaiting match",
      createdDate: "April 2, 2026",
      updatedDate: "April 5, 2026",
      category: "Food Pantry",
      quantityLabel: "Need",
      quantityValue: "22 produce boxes",
      timingLabel: "Needed By",
      timingValue: "Saturday, before 11:00 AM",
      locationLabel: "Area",
      locationValue: "South Bronx",
      audienceLabel: "Serving",
      audienceValue: "Families picking up weekly groceries",
      summary:
        "This request was created for the pantry's Saturday distribution and focuses on fresh produce suitable for mixed household sizes.",
      notes:
        "Volunteers can sort and portion items on site. Firm produce is preferred because pickup windows sometimes shift by up to thirty minutes.",
      tags: ["Fresh produce", "Family support", "Weekend pickup"],
      actions: ["Edit record", "Delete", "Mark as completed", "Back to list"],
    },
  };
}
