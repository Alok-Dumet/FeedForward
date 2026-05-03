from psycopg2 import errors
from psycopg2.extras import Json

from database.database import db
from router import Router
from sessions import get_user
from utils import (
    get_query_param,
    parse_availability_windows,
    parse_decimal,
    parse_food_items,
    parse_validate_body,
    send_json,
)

router = Router()


# We will format one food item from a joined listing_food_items row
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


# We will format one listing row and leave room for multiple food items
def build_listing_record(row):
    return {
        "id": row[0],
        "creator_user_id": row[1],
        "listing_type": row[2],
        "availability_windows": row[3],
        "travel_distance_miles": row[4],
        "additional_instructions": row[5],
        "status": row[6],
        "created_at": row[7].isoformat(),
        "updated_at": row[8].isoformat(),
        "location": {
            "address_text": row[9],
            "latitude": str(row[10]),
            "longitude": str(row[11]),
        },
        "foods": [],
        "creator": {
            "organization_name": row[20],
        },
    }


# We will group joined listing rows so each listing appears once with a foods array
def build_listing_records(rows, relationship=None):
    records_by_id = {}

    for row in rows:
        listing_id = row[0]
        if listing_id not in records_by_id:
            record = build_listing_record(row)
            if relationship:
                record["relationship"] = relationship
            records_by_id[listing_id] = record

        records_by_id[listing_id]["foods"].append(build_food_item(row, 12))

    return list(records_by_id.values())


# GET endpoint handler that returns requests for providers or offers for recipients
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
                ),
            )

            rows = cur.fetchall()
    except Exception as exc:
        db.rollback()
        print(f"[get_offers_requests] DB error: {exc!r}")
        return send_json(handler, 500, {"error": "Unable to load offers or requests."})

    records = build_listing_records(rows)

    return send_json(
        handler,
        200,
        {
            "view_mode": view_mode,
            "records": records,
            "current_user": {
                "id": user["id"],
                "role": user_role,
                "organization_name": user["organization_name"],
                "latitude": user["latitude"],
                "longitude": user["longitude"],
            },
        },
    )


# GET endpoint handler that returns the current user's active and claimed listings
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
                (user["id"],),
            )
            own_rows = cur.fetchall()

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
                    AND listings.status NOT IN ('completed', 'cancelled')
                ORDER BY claims.claimed_at DESC, listings.id DESC
                """,
                (user["id"],),
            )
            claimed_rows = cur.fetchall()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load your listings."})

    own_records = build_listing_records(own_rows, "own")
    claimed_records = build_listing_records(claimed_rows, "claimed")

    return send_json(
        handler,
        200,
        {
            "records": own_records + claimed_records,
            "current_user": {
                "id": user["id"],
                "role": user["role"],
                "organization_name": user["organization_name"],
            },
        },
    )


# GET endpoint handler that returns the full details for one listing
def get_listing_details(handler):
    listing_id = get_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 400, {"error": "Missing listing id."})

    try:
        listing_id = int(listing_id)
    except ValueError:
        return send_json(handler, 400, {"error": "Listing id must be a valid number."})
    if listing_id <= 0:
        return send_json(handler, 400, {"error": "Listing id must be greater than zero."})

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
                (listing_id, user["id"], user["role"], user["role"], user["id"]),
            )
            rows = cur.fetchall()
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load listing details."})

    if not rows:
        return send_json(handler, 404, {"error": "Listing not found."})

    return send_json(
        handler,
        200,
        {
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
                }
                if rows[0][22]
                else None,
                "current_user": {
                    "id": user["id"],
                    "role": user["role"],
                },
            }
        },
    )


# POST endpoint handler that creates an offer or request listing
def create_listing(handler, listing_type):
    body = parse_validate_body(handler, ["foods", "address_text", "latitude", "longitude"])
    if body is None:
        return

    user = get_user(handler)

    try:
        foods = parse_food_items(body["foods"])
        availability_windows = parse_availability_windows(body.get("availability_windows"))

        latitude = parse_decimal(body["latitude"], "latitude")
        longitude = parse_decimal(body["longitude"], "longitude")

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
                (body["address_text"], latitude, longitude),
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
                VALUES(%s, %s, %s, %s, %s, %s)
                RETURNING id, status, created_at, updated_at
                """,
                (
                    user["id"],
                    listing_type,
                    location_id,
                    Json(availability_windows),
                    travel_distance_miles,
                    additional_instructions,
                ),
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
                    VALUES(%s, %s, %s, %s, %s, %s, %s, %s)
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
                    ),
                )
                food_item_ids.append(cur.fetchone()[0])

        db.commit()
    except errors.CheckViolation:
        db.rollback()
        return send_json(handler, 400, {"error": f"{listing_type.capitalize()} data failed validation."})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": f"Unable to create {listing_type} due to server error."})

    return send_json(
        handler,
        201,
        {
            listing_type: {
                "id": listing[0],
                "creator_user_id": user["id"],
                "type": listing_type,
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
        },
    )


# PATCH endpoint handler that updates an available listing owned by the current user
def edit_listing(handler):
    body = parse_validate_body(
        handler,
        [
            "listing_id",
            "foods",
            "availability_windows",
            "address_text",
            "travel_distance_miles",
        ],
    )
    if body is None:
        return

    try:
        listing_id = int(body["listing_id"])
        if listing_id <= 0:
            raise ValueError("listing_id must be greater than zero")

        foods = parse_food_items(body["foods"])
        availability_windows = parse_availability_windows(body["availability_windows"])
        travel_distance_miles = int(body["travel_distance_miles"])
        if travel_distance_miles < 0:
            raise ValueError("travel_distance_miles must be 0 or greater")

        latitude = parse_decimal(body["latitude"], "latitude") if "latitude" in body else None
        longitude = parse_decimal(body["longitude"], "longitude") if "longitude" in body else None
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
                (listing_id, user["id"]),
            )
            listing = cur.fetchone()

            if not listing:
                db.rollback()
                return send_json(handler, 404, {"error": "Listing not found."})

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
                    (body["address_text"], listing[1]),
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
                    (body["address_text"], latitude, longitude, listing[1]),
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
                ),
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
                    ),
                )

        db.commit()
    except errors.CheckViolation:
        db.rollback()
        return send_json(handler, 400, {"error": "Listing data failed validation"})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to edit listing."})

    return send_json(
        handler,
        200,
        {
            "listing": {
                "id": updated_listing[0],
                "status": updated_listing[1],
                "updated_at": updated_listing[2].isoformat(),
            }
        },
    )


router.get("/api/listings", get_offers_requests)
router.get("/api/my-listings", get_my_listings)
router.get("/api/listings/details", get_listing_details)
router.post("/api/listings/offers/create", lambda handler: create_listing(handler, "offer"))
router.post("/api/listings/requests/create", lambda handler: create_listing(handler, "request"))
router.patch("/api/listings/edit", edit_listing)
