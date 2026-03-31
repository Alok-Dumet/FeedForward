
from http.server import BaseHTTPRequestHandler, HTTPServer
from routes import authHandler
from routes import serveHandler

ROUTERS = [
    authHandler.router,
]

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        for router in ROUTERS:
            if router.handle(self):
                return
        serveHandler.handle(self) #This serves our frontend files. It's triggered if none of the other routes are called

    def do_POST(self):
        for router in ROUTERS:
            if router.handle(self):
                return
            
    def do_PATCH(self):
        for router in ROUTERS:
            if router.handle(self):
                return
            
    def do_DELETE(self):
        for router in ROUTERS:
            if router.handle(self):
                return
 
if __name__ == "__main__":
    server = HTTPServer(("localhost", 3000), Handler)
    print("Server running on http://localhost:3000")
    server.serve_forever()