
from http.server import BaseHTTPRequestHandler, HTTPServer
from access import enforce_access
from routes import authHandler
from routes import serveHandler
from routes import listingHandler
from routes import offerHandler

ROUTERS = [
    authHandler.router,
    listingHandler.router,  # handles listing details and accept/order API routes
    offerHandler.router, # handles offer creation
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
            
    def do_PATCH(self):
        if not enforce_access(self):
            return
        
        for router in ROUTERS:
            if router.handle(self):
                return
            
    def do_DELETE(self):
        if not enforce_access(self):
            return
        
        for router in ROUTERS:
            if router.handle(self):
                return
 
if __name__ == "__main__":
    server = HTTPServer(("localhost", 3000), Handler)
    print("Server running on http://localhost:3000")
    server.serve_forever()