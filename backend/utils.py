import mimetypes

def send_json(self, status, data):
    body = json.dumps(data).encode()
    self.send_response(status)
    self.send_header("Content-Type", "application/json")
    self.send_header("Content-Length", len(body))
    self.end_headers()
    self.wfile.write(body)

def parse_body(self):
    length = int(self.headers.get("Content-Length", 0))
    return json.loads(self.rfile.read(length)) if length else {}
