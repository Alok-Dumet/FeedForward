import mimetypes
import os


#We will resolve the dist directory once at import time so the path is absolute regardless of where the server was launched from
DIST_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))


#GET request handler that serves assets or the frontend app shell
def handle(handler):
    if handler.path.startswith("/assets/"):
        handleAssets(handler)
    else:
        serveFrontend(handler)

#GET request handler that serves built frontend assets
def handleAssets(handler):
    #We will resolve the requested path and confirm it stays inside DIST_DIR so an attacker cannot escape with "../" segments
    requested = os.path.realpath(os.path.join(DIST_DIR, handler.path.lstrip("/")))
    if not (requested == DIST_DIR or requested.startswith(DIST_DIR + os.sep)):
        handler.send_response(403)
        handler.end_headers()
        return

    mime_type, _ = mimetypes.guess_type(requested)
    try:
        with open(requested, "rb") as f:
            content = f.read()
        handler.send_response(200)
        handler.send_header("Content-Type", mime_type)
        handler.send_header("Content-Length", len(content))
        handler.end_headers()
        handler.wfile.write(content)
    except FileNotFoundError:
        handler.send_response(404)
        handler.end_headers()

#GET request handler that serves the built frontend app shell
def serveFrontend(handler):
    #We will return 404 instead of crashing if the frontend hasn't been built yet
    index_path = os.path.join(DIST_DIR, "index.html")
    try:
        with open(index_path, "rb") as f:
            content = f.read()
    except FileNotFoundError:
        handler.send_response(404)
        handler.end_headers()
        return

    handler.send_response(200)
    handler.send_header("Content-Type", "text/html")
    handler.send_header("Content-Length", len(content))
    handler.end_headers()
    handler.wfile.write(content)
