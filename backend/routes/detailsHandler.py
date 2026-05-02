from database.database import db
from router import Router
from sessions import get_user
from utils import send_json, get_query_param
from routes.listingHandler import build_food_item


router = Router()

#GET endpoint handler that returns the full details for one listing
def get_listing_details(handler):
    listing_id = get_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 400, {"error": "missing listing id"})

    try:
        listing_id = int(listing_id)
    except ValueError:
        return send_json(handler, 400, {"error": "Listing id must be a valid number"})
    if listing_id <= 0:
        return send_json(handler, 400, {"error": "Listing id must be greater than zero"})

    try:
        user = get_user(handler)

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
                    creator.organization_name,
                    creator.email,
                    claims.id,
                    claims.claimant_user_id,
                    claims.status,
                    claims.claimed_at,
                    claims.resolved_at
                FROM listings
                JOIN locations
                    ON locations.id = listings.location_id
                JOIN listing_food_items
                    ON listing_food_items.listing_id = listings.id
                JOIN users AS creator
                    ON creator.id = listings.creator_user_id
                LEFT JOIN claims
                    ON claims.listing_id = listings.id
                    AND claims.status IN ('pending', 'accepted')
                WHERE listings.id = %s
                """,
                (listing_id,)
            )
            rows = cur.fetchall()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load listing details"})

    if not rows:
        return send_json(handler, 404, {"error": "listing not found"})

    return send_json(handler, 200, {
        "record": {
            "id": rows[0][0],
            "creator_user_id": rows[0][1],
            "type": rows[0][2],
            "pickup_window_start": rows[0][3].isoformat(),
            "pickup_window_end": rows[0][4].isoformat(),
            "travel_distance_miles": rows[0][5],
            "additional_instructions": rows[0][6],
            "status": rows[0][7],
            "created_at": rows[0][8].isoformat(),
            "updated_at": rows[0][9].isoformat(),
            "location": {
                "address_text": rows[0][10],
                "latitude": str(rows[0][11]),
                "longitude": str(rows[0][12]),
            },
            "foods": [build_food_item(row, 13) for row in rows],
            "creator": {
                "organization_name": rows[0][21],
                "email": rows[0][22],
            },
            "claim": {
                "id": rows[0][23],
                "claimant_user_id": rows[0][24],
                "status": rows[0][25],
                "claimed_at": rows[0][26].isoformat() if rows[0][26] else None,
                "resolved_at": rows[0][27].isoformat() if rows[0][27] else None,
            } if rows[0][23] else None,
            "current_user": {
                "id": user["id"],
                "role": user["role"],
            },
        }
    })


router.get("/api/listings/details", get_listing_details)
