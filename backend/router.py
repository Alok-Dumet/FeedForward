from utils import normalize_path


class Router:
    def __init__(self):
        self.routes = []

    def get(self, path, handler):
        self.routes.append(("GET", self._compile_path(path), handler))

    def post(self, path, handler):
        self.routes.append(("POST", self._compile_path(path), handler))

    def patch(self, path, handler):
        self.routes.append(("PATCH", self._compile_path(path), handler))

    # We will split paths so routes can use params like /api/listings/:id
    def _compile_path(self, path):
        return [part for part in normalize_path(path).split("/") if part]

    # We will compare request paths to route patterns and collect params
    def _match_path(self, route_parts, request_parts):
        if len(route_parts) != len(request_parts):
            return None

        params = {}
        for route_part, request_part in zip(route_parts, request_parts):
            if route_part.startswith(":"):
                params[route_part[1:]] = request_part
            elif route_part != request_part:
                return None

        return params

    def handle(self, handler):
        request_path = normalize_path(handler.path)
        request_parts = [part for part in request_path.split("/") if part]

        for method, route_parts, fn in self.routes:
            params = self._match_path(route_parts, request_parts)
            if handler.command == method and params is not None:
                handler.path_params = params
                fn(handler)
                return True
        return False
