import secrets

from database.database import db

#We will store active sessions in memory for this local app
sessions = {}

#We will use one cookie name for session lookup
SESSION_COOKIE_NAME = "feedforward_session"

#We will use this helper function for parsing cookies in from the user's request
def parse_cookies(self):
    cookie_header = self.headers.get("Cookie")
    if not cookie_header:
        return {}

    cookies = {}

    for cookie in cookie_header.split(";"):
        key, _, value = cookie.strip().partition("=")
        if key:
            cookies[key] = value

    return cookies

#We will create a unique session token for the given user
def create_session(user_id):
    while True:
        session_token = secrets.token_urlsafe(32)
        if session_token not in sessions:
            sessions[session_token] = user_id
            return session_token

#We will build the session cookie header value
def build_session_cookie(session_token, max_age):
    return f"{SESSION_COOKIE_NAME}={session_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"

#We will get a user's id from their session cookie (if it exists)
def get_session_user_id(self):
    cookies = parse_cookies(self)
    session_token = cookies.get(SESSION_COOKIE_NAME)

    if not session_token:
        return None

    return sessions.get(session_token)

#We will load the current user once per request
def get_user(self):
    cached = getattr(self, "_cached_user", None)
    if cached is not None:
        return cached

    user_id = get_session_user_id(self)

    if user_id is None:
        return None

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT
                    users.id,
                    users.email,
                    users.role,
                    users.organization_name,
                    users.location_id,
                    locations.address_text,
                    locations.latitude,
                    locations.longitude
                FROM users
                LEFT JOIN locations
                    ON locations.id = users.location_id
                WHERE users.id = %s
                """,
                (user_id,)
            )
            user = cur.fetchone()
    except Exception:
        db.rollback()
        raise

    if not user:
        return None

    resolved = {
        "id": user[0],
        "email": user[1],
        "role": user[2],
        "organization_name": user[3],
        "location_id": user[4],
        "address_text": user[5],
        "latitude": str(user[6]) if user[6] is not None else None,
        "longitude": str(user[7]) if user[7] is not None else None,
    }

    self._cached_user = resolved
    return resolved

#We will delete a session token when a user logs out
def delete_session(session_token):
    sessions.pop(session_token, None)
