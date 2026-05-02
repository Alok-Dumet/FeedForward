import hashlib
import hmac
import secrets

from database.database import db
from geocoding import GeocodingError, geocode_city_state
from sessions import SESSION_COOKIE_NAME, parse_cookies, build_session_cookie, create_session, delete_session, get_user
from router import Router
from utils import parse_validate_body, send_json

router = Router()


#We will hash a password with a fresh per-user salt and 200_000 PBKDF2 iterations
def hash_password(password):
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000
    ).hex()
    return f"{salt}${password_hash}"


#We will recompute the hash with the stored salt and constant-time compare it to the stored hash
def verify_password(password, stored_password_hash):
    try:
        salt, expected_hash = stored_password_hash.split("$", 1)
    except ValueError:
        return False

    actual_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000
    ).hex()
    return hmac.compare_digest(actual_hash, expected_hash)


#We will validate the registration body, geocode the city/state, and insert a location + user in one transaction
def register(handler):
    body = parse_validate_body(
        handler,
        ["email", "password", "role", "organization_name", "street_address", "address_text", "city", "state"]
    )
    if body is None:
        return

    if body["role"] not in ("food_provider", "recipient_organization"):
        return send_json(handler, 400, {"error": "Invalid role"})

    if "@" not in body["email"] or "." not in body["email"]:
        return send_json(handler, 400, {"error": "Invalid email format"})
    if len(body["password"]) < 8:
        return send_json(handler, 400, {"error": "Password must be at least 8 characters long"})

    try:
        latitude, longitude = geocode_city_state(body["city"], body["state"])
    except GeocodingError as exc:
        return send_json(handler, 400, {"error": str(exc)})

    password_hash = hash_password(body["password"])

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO locations (address_text, latitude, longitude)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (body["address_text"], latitude, longitude)
            )
            location_id = cur.fetchone()[0]

            cur.execute(
                """
                INSERT INTO users (
                    email,
                    password_hash,
                    role,
                    organization_name,
                    location_id
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, email, role, organization_name
                """,
                (
                    body["email"].lower(),
                    password_hash,
                    body["role"],
                    body["organization_name"],
                    location_id,
                )
            )
            user = cur.fetchone()
        db.commit()
    except Exception as exc:
        db.rollback()
        error_text = str(exc).lower()

        if "duplicate key" in error_text or "users_email_key" in error_text:
            return send_json(handler, 400, {"error": "That email is already registered."})

        print(f"[register] DB error: {exc!r}")
        return send_json(handler, 500, {"error": "Unable to register user due to a server error."})

    return send_json(handler, 201, {
        "success": "User registered",
        "user": {
            "id": user[0],
            "email": user[1],
            "role": user[2],
            "organization_name": user[3]
        }
    })


#We will look up the user by email, verify their password, and start a session
def login(handler):
    body = parse_validate_body(handler, ["email", "password"])
    if body is None:
        return

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, role, organization_name
                FROM users
                WHERE email = %s
                """,
                (body["email"].lower(),),
            )
            user = cur.fetchone()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to log in due to a server error."})

    if not user or not verify_password(body["password"], user[2]):
        return send_json(handler, 401, {"error": "Invalid email or password"})

    session_token = create_session(user[0])

    #We set the cookie max-age to 604800 seconds (7 days)
    return send_json(handler, 200, {
        "success": "Login successful",
        "user": {
            "id": user[0],
            "email": user[1],
            "role": user[3],
            "organization_name": user[4],
        }
    }, headers=[("Set-Cookie", build_session_cookie(session_token, 604800))])


#We will drop the session token from memory and clear the cookie on the client
def logout(handler):
    cookies = parse_cookies(handler)
    session_token = cookies.get(SESSION_COOKIE_NAME)

    if session_token:
        delete_session(session_token)

    return send_json(handler, 200, {"success": "Logout successful"}, headers=[("Set-Cookie", build_session_cookie("", 0))])


#We will return the authenticated user. access.py guarantees auth before this runs
def get_session(handler):
    return send_json(handler, 200, {"user": get_user(handler)})


router.post("/api/login", login)
router.post("/api/logout", logout)
router.post("/api/register", register)
router.get("/api/session", get_session)
