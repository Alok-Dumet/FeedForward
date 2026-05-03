from sessions import get_user
from utils import normalize_path, send_json

PUBLIC_API_PATHS = {
    "/api/login",
    "/api/register",
    "/api/logout",
}

AUTHENTICATED_API_PATHS = {
    "/api/session",
    "/api/listings",
    "/api/my-listings",
    "/api/listings/details",
    "/api/listings/edit",
    "/api/listings/accept",
    "/api/listings/cancel",
    "/api/listings/complete",
    "/api/history",
}

ROLE_PROTECTED_API_PATHS = {
    "/api/listings/offers/create": "food_provider",
    "/api/listings/requests/create": "recipient_organization",
}

AUTHENTICATED_PAGE_PATHS = {
    "/history",
}

AUTHENTICATED_PAGE_PREFIXES = (
    "/offers/",
    "/requests/",
    "/history/",
    "/users/",
)

ROLE_PROTECTED_PAGE_PATHS = {
    "/offers": "recipient_organization",
    "/requests": "food_provider",
}

USER_PAGE_SECTION_ROLES = {
    "offers": "food_provider",
    "requests": "recipient_organization",
}


def redirect(handler, location):
    handler.send_response(302)
    handler.send_header("Location", location)
    handler.end_headers()


def get_api_required_role(path):
    if path in ROLE_PROTECTED_API_PATHS:
        return ROLE_PROTECTED_API_PATHS[path]
    if path in AUTHENTICATED_API_PATHS:
        return None
    return None


def is_known_protected_api(path):
    return path in AUTHENTICATED_API_PATHS or path in ROLE_PROTECTED_API_PATHS


def get_user_page_access(path):
    parts = path.strip("/").split("/")
    if len(parts) not in (3, 4):
        return None, None

    prefix, user_id, section, *rest = parts
    if prefix != "users" or section not in USER_PAGE_SECTION_ROLES:
        return None, None

    if rest and rest != ["create"]:
        return None, None

    return USER_PAGE_SECTION_ROLES[section], user_id


def get_page_required_role(path):
    user_page_role, _ = get_user_page_access(path)
    if user_page_role:
        return user_page_role
    return ROLE_PROTECTED_PAGE_PATHS.get(path)


def is_protected_page(path):
    return path in AUTHENTICATED_PAGE_PATHS or path in ROLE_PROTECTED_PAGE_PATHS or path.startswith(AUTHENTICATED_PAGE_PREFIXES)


def enforce_access(handler):
    path = normalize_path(handler.path)

    if path.startswith("/assets/"):
        return True

    if path.startswith("/api/") and path not in PUBLIC_API_PATHS and not is_known_protected_api(path):
        return True

    is_api = path.startswith("/api/")
    if is_api and path in PUBLIC_API_PATHS:
        return True

    required_role = get_api_required_role(path) if is_api else get_page_required_role(path)
    needs_auth = is_api or is_protected_page(path)
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
            redirect(handler, "/not_authorized")
        return False

    if required_role and user["role"] != required_role:
        if is_api:
            send_json(handler, 403, {"error": "Not authorized"})
        else:
            redirect(handler, "/not_authorized")
        return False

    _, page_user_id = get_user_page_access(path)
    if page_user_id and str(user["id"]) != page_user_id:
        redirect(handler, "/not_authorized")
        return False

    return True
