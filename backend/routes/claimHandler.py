from psycopg2 import errors

from database.database import db
from router import Router
from sessions import get_user
from utils import parse_validate_body, send_json


router = Router()

#POST endpoint handler that accepts and claims a listing
def accept_listing(handler):
    body = parse_validate_body(handler, ["listing_id"])
    if body is None:
        return

    try:
        listing_id = int(body["listing_id"])
    except (TypeError, ValueError):
        return send_json(handler, 400, {"error": "listing_id must be a valid number"})
    if listing_id <= 0:
        return send_json(handler, 400, {"error": "listing_id must be greater than zero"})

    try:
        user = get_user(handler)

        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO claims(
                    listing_id,
                    claimant_user_id,
                    status
                )
                VALUES(%s, %s, 'accepted')
                RETURNING id, listing_id, claimant_user_id, status, claimed_at
                """,
                (
                    listing_id,
                    user["id"]
                )
            )
            claim = cur.fetchone()

        db.commit()
    except errors.UniqueViolation:
        db.rollback()
        return send_json(handler, 409, {"error": "This listing has already been claimed"})
    except errors.ForeignKeyViolation:
        db.rollback()
        return send_json(handler, 404, {"error": "Listing not found"})
    except errors.RaiseException as exc:
        db.rollback()

        message = str(exc)

        if "Listing" in message and "does not exist" in message:
            return send_json(handler, 404, {"error": "Listing not found"})

        if "Users cannot claim their own listings" in message:
            return send_json(handler, 403, {
                "error": "You cannot claim your own listing."
            })

        if "Only recipient organizations can claim offer listings" in message:
            return send_json(handler, 403, {"error": "Only recipient organizations can claim offer listings."})

        if "Only food providers can claim request listings" in message:
            return send_json(handler, 403, {"error": "Only food providers can claim request listings."})

        if "Only available listings can be claimed" in message:
            return send_json(handler, 409, {"error": "This listing is no longer available."})

        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error."})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error"})

    return send_json(handler, 201, {
        "claim": {
            "id": claim[0],
            "listing_id": claim[1],
            "claimant_user_id": claim[2],
            "status": claim[3],
            "claimed_at": claim[4].isoformat()
        }
    })


router.post("/api/listings/accept", accept_listing)
