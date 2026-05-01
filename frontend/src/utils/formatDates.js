const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });

//We will turn two ISO timestamps into "Apr 15, 2026, 5:30 PM - 7:00 PM" for display on listing cards
//There are fallback messages in case no
export function formatPickupWindow(start, end) {
  if (!start || !end) {
    return "Pickup window to be confirmed";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Invalid pickup window";
  }

  return `${dateFmt.format(startDate)}, ${timeFmt.format(startDate)} - ${timeFmt.format(endDate)}`;
}
