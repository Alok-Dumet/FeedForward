from database.database import db
from router import Router
from sessions import get_user
from utils import send_json


router = Router()

#We will format one food item from a joined listing_food_items row
def build_food_item(row, start_index):
    return {
        "id": row[start_index],
        "name": row[start_index + 1],
        "description": row[start_index + 2],
        "category": row[start_index + 3],
        "is_perishable": row[start_index + 4],
        "quantity": str(row[start_index + 5]),
        "quantity_unit": row[start_index + 6],
        "expiration_date": row[start_index + 7].isoformat() if row[start_index + 7] else None,
    }


#We will format one listing row and leave room for multiple food items
def build_listing_record(row):
    return {
        "id": row[0],
        "creator_user_id": row[1],
        "listing_type": row[2],
        "pickup_window_start": row[3].isoformat(),
        "pickup_window_end": row[4].isoformat(),
        "travel_distance_miles": row[5],
        "additional_instructions": row[6],
        "status": row[7],
        "created_at": row[8].isoformat(),
        "updated_at": row[9].isoformat(),
        "location": {
            "address_text": row[10],
            "latitude": str(row[11]),
            "longitude": str(row[12]),
        },
        "foods": [],
        "creator": {
            "organization_name": row[21],
        },
    }


#We will group joined listing rows so each listing appears once with a foods array
def build_listing_records(rows, relationship=None):
    records_by_id = {}

    for row in rows:
        listing_id = row[0]
        if listing_id not in records_by_id:
            record = build_listing_record(row)
            if relationship:
                record["relationship"] = relationship
            records_by_id[listing_id] = record

        records_by_id[listing_id]["foods"].append(build_food_item(row, 13))

    return list(records_by_id.values())


#GET endpoint handler that returns requests for providers or offers for recipients
def get_offers_requests(handler):

    user = get_user(handler)
    user_role = user["role"]

    if user_role == "food_provider":
        target_listing_type = "request"
        view_mode = "requests"
    else:
        target_listing_type = "offer"
        view_mode = "offers"

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT
                    listings.id,
                    listings.creator_user_id,
                    listings.listing_type,
                    listings.pickup_window_start,
                    listings.pickup_window_end,
                    listings.travel_distance_miles,
                    listings.additional_instructions,
                    listings.status,
                    listings.created_at,
                    listings.updated_at,
                    locations.address_text,
                    locations.latitude,
                    locations.longitude,
                    listing_food_items.id,
                    listing_food_items.food_name,
                    listing_food_items.food_description,
                    listing_food_items.food_category,
                    listing_food_items.is_perishable,
                    listing_food_items.quantity,
                    listing_food_items.quantity_unit,
                    listing_food_items.expiration_date,
                    creator.organization_name
                FROM listings
                JOIN locations
                    ON locations.id = listings.location_id
                JOIN listing_food_items
                    ON listing_food_items.listing_id = listings.id
                JOIN users AS creator
                    ON creator.id = listings.creator_user_id
                WHERE listings.listing_type = %s
                    AND listings.creator_user_id <> %s
                    AND listings.status = 'available'
                ORDER BY listings.created_at DESC, listings.id DESC
                """,
                (
                    target_listing_type,
                    user["id"],
                )
            )

            rows = cur.fetchall()
    except Exception as exc:
        db.rollback()
        print(f"[get_offers_requests] DB error: {exc!r}")
        return send_json(handler, 500, {"error": "Unable to load offers or requests."})

    records = build_listing_records(rows)

    return send_json(handler, 200, {
        "view_mode": view_mode,
        "records": records,
        "current_user": {
            "id": user["id"],
            "role": user_role,
            "organization_name": user["organization_name"],
            "latitude": user["latitude"],
            "longitude": user["longitude"],
        },
    })


#GET endpoint handler that returns the current user's active and claimed listings
def get_my_listings(handler):
    user = get_user(handler)

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT
                    listings.id,
                    listings.creator_user_id,
                    listings.listing_type,
                    listings.pickup_window_start,
                    listings.pickup_window_end,
                    listings.travel_distance_miles,
                    listings.additional_instructions,
                    listings.status,
                    listings.created_at,
                    listings.updated_at,
                    locations.address_text,
                    locations.latitude,
                    locations.longitude,
                    listing_food_items.id,
                    listing_food_items.food_name,
                    listing_food_items.food_description,
                    listing_food_items.food_category,
                    listing_food_items.is_perishable,
                    listing_food_items.quantity,
                    listing_food_items.quantity_unit,
                    listing_food_items.expiration_date,
                    creator.organization_name
                FROM listings
                JOIN locations
                    ON locations.id = listings.location_id
                JOIN listing_food_items
                    ON listing_food_items.listing_id = listings.id
                JOIN users AS creator
                    ON creator.id = listings.creator_user_id
                WHERE listings.creator_user_id = %s
                    AND listings.status IN ('available', 'claimed')
                ORDER BY listings.created_at DESC, listings.id DESC
                """,
                (user["id"],)
            )
            own_rows = cur.fetchall()

            cur.execute(
                """
                SELECT
                    listings.id,
                    listings.creator_user_id,
                    listings.listing_type,
                    listings.pickup_window_start,
                    listings.pickup_window_end,
                    listings.travel_distance_miles,
                    listings.additional_instructions,
                    listings.status,
                    listings.created_at,
                    listings.updated_at,
                    locations.address_text,
                    locations.latitude,
                    locations.longitude,
                    listing_food_items.id,
                    listing_food_items.food_name,
                    listing_food_items.food_description,
                    listing_food_items.food_category,
                    listing_food_items.is_perishable,
                    listing_food_items.quantity,
                    listing_food_items.quantity_unit,
                    listing_food_items.expiration_date,
                    creator.organization_name
                FROM claims
                JOIN listings
                    ON listings.id = claims.listing_id
                JOIN locations
                    ON locations.id = listings.location_id
                JOIN listing_food_items
                    ON listing_food_items.listing_id = listings.id
                JOIN users AS creator
                    ON creator.id = listings.creator_user_id
                WHERE claims.claimant_user_id = %s
                    AND claims.status IN ('pending', 'accepted')
                    AND listings.status NOT IN ('completed', 'canceled')
                ORDER BY claims.claimed_at DESC, listings.id DESC
                """,
                (user["id"],)
            )
            claimed_rows = cur.fetchall()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load your listings."})

    own_records = build_listing_records(own_rows, "own")
    claimed_records = build_listing_records(claimed_rows, "claimed")

    return send_json(handler, 200, {
        "records": own_records + claimed_records,
        "current_user": {
            "id": user["id"],
            "role": user["role"],
            "organization_name": user["organization_name"],
        },
    })


router.get("/api/listings", get_offers_requests)
router.get("/api/my-listings", get_my_listings)
