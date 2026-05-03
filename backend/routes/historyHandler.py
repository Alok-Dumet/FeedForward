from database.database import db
from router import Router
from sessions import get_user
from utils import send_json

router = Router()


# We will format one food item from a history listing row
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


# We will turn one row from either history query into the dict shape the frontend expects
def build_history_record(row, relationship):
    return {
        "id": row[0],
        "listing_id": row[0],
        "listing_type": row[1],
        "foods": [],
        "availability_windows": row[11],
        "location": row[12],
        "status": row[10],
        "relationship": relationship,
        "created_at": row[13].isoformat() if row[13] else None,
        "updated_at": row[14].isoformat() if row[14] else None,
        "claim": {
            "id": row[15],
            "claimant_user_id": row[16],
            "status": row[17],
            "claimed_at": row[18].isoformat() if row[18] else None,
            "resolved_at": row[19].isoformat() if row[19] else None,
        }
        if row[15]
        else None,
    }


# We will group history rows by listing so multiple foods render on one history card
def build_history_records(rows, relationship):
    records_by_id = {}

    for row in rows:
        listing_id = row[0]
        if listing_id not in records_by_id:
            records_by_id[listing_id] = build_history_record(row, relationship)

        records_by_id[listing_id]["foods"].append(build_history_food_item(row))

    return list(records_by_id.values())


# We will fetch finished listings the user created, joining the latest claim so cards can show who claimed it
def get_created_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            """
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
                listings.status,
                listings.availability_windows,
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
                AND listings.status IN ('completed', 'cancelled')
            ORDER BY COALESCE(latest_claim.resolved_at, latest_claim.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,),
        )

        return cur.fetchall()


# We will fetch finished listings the user claimed, joining the matching claim directly since we filter by claimant_user_id
def get_claimed_history_rows(user_id):
    with db.cursor() as cur:
        cur.execute(
            """
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
                listings.status,
                listings.availability_windows,
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
                AND listings.status IN ('completed', 'cancelled')
            ORDER BY COALESCE(claims.resolved_at, claims.claimed_at, listings.updated_at, listings.created_at) DESC,
                listings.id DESC
            """,
            (user_id,),
        )

        return cur.fetchall()


# GET endpoint handler that returns the current user's listing history
def get_history(handler):
    user = get_user(handler)

    try:
        created_rows = get_created_history_rows(user["id"])
        claimed_rows = get_claimed_history_rows(user["id"])
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load history."})

    records = build_history_records(created_rows, "own")
    records += build_history_records(claimed_rows, "claimed")

    return send_json(
        handler,
        200,
        {
            "filters": ["all", "completed", "cancelled"],
            "records": records,
            "current_user": {
                "id": user["id"],
                "role": user["role"],
                "organization_name": user["organization_name"],
            },
        },
    )


router.get("/api/history", get_history)
