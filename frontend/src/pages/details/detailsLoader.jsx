function buildOfferRecord(id) {
  const records = {
    "offer-1": {
      title: "Prepared lunch trays",
      status: "Ready for pickup",
      orderNumber: "OFF-2026-1001",
      organization_name: "Downtown Mutual Aid Network",
      completionTime: "Today at 6:15 PM",
      address: "85 Smith Street, Brooklyn, NY 11201",
      phoneNumber: "(718) 555-0124",
      items: [
        { name: "Rice bowl trays", quantity: "18 trays" },
        { name: "Roasted vegetable packs", quantity: "6 packs" },
      ],
    },
    "offer-2": {
      title: "Assorted bread and pastries",
      status: "Scheduled",
      orderNumber: "OFF-2026-1002",
      organization_name: "City Pantry Partners",
      completionTime: "Tomorrow at 8:00 AM",
      address: "140 Delancey Street, New York, NY 10002",
      phoneNumber: "(212) 555-0167",
      items: [
        { name: "Baguette trays", quantity: "3 trays" },
        { name: "Pastry boxes", quantity: "3 boxes" },
      ],
    },
    "offer-3": {
      title: "Mixed produce boxes",
      status: "Open",
      orderNumber: "OFF-2026-1003",
      organization_name: "Queens Family Pantry",
      completionTime: "Today at 4:30 PM",
      address: "22 Jackson Avenue, Long Island City, NY 11101",
      phoneNumber: "(347) 555-0191",
      items: [
        { name: "Tomato boxes", quantity: "5 boxes" },
        { name: "Greens boxes", quantity: "4 boxes" },
        { name: "Cucumber boxes", quantity: "5 boxes" },
      ],
    },
    "owned-offer-1": {
      title: "Prepared lunch trays",
      status: "Awaiting pickup",
      orderNumber: "OFF-2026-2001",
      organization_name: "Brooklyn Shelter Collective",
      completionTime: "Today at 6:45 PM",
      address: "55 Court Street, Brooklyn, NY 11201",
      phoneNumber: "(718) 555-0133",
      items: [
        { name: "Lunch tray sets", quantity: "24 servings" },
      ],
    },
    "owned-offer-2": {
      title: "Bakery recovery boxes",
      status: "Matched",
      orderNumber: "OFF-2026-2002",
      organization_name: "Morning Fridge Volunteers",
      completionTime: "Tomorrow at 8:30 AM",
      address: "19 Schermerhorn Street, Brooklyn, NY 11201",
      phoneNumber: "(718) 555-0182",
      items: [
        { name: "Bakery recovery crates", quantity: "8 crates" },
      ],
    },
    "owned-offer-3": {
      title: "Mixed produce boxes",
      status: "Draft",
      orderNumber: "OFF-2026-2003",
      organization_name: "To be confirmed",
      completionTime: "To be confirmed",
      address: "Downtown Brooklyn",
      phoneNumber: "To be confirmed",
      items: [
        { name: "Produce boxes", quantity: "14 boxes" },
      ],
    },
  };

  return records[id] ?? records["offer-1"];
}

