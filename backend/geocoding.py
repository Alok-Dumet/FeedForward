import json
import urllib.parse
import urllib.request


#Our URL and our identification so they can contact us in case we violate rate limits (I hope I don't do that...)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "FeedForward/0.1 (school project; contact: aenugualok@gmail.com)"


#We will seperate our errors from Geocoding errors with a custom exception
class GeocodingError(Exception):
    pass


#We will look up an address with Nominatim and return (latitude, longitude)
def geocode_address(address_text):
    if not isinstance(address_text, str) or not address_text.strip():
        raise GeocodingError("Address is required")

    query = urllib.parse.urlencode({
        "q": address_text.strip(),
        "format": "json",
        "limit": 1,
    })
    url = f"{NOMINATIM_URL}?{query}"

    request = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise GeocodingError("Unable to reach the geocoding service") from exc

    if not payload:
        raise GeocodingError("We couldn't find that address. Please try a more specific one.")

    first = payload[0]
    try:
        latitude = first["lat"]
        longitude = first["lon"]
    except (KeyError, TypeError) as exc:
        raise GeocodingError("Geocoding service returned an unexpected response") from exc

    return latitude, longitude
