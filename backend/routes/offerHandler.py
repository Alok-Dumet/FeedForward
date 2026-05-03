from decimal import Decimal

from psycopg2 import errors
from psycopg2.extras import Json

from database.database import db
from router import Router
from sessions import get_user
from utils import (
    parse_body,
    strip_strings,
    send_json,
    parse_decimal,
    parse_food_items,
    parse_availability_windows,
)


router = Router()


#POST endpoint handler that creates an offer listing
def create_offer(handler):
    body = parse_body(handler)
    if body is None:
        return send_json(handler, 400, {"error": "Invalid JSON body."})

    body = strip_strings(body)
    user = get_user(handler)

    required_fields = [
        "foods",
        "address_text",
        "latitude",
        "longitude",
    ]
    missing = [name for name in required_fields if body.get(name) in (None, "")]
    if missing:
        return send_json(handler, 400, {"error": f"Missing fields: {','.join(missing)}"})

    try:
        foods = parse_food_items(body["foods"])
        availability_windows = parse_availability_windows(body.get("availability_windows"))

        latitude = parse_decimal(body["latitude"], "latitude")
        if latitude < Decimal("-90") or latitude > Decimal("90"):
            raise ValueError("latitude must be between -90 and 90")

        longitude = parse_decimal(body["longitude"], "longitude")
        if longitude < Decimal("-180") or longitude > Decimal("180"):
            raise ValueError("longitude must be between -180 and 180")

        travel_distance_miles = int(body.get("travel_distance_miles", 0))
        if travel_distance_miles < 0:
            raise ValueError("travel_distance_miles must be 0 or greater")

    except (TypeError, ValueError) as exc:
        return send_json(handler, 400, {"error": str(exc)})

    additional_instructions = body.get("additional_instructions") or None

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO locations(
                    address_text,
                    latitude,
                    longitude
                )
                VALUES(%s, %s, %s)
                RETURNING id
                """,
                (body["address_text"], latitude, longitude)
            )
            location_id = cur.fetchone()[0]

            cur.execute(
                """
                INSERT INTO listings(
                    creator_user_id,
                    listing_type,
                    location_id,
                    availability_windows,
                    travel_distance_miles,
                    additional_instructions

                )
                VALUES(%s, 'offer', %s, %s, %s, %s)
                RETURNING id, status, created_at, updated_at
                """,
                (
                    user["id"],
                    location_id,
                    Json(availability_windows),
                    travel_distance_miles,
                    additional_instructions,
                )
            )
            listing = cur.fetchone()

            food_item_ids = []
            for food in foods:
                cur.execute(
                    """
                    INSERT INTO listing_food_items(
                        listing_id,
                        food_name,
                        food_description,
                        food_category,
                        is_perishable,
                        quantity,
                        quantity_unit,
                        expiration_date
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        listing[0],
                        food["name"],
                        food["description"],
                        food["category"],
                        food["is_perishable"],
                        food["quantity"],
                        food["quantity_unit"],
                        food["expiration_date"],
                    )
                )
                food_item_ids.append(cur.fetchone()[0])

        db.commit()
    except errors.CheckViolation:
        db.rollback()
        return send_json(handler, 400, {"error": "Offer data failed validation."})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to create offer due to server error."})

    return send_json(handler, 201, {
        "offer": {
            "id": listing[0],
            "creator_user_id": user["id"],
            "type": "offer",
            "status": listing[1],
            "created_at": listing[2].isoformat(),
            "updated_at": listing[3].isoformat(),
            "availability_windows": availability_windows,
            "travel_distance_miles": travel_distance_miles,
            "additional_instructions": additional_instructions,
            "location": {
                "id": location_id,
                "address_text": body["address_text"],
                "latitude": str(latitude),
                "longitude": str(longitude),
            },
            "foods": [
                {
                    "id": food_item_ids[index],
                    "name": food["name"],
                    "description": food["description"],
                    "category": food["category"],
                    "is_perishable": food["is_perishable"],
                    "quantity": str(food["quantity"]),
                    "quantity_unit": food["quantity_unit"],
                    "expiration_date": food["expiration_date"].isoformat() if food["expiration_date"] else None,
                }
                for index, food in enumerate(foods)
            ],
        }
    })


router.post("/api/listings/offers/create", create_offer)
