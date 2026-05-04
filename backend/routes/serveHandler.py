import mimetypes
import os

# We will get the path to the dist directory
DIST_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))


# We will serve built assets or the frontend app shell
def handle(handler):
    if handler.path.startswith("/assets/"):
        handle_assets(handler)
    else:
        serve_frontend(handler)


# We will serve built frontend assets
def handle_assets(handler):
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
        handler.send_header("Content-Type", mime_type or "application/octet-stream")
        handler.send_header("Content-Length", str(len(content)))
        handler.end_headers()
        handler.wfile.write(content)
    except FileNotFoundError:
        handler.send_response(404)
        handler.end_headers()


# We will serve the built frontend app shell
def serve_frontend(handler):
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
    handler.send_header("Content-Length", str(len(content)))
    handler.end_headers()
    handler.wfile.write(content)
