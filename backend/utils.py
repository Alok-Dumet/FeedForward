import json
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse, parse_qs


#We will use this set as the single source of truth for valid food categories
ALLOWED_FOOD_CATEGORIES = {
    "produce",
    "dairy",
    "baked_goods",
    "canned_goods",
    "frozen",
    "prepared_meals",
    "beverages",
    "dry_goods",
    "meat_seafood",
    "snacks",
    "baby_food",
    "mixed",
    "other",
}


#We will use this helper function to normalize request paths by stripping query strings and trailing slashes
def normalize_path(raw_path):
    path = urlparse(raw_path).path
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return path

#We will use this helper function for sending JSON responses and cookies
def send_json(self, status, data, headers=None):
    body = json.dumps(data).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(len(body)))

    if headers:
        for header_name, header_value in headers:
            self.send_header(header_name, header_value)

    self.end_headers()
    self.wfile.write(body)

#We will use this helper function for parsing request bodies.
def parse_body(self):
    length = int(self.headers.get("Content-Length", 0))
    if not length:
        return {}

    raw = self.rfile.read(length)

    #None is sent back if there's a malformed json or if the json sent wasn't a dictionary
    try:
        body = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    if not isinstance(body, dict):
        return None

    return body

#We will use this helper function for stripping the whitespace from string values in the body
def strip_strings(body):
    stripped_body = {}

    for key, value in body.items():
        if isinstance(value, str):
            stripped_body[key] = value.strip()
        else:
            stripped_body[key] = value

    return stripped_body

#We will use this helper function for validating if the user sent all the proper field. Only None and empty strings count as missing.
def require_fields(body, field_names):
    missing = []

    for name in field_names:
        value = body.get(name)

        if value is None:
            missing.append(name)
        elif isinstance(value, str) and value == "":
            missing.append(name)

    return missing

#We will combine the parsing, stripping, and validation helpers into one function for our handlers
def parse_validate_body(self, required_fields):
    body = parse_body(self)

    if body is None:
        send_json(self, 400, {"error": "Invalid JSON body"})
        return None

    body = strip_strings(body)

    #It'll send back None if there was an error, otherwise it'll send back the validated body
    missing = require_fields(body, required_fields)
    if missing:
        send_json(self, 400, {"error": f"Missing fields: {', '.join(missing)}"})
        return None

    return body


#We will pull a single query-string parameter out of the request URL, returning None if it's absent
def get_query_param(handler, name):
    query = urlparse(handler.path).query
    values = parse_qs(query).get(name)
    if not values:
        return None
    return values[0]


#We will parse an ISO datetime string and require a timezone offset so we never store naive timestamps
def parse_datetime(value, field_name):
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name} must be a valid ISO datetime")

    #Python's fromisoformat() didn't accept the trailing "Z" UTC suffix until 3.11, so we swap it for the explicit offset
    text = value[:-1] + "+00:00" if value.endswith("Z") else value

    try:
        parsed = datetime.fromisoformat(text)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO datetime") from exc

    if parsed.tzinfo is None:
        raise ValueError(f"{field_name} must include a timezone offset")

    return parsed


#We will parse an optional ISO date string. None or "" returns None; anything else must be a valid date
def parse_optional_date(value, field_name):
    if value in (None, ""):
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a valid ISO date")

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO date") from exc


#We will parse a value into a Decimal and wrap any conversion error with a friendly field-named message
def parse_decimal(value, field_name):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid number") from exc


#We will validate a food category against the allowed set. Returns the canonical value or None if invalid (no aliasing — frontend must send exact backend strings)
def validate_food_category(value):
    if not isinstance(value, str):
        return None

    normalized = value.strip().lower()
    return normalized if normalized in ALLOWED_FOOD_CATEGORIES else None
