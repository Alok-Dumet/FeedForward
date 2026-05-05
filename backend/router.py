from utils import normalize_path


class Router:
    def __init__(self):
        self.routes = []

    def get(self, path, handler):
        self.routes.append(("GET", self.split_path(path), handler))

    def post(self, path, handler):
        self.routes.append(("POST", self.split_path(path), handler))

    def patch(self, path, handler):
        self.routes.append(("PATCH", self.split_path(path), handler))

    # Helper function for splitting paths so routes can use params like /api/listings/:id
    def split_path(self, path):
        return [part for part in normalize_path(path).split("/") if part]

    # Finds the matching route for this request, attaches any path params, and calls its respective handler
    def handle(self, handler):
        request_path = normalize_path(handler.path)
        request_parts = self.split_path(request_path)

        for method, route_parts, route_handler in self.routes:
            # Skip routes with the wrong HTTP method or number of path parts
            if handler.command != method or len(route_parts) != len(request_parts):
                continue

            params = {}
            route_matches = True

            # Compare each route part and collect dynamic params like :id
            for route_part, request_part in zip(route_parts, request_parts, strict=True):
                if route_part.startswith(":"):
                    params[route_part[1:]] = request_part
                elif route_part != request_part:
                    route_matches = False
                    break

            if not route_matches:
                continue

            # Sets the collected parameter and calls the handler
            handler.path_params = params
            route_handler(handler)
            return True

        return False
