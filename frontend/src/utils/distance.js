const EARTH_RADIUS_MILES = 3958.8;

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getRadiusMiles(request, preferredRadiusMiles, fallback = 25) {
  const url = new URL(request.url);
  const urlRadius = toFiniteNumber(url.searchParams.get("radius_miles"));

  if (urlRadius !== null && urlRadius >= 0) {
    return urlRadius;
  }

  const preferred = toFiniteNumber(preferredRadiusMiles);
  return preferred !== null && preferred >= 0 ? preferred : fallback;
}

export function haversineMiles(origin, destination) {
  const originLat = toFiniteNumber(origin?.latitude);
  const originLon = toFiniteNumber(origin?.longitude);
  const destinationLat = toFiniteNumber(destination?.latitude);
  const destinationLon = toFiniteNumber(destination?.longitude);

  if (
    originLat === null ||
    originLon === null ||
    destinationLat === null ||
    destinationLon === null
  ) {
    return null;
  }

  const lat1 = (originLat * Math.PI) / 180;
  const lat2 = (destinationLat * Math.PI) / 180;
  const deltaLat = ((destinationLat - originLat) * Math.PI) / 180;
  const deltaLon = ((destinationLon - originLon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));

  return EARTH_RADIUS_MILES * c;
}

export function withDistanceFilteredRecords(records, currentUser, radiusMiles) {
  const origin = {
    latitude: currentUser?.latitude,
    longitude: currentUser?.longitude,
  };

  return records
    .map((record) => {
      const distance = haversineMiles(origin, record.location);

      return {
        ...record,
        distance_miles: distance === null ? null : Math.round(distance * 10) / 10,
      };
    })
    .filter((record) => record.distance_miles === null || record.distance_miles <= radiusMiles)
    .sort((a, b) => {
      if (a.distance_miles === null && b.distance_miles === null) {
        return 0;
      }
      if (a.distance_miles === null) {
        return 1;
      }
      if (b.distance_miles === null) {
        return -1;
      }

      return a.distance_miles - b.distance_miles;
    });
}
