from sessions import get_user
from utils import send_json, normalize_path

#We will define which API paths are public, which require a specific role, and which page paths need auth
PUBLIC_PATHS = {
    "/api/login",
    "/api/register",
    "/api/logout",
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

    is_api = path.startswith("/api/")
    if is_api and path in PUBLIC_PATHS:
        return True

    required_role = ROLE_PROTECTED_PATHS.get(path)
    needs_auth = is_api or required_role or path in PROTECTED_PAGE_PATHS
    if not needs_auth:
        return True

    try:
        user = get_user(handler)
    except Exception:
        send_json(handler, 500, {"error": "Unable to load session due to a server error."})
        return False

    if user is None:
        if is_api:
            send_json(handler, 401, {"error": "Not authenticated"})
        else:
            redirect(handler, "/login")
        return False

    if required_role and user["role"] != required_role:
        if is_api:
            send_json(handler, 403, {"error": "Not authorized"})
        else:
            redirect(handler, "/not_authorized")
        return False

    return True
