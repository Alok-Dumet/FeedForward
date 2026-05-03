from decimal import Decimal

from psycopg2 import errors
from psycopg2.extras import Json

from database.database import db
from router import Router
from sessions import get_user
from utils import (
    send_json,
    get_query_param,
    parse_body,
    strip_strings,
    parse_decimal,
    parse_food_items,
    parse_availability_windows,
)
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
                    listings.availability_windows,
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
                    AND (
                        listings.creator_user_id = %s
                        OR (
                            listings.status = 'available'
                            AND (
                                (listings.listing_type = 'offer' AND %s = 'recipient_organization')
                                OR (listings.listing_type = 'request' AND %s = 'food_provider')
                            )
                        )
                        OR EXISTS (
                            SELECT 1
                            FROM claims AS user_claim
                            WHERE user_claim.listing_id = listings.id
                                AND user_claim.claimant_user_id = %s
                        )
                    )
                """,
                (listing_id, user["id"], user["role"], user["role"], user["id"])
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
            "availability_windows": rows[0][3],
            "travel_distance_miles": rows[0][4],
            "additional_instructions": rows[0][5],
            "status": rows[0][6],
            "created_at": rows[0][7].isoformat(),
            "updated_at": rows[0][8].isoformat(),
            "location": {
                "address_text": rows[0][9],
                "latitude": str(rows[0][10]),
                "longitude": str(rows[0][11]),
            },
            "foods": [build_food_item(row, 12) for row in rows],
            "creator": {
                "organization_name": rows[0][20],
                "email": rows[0][21],
            },
            "claim": {
                "id": rows[0][22],
                "claimant_user_id": rows[0][23],
                "status": rows[0][24],
                "claimed_at": rows[0][25].isoformat() if rows[0][25] else None,
                "resolved_at": rows[0][26].isoformat() if rows[0][26] else None,
            } if rows[0][22] else None,
            "current_user": {
                "id": user["id"],
                "role": user["role"],
            },
        }
    })


router.get("/api/listings/details", get_listing_details)


#PATCH endpoint handler that updates an available listing owned by the current user
def edit_listing(handler):
    body = parse_body(handler)
    if body is None:
        return send_json(handler, 400, {"error": "Invalid JSON body"})

    body = strip_strings(body)
    required_fields = [
        "listing_id",
        "foods",
        "availability_windows",
        "address_text",
        "travel_distance_miles",
    ]
    missing = [name for name in required_fields if body.get(name) in (None, "")]
    if missing:
        return send_json(handler, 400, {"error": f"Missing fields: {','.join(missing)}"})

    try:
        listing_id = int(body["listing_id"])
        if listing_id <= 0:
            raise ValueError("listing_id must be greater than zero")

        foods = parse_food_items(body["foods"])
        availability_windows = parse_availability_windows(body["availability_windows"])
        travel_distance_miles = int(body["travel_distance_miles"])
        if travel_distance_miles < 0:
            raise ValueError("travel_distance_miles must be 0 or greater")

        latitude = parse_decimal(body.get("latitude"), "latitude") if "latitude" in body else None
        longitude = parse_decimal(body.get("longitude"), "longitude") if "longitude" in body else None
        if latitude is not None and (latitude < Decimal("-90") or latitude > Decimal("90")):
            raise ValueError("latitude must be between -90 and 90")
        if longitude is not None and (longitude < Decimal("-180") or longitude > Decimal("180")):
            raise ValueError("longitude must be between -180 and 180")
    except (TypeError, ValueError) as exc:
        return send_json(handler, 400, {"error": str(exc)})

    user = get_user(handler)
    additional_instructions = body.get("additional_instructions") or None

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT listings.id, listings.location_id, listings.status
                FROM listings
                WHERE listings.id = %s
                    AND listings.creator_user_id = %s
                """,
                (listing_id, user["id"])
            )
            listing = cur.fetchone()

            if not listing:
                db.rollback()
                return send_json(handler, 404, {"error": "Listing not found"})

            if listing[2] != "available":
                db.rollback()
                return send_json(handler, 409, {"error": "Only available listings can be edited."})

            if latitude is None or longitude is None:
                cur.execute(
                    """
                    UPDATE locations
                    SET address_text = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (body["address_text"], listing[1])
                )
            else:
                cur.execute(
                    """
                    UPDATE locations
                    SET address_text = %s,
                        latitude = %s,
                        longitude = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (body["address_text"], latitude, longitude, listing[1])
                )

            cur.execute(
                """
                UPDATE listings
                SET availability_windows = %s,
                    travel_distance_miles = %s,
                    additional_instructions = %s,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id, status, updated_at
                """,
                (
                    Json(availability_windows),
                    travel_distance_miles,
                    additional_instructions,
                    listing_id,
                )
            )
            updated_listing = cur.fetchone()

            cur.execute("DELETE FROM listing_food_items WHERE listing_id = %s", (listing_id,))

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
                    VALUES(%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        listing_id,
                        food["name"],
                        food["description"],
                        food["category"],
                        food["is_perishable"],
                        food["quantity"],
                        food["quantity_unit"],
                        food["expiration_date"],
                    )
                )

        db.commit()
    except errors.CheckViolation:
        db.rollback()
        return send_json(handler, 400, {"error": "Listing data failed validation"})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to edit listing."})

    return send_json(handler, 200, {
        "listing": {
            "id": updated_listing[0],
            "status": updated_listing[1],
            "updated_at": updated_listing[2].isoformat(),
        }
    })


router.patch("/api/listings/edit", edit_listing)
