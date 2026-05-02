
from http.server import BaseHTTPRequestHandler, HTTPServer
from access import enforce_access
from utils import send_json
from routes import authHandler
from routes import historyHandler
from routes import serveHandler
from routes import listingHandler
from routes import detailsHandler
from routes import claimHandler
from routes import offerHandler
from routes import requestHandler

ROUTERS = [
    authHandler.router,
    listingHandler.router,  # handles listing feed API routes
    detailsHandler.router,  # handles listing details API routes
    claimHandler.router,  # handles listing claim API routes
    offerHandler.router, # handles offer creation
    requestHandler.router, # handles request creation
    historyHandler.router, 
]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if not enforce_access(self):
            return
        
        for router in ROUTERS:
            if router.handle(self):
                return
        serveHandler.handle(self) #This serves our frontend files. It's triggered if none of the other routes are called

    def do_POST(self):
        if not enforce_access(self):
            return

        for router in ROUTERS:
            if router.handle(self):
                return
        send_json(self, 404, {"error": "Not found"})

    def do_PATCH(self):
        if not enforce_access(self):
            return

        for router in ROUTERS:
            if router.handle(self):
                return
        send_json(self, 404, {"error": "Not found"})

    def do_DELETE(self):
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
