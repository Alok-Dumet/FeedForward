import mimetypes

def handle(handler):
    if handler.path.startswith("/assets/"):
        handleAssets(handler)
    else:
        serveFrontend(handler)

def handleAssets(handler):
    file_path = f"../frontend/dist{handler.path}"
    mime_type, _ = mimetypes.guess_type(file_path)
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        handler.send_response(200)
        handler.send_header("Content-Type", mime_type)
        handler.send_header("Content-Length", len(content))
        handler.end_headers()
        handler.wfile.write(content)
    except FileNotFoundError:
        handler.send_response(404)
        handler.end_headers()

def serveFrontend(handler):
    with open("../frontend/dist/index.html", "rb") as f:
        content = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", "text/html")
    handler.send_header("Content-Length", len(content))
    handler.end_headers()
    handler.wfile.write(content)