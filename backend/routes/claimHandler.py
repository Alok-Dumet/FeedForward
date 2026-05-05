from psycopg2 import errors

from database.database import db
from router import Router
from sessions import get_user
from utils import parse_positive_path_param, parse_validate_body, send_json

router = Router()


# POST endpoint handler for claiming a listing
def claim_listing(handler):
    listing_id = parse_positive_path_param(handler, "id", "Listing id")
    if not listing_id:
        return send_json(handler, 400, {"error": "Invalid listing id."})

    try:
        user = get_user(handler)

        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO claims(
                    listing_id,
                    claimant_user_id
                )
                VALUES(%s, %s)
                RETURNING id, listing_id, claimant_user_id, claimed_at
                """,
                (listing_id, user["id"]),
            )
            claim = cur.fetchone()

            cur.execute(
                """
                UPDATE listings
                SET status = 'claimed',
                    updated_at = NOW()
                WHERE id = %s
                """,
                (listing_id,),
            )

        db.commit()
    except errors.UniqueViolation:
        db.rollback()
        return send_json(handler, 409, {"error": "This listing has already been claimed."})
    except errors.ForeignKeyViolation:
        db.rollback()
        return send_json(handler, 404, {"error": "Listing not found."})
    except errors.RaiseException as exc:
        db.rollback()

        # Database triggers provide short custom messages for claim errors
        message = str(exc)

        if "Listing" in message and "does not exist" in message:
            return send_json(handler, 404, {"error": "Listing not found."})

        if "Users cannot claim their own listings" in message:
            return send_json(handler, 403, {"error": "You cannot claim your own listing."})

        if "Only recipient organizations can claim offer listings" in message:
            return send_json(handler, 403, {"error": "Only recipient organizations can claim offer listings."})

        if "Only food providers can claim request listings" in message:
            return send_json(handler, 403, {"error": "Only food providers can claim request listings."})

        if "Only available listings can be claimed" in message:
            return send_json(handler, 409, {"error": "This listing is no longer available."})

        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error."})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error."})

    return send_json(
        handler,
        201,
        {"claim": {"id": claim[0], "listing_id": claim[1], "claimant_user_id": claim[2], "claimed_at": claim[3].isoformat()}},
    )


# PATCH endpoint handler for changing a listing status
def update_listing_status(handler):
    body = parse_validate_body(handler, ["status"])
    if body is None:
        return

    listing_id = parse_positive_path_param(handler, "id", "Listing id")
    if not listing_id:
        return send_json(handler, 400, {"error": "Invalid listing id."})

    if body["status"] == "cancelled":
        return cancel_listing(handler, listing_id)
    if body["status"] == "completed":
        return complete_listing(handler, listing_id)

    return send_json(handler, 400, {"error": "Status must be cancelled or completed."})


# We will cancel a listing owned by the current user
def cancel_listing(handler, listing_id):
    user = get_user(handler)

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT listings.id, listings.status, active_claim.id
                FROM listings
                LEFT JOIN claims AS active_claim
                    ON active_claim.listing_id = listings.id
                WHERE listings.id = %s
                    AND listings.creator_user_id = %s
                """,
                (listing_id, user["id"]),
            )
            listing = cur.fetchone()

            if not listing:
                db.rollback()
                return send_json(handler, 404, {"error": "Listing not found."})

            if listing[1] in ("completed", "cancelled"):
                db.rollback()
                return send_json(handler, 409, {"error": "This listing is already closed."})

            if listing[2]:
                cur.execute(
                    """
                    UPDATE claims
                    SET resolved_at = NOW()
                    WHERE id = %s
                    RETURNING id, resolved_at
                    """,
                    (listing[2],),
                )
                claim = cur.fetchone()
            else:
                claim = None

            cur.execute(
                """
                UPDATE listings
                SET status = 'cancelled',
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, status, updated_at
                """,
                (listing_id,),
            )
            result = cur.fetchone()

        db.commit()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to cancel listing."})

    return send_json(
        handler,
        200,
        {
            "listing_id": listing_id,
            "status": "cancelled",
            "result": {
                "id": result[0],
                "status": result[1],
                "resolved_at": claim[1].isoformat() if claim else result[2].isoformat(),
            },
        },
    )


# We will mark an accepted listing as completed
def complete_listing(handler, listing_id):
    user = get_user(handler)

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                UPDATE listings
                SET status = 'completed',
                    updated_at = NOW()
                WHERE id = %s
                    AND creator_user_id = %s
                    AND status = 'claimed'
                    AND EXISTS (
                        SELECT 1
                        FROM claims
                        WHERE claims.listing_id = listings.id
                    )
                RETURNING id
                """,
                (listing_id, user["id"]),
            )
            updated_listing = cur.fetchone()

            if not updated_listing:
                db.rollback()
                return send_json(handler, 409, {"error": "This listing cannot be completed."})

            cur.execute(
                """
                UPDATE claims
                SET resolved_at = NOW()
                WHERE listing_id = %s
                RETURNING id, listing_id, claimant_user_id, resolved_at
                """,
                (listing_id,),
            )
            claim = cur.fetchone()

        db.commit()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to complete listing."})

    return send_json(
        handler,
        200,
        {
            "claim": {
                "id": claim[0],
                "listing_id": claim[1],
                "claimant_user_id": claim[2],
                "resolved_at": claim[3].isoformat() if claim[3] else None,
            },
            "listing_status": "completed",
        },
    )


router.post("/api/listings/:id/claim", claim_listing)
router.patch("/api/listings/:id/status", update_listing_status)
