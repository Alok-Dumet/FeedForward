import json

#We will use this helper function for sending JSON responses
def send_json(self, status, data):
    body = json.dumps(data).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(len(body)))
    self.end_headers()
    self.wfile.write(body)

#We will use this helper function for parsing request bodies. None is sent back if there's a malformed json or if the json sent wasn't a dictionary
def parse_body(self):
    length = int(self.headers.get("Content-Length", 0))
    if not length:
        return {}

    raw = self.rfile.read(length)

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

#We will use this helper function for validating if the user sent all the proper field
def require_fields(body, field_names):
    missing = []

    for name in field_names:
        value = body.get(name)

        if value is None:
            missing.append(name)
        elif isinstance(value, str) and value == "":
            missing.append(name)
        elif not isinstance(value, str) and not value:
            missing.append(name)

    return missing

#We will combine the parsing, stripping, and validation helpers into one function for our handlers
#It'll send back None if there was an error, otherwise it'll send back the validated body
def parse_validate_body(self, required_fields):
    body = parse_body(self)

    if body is None:
        send_json(self, 400, {"error": "Invalid JSON body"})
        return None

    body = strip_strings(body)

    missing = require_fields(body, required_fields)
    if missing:
        send_json(self, 400, {"error": f"Missing fields: {', '.join(missing)}"})
        return None

    return body
