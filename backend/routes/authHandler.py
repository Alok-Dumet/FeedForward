import hashlib
import hmac
import secrets

from database.database import db
from sessions import SESSION_COOKIE_NAME, parse_cookies, build_session_cookie, create_session, delete_session, get_user
from router import Router
from utils import parse_validate_body, send_json

router = Router()


#We will hash passwords and utilize salts as well.
def hash_password(password):
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000        #We will be dramatic and do 200_000 iterations for the hash
    ).hex()
    return f"{salt}${password_hash}"

#We will check if the user passed in the correct hash
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


#Our route handler for registering
def register(handler):
    #Parses the body, strips it, and checks for missing fields. If the body is none, an error json is returned by the function as well
    body = parse_validate_body(handler, ["email", "password", "role", "organization_name"])
    if body is None:
        return

    #Check if the user sent an invalid role
    if body["role"] not in ("food_provider", "recipient_organization"):
        return send_json(handler, 400, {"error": "Invalid role"})

    #Check if the user sent an invalid email or weak password
    if "@" not in body["email"] or "." not in body["email"]:
        return send_json(handler, 400, {"error": "Invalid email format"})
    if len(body["password"]) < 8:
        return send_json(handler, 400, {"error": "Password must be at least 8 characters long"})

    #Hash the password
    password_hash = hash_password(body["password"])

    #Attempt to create a user and return an error if a constraint is violated
    try:
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (
                    email,
                    password_hash,
                    role,
                    organization_name
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, role, organization_name
                """,
                (
                    body["email"].lower(),
                    password_hash,
                    body["role"],
                    body["organization_name"]
                )
            )
            user = cur.fetchone()
        db.commit()
    except Exception as exc:
        db.rollback()
        error_text = str(exc).lower()

        if "duplicate key" in error_text or "users_email_key" in error_text:
            return send_json(handler, 400, {"error": "That email is already registered."})

        return send_json(handler, 500, {"error": "Unable to register user due to a server error."})

    return send_json(handler, 201, {
        "success": "User registered",
        "user": {
            "id": user[0],
            "email": user[1],
            "role": user[2],
            "organization_name": user[3]
            }
        }
    )


#Our route handler for logging in
def login(handler):
    #Parses the body, strips it, and checks for missing fields. If the body is none, an error json is returned by the function as well
    body = parse_validate_body(handler, ["email", "password"])
    if body is None:
        return

    #Try to find the user by email
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

    #If no user exists or the password is wrong, reject the login
    if not user or not verify_password(body["password"], user[2]):
        return send_json(handler, 401, {"error": "Invalid email or password"})
    
    #Creating the session token
    session_token = create_session(user[0])

    return send_json(handler, 200, {
        "success": "Login successful",
        "user": {
            "id": user[0],
            "email": user[1],
            "role": user[3],
            "organization_name": user[4]
            }
        },
        headers=[("Set-Cookie", build_session_cookie(session_token, 604800))] #sets the cookie to last for 604800 seconds (7 days)
    )


#Our route handler for logging out.
def logout(handler):
    cookies = parse_cookies(handler)
    session_token = cookies.get(SESSION_COOKIE_NAME)

    #We will delete the session from memory and then tell the user to set their cookie to an empty string
    if session_token:
        delete_session(session_token)

    return send_json(handler, 200, {"success": "Logout successful"}, headers=[("Set-Cookie", build_session_cookie("", 0))])

#Our route handler to allow the user to check their session details
def get_session(handler):
    try:
        user = get_user(handler)
    except Exception:
        return send_json(handler, 500, {"error": "Unable to load session due to a server error."})

    if user is None:
        return send_json(handler, 401, {"error": "Not authenticated"})

    return send_json(handler, 200, {"user": user})

router.post("/api/login", login)
router.post("/api/logout", logout)
router.post("/api/register", register)
router.get("/api/session", get_session)
