from sessions import get_user
from utils import normalize_path, send_json

# API AUTHENTICATION-------------------------------------------

# API endpoints that anyone can call without being logged in
PUBLIC_API_PATHS = {
    "/api/login",
    "/api/register",
    "/api/logout",
}

# API endpoints that require a logged-in user of any role
AUTHENTICATED_API_PATHS = {
    "/api/session",
    "/api/listings",
}

# PAGE AUTHENTICATION-------------------------------------------

# Page paths anyone can load without being logged in
PUBLIC_PAGE_PATHS = {
    "/",
    "/login",
    "/register",
    "/not_authorized",
}

# Page paths and prefixes that require a logged-in user of any role
AUTHENTICATED_PAGE_PATHS = {
    "/history",
    "/offers",
    "/requests",
    "/users",
}

# Page paths only food providers can load
FOOD_PROVIDER_PAGE_PATHS = {
    "/requests",
}

# Page paths only recipient organizations can load
RECIPIENT_ORGANIZATION_PAGE_PATHS = {
    "/offers",
}


PUBLIC_PATHS = PUBLIC_API_PATHS | PUBLIC_PAGE_PATHS
AUTHENTICATED_PATHS = AUTHENTICATED_API_PATHS | AUTHENTICATED_PAGE_PATHS
FOOD_PROVIDER_PATHS = FOOD_PROVIDER_PAGE_PATHS
RECIPIENT_ORGANIZATION_PATHS = RECIPIENT_ORGANIZATION_PAGE_PATHS


# Helper function for redirecting users
def redirect(handler, location):
    handler.send_response(302)
    handler.send_header("Location", location)
    handler.end_headers()


# Return the role required for this path, or None if any logged-in user is allowed
def get_required_role(path):
    if path in FOOD_PROVIDER_PATHS:
        return "food_provider"
    if path in RECIPIENT_ORGANIZATION_PATHS:
        return "recipient_organization"
    return None


# Check whether this path needs a logged-in user of any role
def needs_login(path):
    # checks for exact matches or prefix matches
    protected_api_path = any(path == api_path or path.startswith(f"{api_path}/") for api_path in AUTHENTICATED_API_PATHS)
    protected_page_path = any(path == page_path or path.startswith(f"{page_path}/") for page_path in AUTHENTICATED_PAGE_PATHS)

    return protected_api_path or protected_page_path


# Checks if this path needs a specific role
def needs_specific_role(path):
    return path in FOOD_PROVIDER_PATHS or path in RECIPIENT_ORGANIZATION_PATHS


# Sends an error message or redirects to not_authorized page depending on if the request was for an API endpoint or page
def reject_request(handler, path, status, message):
    if path.startswith("/api/"):
        send_json(handler, status, {"error": message})
    else:
        redirect(handler, "/not_authorized")


# Main authentication middleware. If it returns True the request gets passed to the route handlers. Otherwise an error is returned
def enforce_access(handler):
    path = normalize_path(handler.path)

    # Assets are always allowed
    if path.startswith("/assets/"):
        return True

    # Public paths are always allowed
    if path in PUBLIC_PATHS:
        return True

    # If this path is not listed at all by us, the default behaviour of access.py is to let it pass
    # app.py will return an error and the frontend will serve an error page
    path_is_protected = needs_login(path) or needs_specific_role(path)
    if not path_is_protected:
        return True

    required_role = get_required_role(path)

    # We check if the user has a session to see if they are authenticated. Then we check if they have the required role if necessary
    try:
        user = get_user(handler)
    except Exception:
        send_json(handler, 500, {"error": "Unable to load session due to a server error."})
        return False

    if user is None:
        reject_request(handler, path, 401, "Not authenticated")
        return False

    if required_role and user["role"] != required_role:
        reject_request(handler, path, 403, "Not authorized")
        return False

    return True
