import json
import urllib.parse
import urllib.request


#Our URL and our identification so they can contact us in case we violate rate limits (I hope I don't do that...)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "FeedForward/0.1 (school project; contact: aenugualok@gmail.com)"


#We will seperate our errors from Geocoding errors with a custom exception
class GeocodingError(Exception):
    pass


#We will look up a US city/state with Nominatim and return (latitude, longitude)
def geocode_city_state(city, state):
    if not isinstance(city, str) or not city.strip():
        raise GeocodingError("City is required")
    if not isinstance(state, str) or not state.strip():
        raise GeocodingError("State is required")

    query = urllib.parse.urlencode({
        "city": city.strip(),
        "state": state.strip(),
        "country": "United States",
        "format": "json",
        "limit": 1,
        "countrycodes": "us",
    })
    url = f"{NOMINATIM_URL}?{query}"

    request = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise GeocodingError("Unable to reach the geocoding service") from exc

    if not payload:
        raise GeocodingError("We couldn't find that city and state. Please check the spelling.")

    first = payload[0]
    try:
        latitude = first["lat"]
        longitude = first["lon"]
    except (KeyError, TypeError) as exc:
        raise GeocodingError("Geocoding service returned an unexpected response") from exc

    return latitude, longitude
