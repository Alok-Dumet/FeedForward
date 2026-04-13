import secrets

#We will use this dictionary for storing sessions in memory (For now. We may move it to a database)
sessions = {}

#This is our session cookie name
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

#We will creating a unique session token and store it (It loops in case a collision occurs)
def create_session(user_id):
    while True:
        session_token = secrets.token_urlsafe(32)
        if session_token not in sessions:
            sessions[session_token] = user_id
            return session_token

#We will build the session cookie
def build_session_cookie(session_token, max_age):
    return f"{SESSION_COOKIE_NAME}={session_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"

#We will get a user's id from their session cookie (if it exists)
def get_session_user_id(self):
    cookies = parse_cookies(self)
    session_token = cookies.get(SESSION_COOKIE_NAME)

    if not session_token:
        return None

    return sessions.get(session_token)

#This is for deleting a session token when a user wants to log out
def delete_session(session_token):
    sessions.pop(session_token, None)
