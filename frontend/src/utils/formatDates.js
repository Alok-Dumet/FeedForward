const timeFmt = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });

const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function formatTime(value) {
  if (!value) {
    return 'time TBD';
  }

  const date = new Date(`2026-01-01T${value}`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return timeFmt.format(date);
}

//We will turn listing availability entries into a compact schedule for cards and details
export function formatAvailabilityWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return 'Availability to be coordinated';
  }

  return windows
    .map((window) => {
      const day = DAY_LABELS[window.day] ?? window.day ?? 'Day TBD';
      return `${day} ${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
    })
    .join('; ');
}
