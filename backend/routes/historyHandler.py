from datetime import datetime

from database.database import db
from router import Router
from sessions import get_user
from utils import send_json


router = Router()


#We will turn the raw listing status and pickup window end into a status string for history page
def normalize_history_status(listing_status, pickup_window_end):
    if listing_status == "completed":
        return "Completed"
    if listing_status == "canceled":
        return "Cancelled"
    if listing_status in ("available", "claimed"):
        if pickup_window_end and pickup_window_end <= datetime.now(pickup_window_end.tzinfo):
            return "Expired"

    return listing_status.title()


#We will derive a short outcome blurb from the normalized status for display on each history card
def derive_history_outcome(status):
    if status == "Completed":
        return "Donation completed"
    if status == "Cancelled":
        return "Listing was cancelled"
    if status == "Expired":
        return "Listing expired without fulfillment"

    return status


#We will format two ISO timestamps into a single "start to end" pickup window string
def format_pickup_window(start, end):
    if not start or not end:
        return None

    return f"{start.isoformat()} to {end.isoformat()}"


#We will format one food item from a history listing row
def build_history_food_item(row):
    return {
        "id": row[2],
        "description": row[3],
        "name": row[4],
        "category": row[5],
        "is_perishable": row[6],
        "quantity": str(row[7]),
        "quantity_unit": row[8],
        "expiration_date": row[9].isoformat() if row[9] else None,
    }


#We will turn one row from either history query into the dict shape the frontend expects
def build_history_record(row, relationship):
    history_status = normalize_history_status(row[12], row[11])

    return {
        "id": row[0],
        "listing_id": row[0],
        "listing_type": row[1],
        "foods": [],
        "pickup_window_start": row[10].isoformat() if row[10] else None,
        "pickup_window_end": row[11].isoformat() if row[11] else None,
        "pickup_window": format_pickup_window(row[10], row[11]),
        "location": row[13],
        "status": history_status,
        "outcome": derive_history_outcome(history_status),
        "relationship": relationship,
        "created_at": row[14].isoformat() if row[14] else None,
        "updated_at": row[15].isoformat() if row[15] else None,
        "claim": {
            "id": row[16],
            "claimant_user_id": row[17],
            "status": row[18],
            "claimed_at": row[19].isoformat() if row[19] else None,
            "resolved_at": row[20].isoformat() if row[20] else None,
        } if row[16] else None,
    }


#We will group history rows by listing so multiple foods render on one history card
def build_history_records(rows, relationship):
    records_by_id = {}

    for row in rows:
        listing_id = row[0]
        if listing_id not in records_by_id:
            records_by_id[listing_id] = build_history_record(row, relationship)

        records_by_id[listing_id]["foods"].append(build_history_food_item(row))

    return list(records_by_id.values())


#We will only return rows whose lifecycle is finished — completed, canceled, or pickup-window already passed
FINISHED_LISTINGS_FILTER = """
    listings.status IN ('completed', 'canceled')
    OR listings.pickup_window_end <= now()
"""


#We will fetch finished listings the user created. The latest claim is joined laterally so cards can show who claimed it.
def get_created_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT
                listings.id,
                listings.listing_type,
                listing_food_items.id,
                listing_food_items.food_description,
                listing_food_items.food_name,
                listing_food_items.food_category,
                listing_food_items.is_perishable,
                listing_food_items.quantity,
                listing_food_items.quantity_unit,
                listing_food_items.expiration_date,
                listings.pickup_window_start,
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
                AND ({FINISHED_LISTINGS_FILTER})
            ORDER BY COALESCE(latest_claim.resolved_at, latest_claim.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,)
        )

        return cur.fetchall()


#We will fetch finished listings the user claimed. The matching claim is joined directly since we filter by claimant_user_id.
def get_claimed_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT
                listings.id,
                listings.listing_type,
                listing_food_items.id,
                listing_food_items.food_description,
                listing_food_items.food_name,
                listing_food_items.food_category,
                listing_food_items.is_perishable,
                listing_food_items.quantity,
                listing_food_items.quantity_unit,
                listing_food_items.expiration_date,
                listings.pickup_window_start,
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
                AND ({FINISHED_LISTINGS_FILTER})
            ORDER BY COALESCE(claims.resolved_at, claims.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,)
        )

        return cur.fetchall()


def get_history(handler):
    user = get_user(handler)

    if user["role"] not in ("food_provider", "recipient_organization"):
        return send_json(handler, 403, {"error": "This role is not allowed to view history."})

    try:
        created_rows = get_created_history_rows(user["id"])
        claimed_rows = get_claimed_history_rows(user["id"])
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load history."})

    records = build_history_records(created_rows, "own")
    records += build_history_records(claimed_rows, "claimed")

    return send_json(handler, 200, {
        "filters": ["All records", "Completed", "Cancelled", "Expired"],
        "records": records,
        "current_user": {
            "id": user["id"],
            "role": user["role"],
            "organization_name": user["organization_name"],
        },
    })


router.get("/api/history", get_history)