function buildRequestRecord(id) {
  const records = {
    "request-1": {
      title: "After-school meal support",
      status: "Awaiting match",
      orderNumber: "REQ-2026-3001",
      organization_name: "Sunset Park Learning Center",
      completionTime: "Today before 4:30 PM",
      address: "310 45th Street, Brooklyn, NY 11220",
      phoneNumber: "(718) 555-0109",
      items: [
        { name: "Prepared meal packs", quantity: "35 meals" },
      ],
    },
    "request-2": {
      title: "Shelter breakfast restock",
      status: "Open",
      orderNumber: "REQ-2026-3002",
      organization_name: "Harlem Safe Stay Shelter",
      completionTime: "Tomorrow at 7:00 AM",
      address: "118 West 124th Street, New York, NY 10027",
      phoneNumber: "(212) 555-0148",
      items: [
        { name: "Breakfast kits", quantity: "18 kits" },
      ],
    },
    "request-3": {
      title: "Weekend pantry produce request",
      status: "Scheduled",
      orderNumber: "REQ-2026-3003",
      organization_name: "South Bronx Community Pantry",
      completionTime: "Saturday before 11:00 AM",
      address: "245 Willis Avenue, Bronx, NY 10454",
      phoneNumber: "(718) 555-0142",
      items: [
        { name: "Produce boxes", quantity: "22 boxes" },
      ],
    },
    "owned-request-1": {
      title: "Weekend pantry produce request",
      status: "Awaiting match",
      orderNumber: "REQ-2026-4001",
      organization_name: "South Bronx Community Pantry",
      completionTime: "Saturday before 11:00 AM",
      address: "245 Willis Avenue, Bronx, NY 10454",
      phoneNumber: "(718) 555-0142",
      items: [
        { name: "Produce boxes", quantity: "22 boxes" },
      ],
    },
    "owned-request-2": {
      title: "After-school meal support",
      status: "Scheduled",
      orderNumber: "REQ-2026-4002",
      organization_name: "South Bronx Youth Hub",
      completionTime: "Today before 4:30 PM",
      address: "88 Alexander Avenue, Bronx, NY 10454",
      phoneNumber: "(718) 555-0118",
      items: [
        { name: "Prepared meal packs", quantity: "35 meals" },
      ],
    },
    "owned-request-3": {
      title: "Shelter breakfast restock",
      status: "Draft",
      orderNumber: "REQ-2026-4003",
      organization_name: "Harlem Safe Stay Shelter",
      completionTime: "To be confirmed",
      address: "118 West 124th Street, New York, NY 10027",
      phoneNumber: "(212) 555-0148",
      items: [
        { name: "Breakfast kits", quantity: "18 kits" },
      ],
    },
  };

  return records[id] ?? records["request-3"];
}

function buildHistoryRecord(id) {
  const records = {
    "history-1": {
      title: "Prepared lunch trays",
      status: "Completed",
      orderNumber: "HIS-2026-5001",
      organization_name: "Brooklyn Shelter Collective",
      completionTime: "Completed on April 2, 2026",
      address: "55 Court Street, Brooklyn, NY 11201",
      phoneNumber: "(718) 555-0133",
      items: [
        { name: "Lunch tray sets", quantity: "24 servings" },
      ],
    },
    "history-2": {
      title: "Weekend pantry produce request",
      status: "Expired",
      orderNumber: "HIS-2026-5002",
      organization_name: "South Bronx Community Pantry",
      completionTime: "Expired on March 28, 2026",
      address: "245 Willis Avenue, Bronx, NY 10454",
      phoneNumber: "(718) 555-0142",
      items: [
        { name: "Produce boxes", quantity: "22 boxes" },
      ],
    },
    "history-3": {
      title: "Shelter breakfast restock",
      status: "Canceled",
      orderNumber: "HIS-2026-5003",
      organization_name: "Harlem Safe Stay Shelter",
      completionTime: "Canceled on March 21, 2026",
      address: "118 West 124th Street, New York, NY 10027",
      phoneNumber: "(212) 555-0148",
      items: [
        { name: "Breakfast kits", quantity: "18 kits" },
      ],
    },
    "history-4": {
      title: "Bakery recovery boxes",
      status: "Archived",
      orderNumber: "HIS-2026-5004",
      organization_name: "Morning Fridge Volunteers",
      completionTime: "Archived on March 17, 2026",
      address: "19 Schermerhorn Street, Brooklyn, NY 11201",
      phoneNumber: "(718) 555-0182",
      items: [
        { name: "Bakery recovery crates", quantity: "8 crates" },
      ],
    },
  };

  return records[id] ?? records["history-2"];
}

export async function offerDetailsLoader({ params }) {
  return {
    record: {
      id: params.id,
      type: "offer",
      sectionLabel: "Offer Details",
      backTo: "/offers",
      backLabel: "Offers",
      primaryAction: {
        label: "Place Order",
      },
      ...buildOfferRecord(params.id),
    },
  };
}

export async function requestDetailsLoader({ params }) {
  return {
    record: {
      id: params.id,
      type: "request",
      sectionLabel: "Request Details",
      backTo: "/requests",
      backLabel: "Requests",
      primaryAction: {
        label: "Respond to Request",
      },
      ...buildRequestRecord(params.id),
    },
  };
}

export async function historyDetailsLoader({ params }) {
  return {
    record: {
      id: params.id,
      type: "history",
      sectionLabel: "History Details",
      backTo: "/history",
      backLabel: "History",
      ...buildHistoryRecord(params.id),
    },
  };
}
