from sessions import get_user
from utils import send_json
from urllib.parse import urlparse

#We will define which paths are public, require authentication, or require a specific role
PUBLIC_PATHS = {
    "/api/login",
    "/api/register"
}

AUTH_REQUIRED_PATHS = {
    "/api/session",
    "/api/logout",
    "/api/listings/details", # requires login before showing full details for one listing/post
    "/api/listings/accept" # requires login because accepting creates a claim/order for the current user
}

PROTECTED_PAGE_PATHS = {
    "/home"
}

ROLE_PROTECTED_PATHS = {}

#We will use this helper function for redirecting users
def redirect(handler, location):
    handler.send_response(302)
    handler.send_header("Location", location)
    handler.end_headers()

#We will redirect users to login or a not_authorized page only for protected paths
def enforce_access(handler):
    path = urlparse(handler.path).path

    if path.startswith("/assets/"):
        return True

    if path in PUBLIC_PATHS:
        return True

    if path.startswith("/api/"):
        required_role = ROLE_PROTECTED_PATHS.get(path)
        if required_role:
            try:
                user = get_user(handler)
            except Exception:
                send_json(handler, 500, {"error": "Unable to load session due to a server error."})
                return False
            if user is None:
                send_json(handler, 401, {"error": "Not authenticated"})
                return False
            if user["role"] != required_role:
                send_json(handler, 403, {"error": "Not authorized"})
                return False
            return True

        if path in AUTH_REQUIRED_PATHS:
            try:
                user = get_user(handler)
            except Exception:
                send_json(handler, 500, {"error": "Unable to load session due to a server error."})
                return False
            if user is None:
                send_json(handler, 401, {"error": "Not authenticated"})
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
