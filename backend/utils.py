import json
from datetime import date, time
from decimal import Decimal, InvalidOperation
from urllib.parse import parse_qs, urlparse

# We will use this set as the single source of truth for valid food categories
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

ALLOWED_AVAILABILITY_DAYS = {
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
}


# We will strip query strings and trailing slashes
def normalize_path(raw_path):
    path = urlparse(raw_path).path
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return path


# We will use this for sending JSON responses and cookies
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


# We will use this for parsing request bodies
def parse_body(self):
    length = int(self.headers.get("Content-Length", 0))
    if not length:
        return {}

    raw = self.rfile.read(length)

    # None is sent back if there's a malformed json or if the json sent wasn't a dictionary
    try:
        body = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    if not isinstance(body, dict):
        return None

    return body


# We will use this for stripping the whitespace from string values in the body
def strip_strings(body):
    stripped_body = {}

    for key, value in body.items():
        if isinstance(value, str):
            stripped_body[key] = value.strip()
        else:
            stripped_body[key] = value

    return stripped_body


# We will use this for validating if the user sent all the proper field. Only None and empty strings count as missing fields
def require_fields(body, field_names):
    missing = []

    for name in field_names:
        value = body.get(name)

        if value is None:
            missing.append(name)
        elif isinstance(value, str) and value == "":
            missing.append(name)

    return missing


# We will combine the parsing, stripping, and validation helpers into one function for our handlers
def parse_validate_body(self, required_fields):
    body = parse_body(self)

    if body is None:
        send_json(self, 400, {"error": "Invalid JSON body."})
        return None

    body = strip_strings(body)

    # It'll send back None if there was an error, otherwise it'll send back the validated body
    missing = require_fields(body, required_fields)
    if missing:
        send_json(self, 400, {"error": f"Missing fields: {', '.join(missing)}"})
        return None

    return body


# We will check if a single query param was sent and return it
def parse_query_param(handler, name):
    query = urlparse(handler.path).query
    values = parse_qs(query).get(name)
    if not values:
        return None
    return values[0]


# We will check if the input is an ISO formatted date
def parse_ISO_date(value, field_name):
    if value in (None, ""):
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a valid ISO date")

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO date") from exc


# We will parse a value to see if it can be a Decimal for database fields like latitude, longitude, quantity
def parse_decimal(value, field_name):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid number") from exc


# We will pasre a value to see if it can be a positive integer for database fields like listing_id
def parse_positive_int(value, field_name):
    try:
        parsed_value = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid number.") from exc

    if parsed_value <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")

    return parsed_value


# We will validate that a food category exists among our fixed categories
def validate_food_category(value):
    if not isinstance(value, str):
        return None

    value = value.strip()
    return value if value in ALLOWED_FOOD_CATEGORIES else None


# We will validate the foods array sent by listing endpoints
def parse_food_items(value):
    if not isinstance(value, list) or not value:
        raise ValueError("foods must be a non-empty array")

    foods = []

    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"foods[{index}] must be an object")

        item = strip_strings(item)
        missing = require_fields(item, ["name", "category", "quantity", "quantity_unit"])
        if "is_perishable" not in item:
            missing.append("is_perishable")
        if missing:
            raise ValueError(f"foods[{index}] missing fields: {', '.join(missing)}")

        if not isinstance(item["is_perishable"], bool):
            raise ValueError(f"foods[{index}].is_perishable must be a boolean")

        category = validate_food_category(item["category"])
        if category is None:
            raise ValueError(f"foods[{index}].category is invalid")

        quantity = parse_decimal(item["quantity"], f"foods[{index}].quantity")
        if quantity <= 0:
            raise ValueError(f"foods[{index}].quantity must be greater than 0")

        foods.append(
            {
                "name": item["name"],
                "description": item.get("description") or None,
                "category": category,
                "is_perishable": item["is_perishable"],
                "quantity": quantity,
                "quantity_unit": item["quantity_unit"],
                "expiration_date": parse_ISO_date(item.get("expiration_date"), f"foods[{index}].expiration_date"),
            }
        )

    return foods


# We will validate the optional list of days/times when a listing can be exchanged
def parse_availability_windows(value):
    if value in (None, ""):
        return []

    if not isinstance(value, list):
        raise ValueError("availability_windows must be an array")

    windows = []

    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"availability_windows[{index}] must be an object")

        item = strip_strings(item)
        missing = require_fields(item, ["day", "start_time", "end_time"])
        if missing:
            raise ValueError(f"availability_windows[{index}] missing fields: {', '.join(missing)}")

        day = item["day"].strip()
        if day not in ALLOWED_AVAILABILITY_DAYS:
            raise ValueError(f"availability_windows[{index}].day is invalid")

        try:
            start_time = time.fromisoformat(item["start_time"]).replace(second=0, microsecond=0)
            end_time = time.fromisoformat(item["end_time"]).replace(second=0, microsecond=0)
        except ValueError as exc:
            raise ValueError(f"availability_windows[{index}] times must be valid") from exc

        if end_time <= start_time:
            raise ValueError(f"availability_windows[{index}].end_time must be after start_time")

        windows.append(
            {
                "day": day,
                "start_time": start_time.strftime("%H:%M"),
                "end_time": end_time.strftime("%H:%M"),
            }
        )

    return windows
