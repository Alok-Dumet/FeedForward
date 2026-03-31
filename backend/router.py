class Router:
    def __init__(self):
        self.routes = []

    def get(self, path, handler):
        self.routes.append(('GET', path, handler))

    def post(self, path, handler):
        self.routes.append(('POST', path, handler))

    def delete(self, path, handler):
        self.routes.append(('DELETE', path, handler))

    def patch(self, path, handler):
        self.routes.append(('PATCH', path, handler))

    def handle(self, handler):
        for method, path, fn in self.routes:
            if handler.command == method and handler.path == path:
                fn(handler)
                return True
        return False