from datetime import datetime

from database.database import db
from router import Router
from sessions import get_user
from utils import send_json


router = Router()


def normalize_history_status(listing_status, pickup_window_end):
    if listing_status == "completed":
        return "Completed"
    if listing_status == "claimed":
        return "Claimed"
    if listing_status == "canceled":
        return "Cancelled"
    if listing_status == "available":
        if pickup_window_end and pickup_window_end <= datetime.now(pickup_window_end.tzinfo):
            return "Expired"
        return "Posted"

    return listing_status.title()


def derive_history_outcome(status):
    if status == "Completed":
        return "Donation completed"
    if status == "Claimed":
        return "Claimed and awaiting fulfillment"
    if status == "Cancelled":
        return "Listing was cancelled"
    if status == "Expired":
        return "Listing expired without fulfillment"
    if status == "Posted":
        return "Listing posted"

    return status


def format_pickup_window(start, end):
    if not start or not end:
        return None

    return f"{start.isoformat()} to {end.isoformat()}"


def build_history_record(row):
    history_status = normalize_history_status(row[8], row[7])

    return {
        "id": row[0],
        "listing_id": row[0],
        "listing_type": row[1],
        "food_description": row[2] or row[3],
        "food_name": row[3],
        "quantity": str(row[5]),
        "quantity_unit": row[6],
        "pickup_window_start": row[4].isoformat() if row[4] else None,
        "pickup_window_end": row[7].isoformat() if row[7] else None,
        "pickup_window": format_pickup_window(row[4], row[7]),
        "location": row[9],
        "status": history_status,
        "outcome": derive_history_outcome(history_status),
        "created_at": row[10].isoformat() if row[10] else None,
        "updated_at": row[11].isoformat() if row[11] else None,
        "claim": {
            "id": row[12],
            "claimant_user_id": row[13],
            "status": row[14],
            "claimed_at": row[15].isoformat() if row[15] else None,
            "resolved_at": row[16].isoformat() if row[16] else None,
        } if row[12] else None,
    }


def get_donor_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT
                listings.id,
                listings.listing_type,
                listing_food_items.food_description,
                listing_food_items.food_name,
                listings.pickup_window_start,
                listing_food_items.quantity,
                listing_food_items.quantity_unit,
                listings.pickup_window_end,
                listings.status,
                locations.address_text,
                listings.created_at,
                listings.updated_at,
                latest_claim.id,
                latest_claim.claimant_user_id,
                latest_claim.status,
                latest_claim.claimed_at,
                latest_claim.resolved_at
            FROM listings
            JOIN locations
                ON locations.id = listings.location_id
            JOIN listing_food_items
                ON listing_food_items.listing_id = listings.id
            LEFT JOIN LATERAL (
                SELECT
                    claims.id,
                    claims.claimant_user_id,
                    claims.status,
                    claims.claimed_at,
                    claims.resolved_at
                FROM claims
                WHERE claims.listing_id = listings.id
                ORDER BY COALESCE(claims.resolved_at, claims.claimed_at) DESC, claims.id DESC
                LIMIT 1
            ) AS latest_claim
                ON TRUE
            WHERE listings.creator_user_id = %s
            ORDER BY COALESCE(latest_claim.resolved_at, latest_claim.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,)
        )

        return cur.fetchall()


def get_recipient_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT
                listings.id,
                listings.listing_type,
                listing_food_items.food_description,
                listing_food_items.food_name,
                listings.pickup_window_start,
                listing_food_items.quantity,
                listing_food_items.quantity_unit,
                listings.pickup_window_end,
                listings.status,
                locations.address_text,
                listings.created_at,
                listings.updated_at,
                claims.id,
                claims.claimant_user_id,
                claims.status,
                claims.claimed_at,
                claims.resolved_at
            FROM claims
            JOIN listings
                ON listings.id = claims.listing_id
            JOIN locations
                ON locations.id = listings.location_id
            JOIN listing_food_items
                ON listing_food_items.listing_id = listings.id
            WHERE claims.claimant_user_id = %s
            ORDER BY COALESCE(claims.resolved_at, claims.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,)
        )

        return cur.fetchall()


def get_history(handler):

    user = get_user(handler)

    try:
        if user["role"] == "food_provider":
            rows = get_donor_history_rows(user["id"])
        elif user["role"] == "recipient_organization":
            rows = get_recipient_history_rows(user["id"])
        else:
            return send_json(handler, 403, {"error": "This role is not allowed to view history."})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load history."})

    records = [build_history_record(row) for row in rows]

    return send_json(handler, 200, {
        "filters": ["All records", "Posted", "Claimed", "Completed", "Cancelled", "Expired"],
        "records": records,
        "current_user": {
            "id": user["id"],
            "role": user["role"],
            "organization_name": user["organization_name"],
        },
    })


router.get("/api/history", get_history)
