from http.server import BaseHTTPRequestHandler, HTTPServer

from access import enforce_access
from routes import (
    authHandler,
    claimHandler,
    historyHandler,
    listingHandler,
    serveHandler,
)
from utils import send_json

ROUTERS = [
    authHandler.router,
    listingHandler.router,
    claimHandler.router,
    historyHandler.router,
]


class Handler(BaseHTTPRequestHandler):
    # GET request handler that routes API calls or serves the frontend app
    def do_GET(self):
        if not enforce_access(self):
            return

        for router in ROUTERS:
            if router.handle(self):
                return
        serveHandler.handle(self)

    # POST request handler that routes API calls
    def do_POST(self):
        if not enforce_access(self):
            return

        for router in ROUTERS:
            if router.handle(self):
                return
        send_json(self, 404, {"error": "Not found"})

    # PATCH request handler that routes API calls
    def do_PATCH(self):
        if not enforce_access(self):
            return

        for router in ROUTERS:
            if router.handle(self):
                return
        send_json(self, 404, {"error": "Not found"})


if __name__ == "__main__":
    server = HTTPServer(("localhost", 3000), Handler)
    print("Server running on http://localhost:3000")
    server.serve_forever()
