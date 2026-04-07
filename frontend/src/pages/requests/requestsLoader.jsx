export default async function requestsLoader() {
  return {
    filters: [
      "Prepared meals",
      "Family packs",
      "Weekend support",
      "South Brooklyn",
    ],
    stats: [
      { label: "Open Requests", value: "9" },
      { label: "Urgent Today", value: "4" },
      { label: "Community Partners", value: "6" },
    ],
    items: [
      {
        id: "request-1",
        title: "After-school meal support",
        category: "Youth Program",
        quantity: "35 meals needed",
        neededBy: "Today, before 4:30 PM",
        location: "Sunset Park",
        audience: "Elementary students in after-care",
        summary:
          "A neighborhood program is coordinating take-home dinners for students staying late for tutoring and enrichment.",
        tags: ["Prepared meals", "Kid-friendly", "Weekday pickup"],
      },
      {
        id: "request-2",
        title: "Shelter breakfast restock",
        category: "Emergency Shelter",
        quantity: "18 breakfast kits",
        neededBy: "Tomorrow, 6:00 AM - 8:00 AM",
        location: "Harlem",
        audience: "Adults in overnight shelter",
        summary:
          "Staff are looking for simple breakfast items to cover an expected rise in overnight occupancy.",
        tags: ["Morning delivery", "Grab-and-go", "High priority"],
      },
      {
        id: "request-3",
        title: "Weekend pantry produce request",
        category: "Food Pantry",
        quantity: "22 produce boxes",
        neededBy: "Saturday, before 11:00 AM",
        location: "South Bronx",
        audience: "Families picking up weekly groceries",
        summary:
          "Volunteers are preparing produce tables for a Saturday distribution focused on households with children and older adults.",
        tags: ["Fresh produce", "Family support", "Bulk pickup"],
      },
    ],
  };
}
