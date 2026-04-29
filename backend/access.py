from sessions import get_user
from utils import send_json, normalize_path

#We will define which API paths are public, which require a specific role, and which page paths need auth
PUBLIC_PATHS = {
    "/api/login",
    "/api/register",
}

ROLE_PROTECTED_PATHS = {
    "/api/listings/offers/create": "food_provider",
    "/api/listings/requests/create": "recipient_organization",
}

PROTECTED_PAGE_PATHS = {
    "/history",
}

#We will use this helper function for redirecting users
def redirect(handler, location):
    handler.send_response(302)
    handler.send_header("Location", location)
    handler.end_headers()

#We will check authentication for all API paths by default, unless they are explicitly public
def enforce_access(handler):
    path = normalize_path(handler.path)

    if path.startswith("/assets/"):
        return True

    if path.startswith("/api/"):
        if path in PUBLIC_PATHS:
            return True

        try:
            user = get_user(handler)
        except Exception:
            send_json(handler, 500, {"error": "Unable to load session due to a server error."})
            return False

        if user is None:
            send_json(handler, 401, {"error": "Not authenticated"})
            return False

        required_role = ROLE_PROTECTED_PATHS.get(path)
        if required_role and user["role"] != required_role:
            send_json(handler, 403, {"error": "Not authorized"})
            return False

        return True

    required_role = ROLE_PROTECTED_PATHS.get(path)
    if required_role:
        try:
            user = get_user(handler)
        except Exception:
            send_json(handler, 500, {"error": "Unable to load session due to a server error."})
            return False
        if user is None:
            redirect(handler, "/login")
            return False
        if user["role"] != required_role:
            redirect(handler, "/not_authorized")
            return False
        return True

    if path in PROTECTED_PAGE_PATHS:
        try:
            user = get_user(handler)
        except Exception:
            send_json(handler, 500, {"error": "Unable to load session due to a server error."})
            return False
        if user is None:
            redirect(handler, "/login")
            return False

    return True
