import json

#We will use this helper function for sending JSON responses
def send_json(self, status, data):
    body = json.dumps(data).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", str(len(body)))
    self.end_headers()
    self.wfile.write(body)

#We will use this helper function for parsing request bodies
def parse_body(self):
    length = int(self.headers.get("Content-Length", 0))
    if not length:
        return {}
    raw = self.rfile.read(length)
    return json.loads(raw.decode("utf-8"))

#We will use this helper function for validating if the user sent all the proper field
def require_fields(body, field_names):
    return [name for name in field_names if not body.get(name)]