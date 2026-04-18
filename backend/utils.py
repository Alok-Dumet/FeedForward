import json
from urllib.parse import urlparse, parse_qs

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




def get_query_param(handler, name): # start of get_query_param() function definition

    """ extracts one query parameter from the request URL """

    query = urlparse(handler.path).query # take the request path, parse it as a URL and pull out only the query-string portion
    values = parse_qs(query).get(name) # parse the query string into a dictionary and get the list of values for the requested parameter names

    if not values: # check whether the parameter was missing or had no values
        return None # let the call know value was absent

    return values[0] # return the first value for that parameter since query params come back as lists
# end of get_query_param() function definition