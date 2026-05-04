from database.database import db
from sessions import get_user
from utils import send_json


# We will fetch unique completed or cancelled listings that the user posted or claimed
def get_history_listing_rows(cur, user_id):
    cur.execute(
        """
        SELECT
            listings.id AS listing_id,
            listings.listing_type AS listing_type,
            listings.status AS status,
            listings.availability_windows AS availability_windows,
            locations.address_text AS address_text,
            listings.created_at AS created_at,
            listings.updated_at AS updated_at,
            claims.id AS claim_id,
            claims.claimant_user_id AS claimant_user_id,
            claims.claimed_at AS claimed_at,
            claims.resolved_at AS resolved_at,
            'own' AS relationship
        FROM listings
        JOIN locations
            ON locations.id = listings.location_id
        LEFT JOIN claims
            ON claims.listing_id = listings.id
        WHERE listings.creator_user_id = %s
            AND listings.status IN ('completed', 'cancelled')

        UNION

        SELECT
            listings.id AS listing_id,
            listings.listing_type AS listing_type,
            listings.status AS status,
            listings.availability_windows AS availability_windows,
            locations.address_text AS address_text,
            listings.created_at AS created_at,
            listings.updated_at AS updated_at,
            claims.id AS claim_id,
            claims.claimant_user_id AS claimant_user_id,
            claims.claimed_at AS claimed_at,
            claims.resolved_at AS resolved_at,
            'claimed' AS relationship
        FROM claims
        JOIN listings
            ON listings.id = claims.listing_id
        JOIN locations
            ON locations.id = listings.location_id
        WHERE claims.claimant_user_id = %s
            AND listings.status IN ('completed', 'cancelled')

        ORDER BY resolved_at DESC NULLS LAST, updated_at DESC, listing_id DESC
        """,
        (user_id, user_id),
    )

    return cur.fetchall()


# We will fetch all listing_items for the history listing ids in one query
def get_food_rows(cur, listing_ids):
    if not listing_ids:
        return []

    cur.execute(
        """
        SELECT
            listing_id,
            id,
            food_description,
            food_name,
            food_category,
            is_perishable,
            quantity,
            quantity_unit,
            expiration_date
        FROM listing_food_items
        WHERE listing_id = ANY(%s)
        ORDER BY listing_id, id
        """,
        (listing_ids,),
    )

    return cur.fetchall()


# We will format the listing_items and attach the matching listings
def build_history_records(listing_rows, food_rows):
    grouped_listing_items = {}

    # Stores lisiting_items in a dictionary, using listing_id as the key and and an array of its listing_items as the value
    for row in food_rows:
        listing_id = row[0]
        grouped_listing_items.setdefault(listing_id, []).append(
            {
                "id": row[1],
                "description": row[2],
                "name": row[3],
                "category": row[4],
                "is_perishable": row[5],
                "quantity": str(row[6]),
                "quantity_unit": row[7],
                "expiration_date": row[8].isoformat() if row[8] else None,
            }
        )

    # Stores listings in an array of dictionaries and provides it it's matching listing_items
    records = []
    for row in listing_rows:
        records.append(
            {
                "id": row[0],
                "listing_id": row[0],
                "listing_type": row[1],
                "status": row[2],
                "availability_windows": row[3],
                "location": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "updated_at": row[6].isoformat() if row[6] else None,
                "claim": {
                    "id": row[7],
                    "claimant_user_id": row[8],
                    "claimed_at": row[9].isoformat() if row[9] else None,
                    "resolved_at": row[10].isoformat() if row[10] else None,
                }
                if row[7]
                else None,
                "relationship": row[11],
                "foods": grouped_listing_items.get(row[0], []),
            }
        )

    return records


# We will return the current user's listing history for the listings history scope
def get_history(handler):
    user = get_user(handler)

    try:
        with db.cursor() as cur:
            listing_rows = get_history_listing_rows(cur, user["id"])
            listing_ids = [row[0] for row in listing_rows]
            food_rows = get_food_rows(cur, listing_ids)
    except Exception as exc:
        db.rollback()
        print(f"[get_history] DB error: {exc}")
        return send_json(handler, 500, {"error": "Unable to load history."})

    return send_json(
        handler,
        200,
        {
            "filters": ["all", "completed", "cancelled"],
            "records": build_history_records(listing_rows, food_rows),
        },
    )
