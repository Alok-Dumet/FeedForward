import json
import urllib.parse
import urllib.request

# Our URL and our identification so they can contact us in case we violate rate limits (I hope I don't do that...)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "FeedForward/0.1 (school project; contact: aenugualok@gmail.com)"


# We will look up a US city/state with Nominatim and return (latitude, longitude)
def geocode_city_state(city, state):
    if not isinstance(city, str) or not city.strip():
        raise ValueError("City is required")
    if not isinstance(state, str) or not state.strip():
        raise ValueError("State is required")

    query = urllib.parse.urlencode(
        {
            "city": city.strip(),
            "state": state.strip(),
            "country": "United States",
            "format": "json",
            "limit": 1,
            "countrycodes": "us",
        }
    )
    url = f"{NOMINATIM_URL}?{query}"

    request = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise ValueError("Unable to reach the geocoding service") from exc

    if not payload:
        raise ValueError("We couldn't find that city and state. Please check the spelling.")

    first = payload[0]
    return first["lat"], first["lon"]
