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
    parse_positive_int,
    parse_validate_body,
    send_json,
)

router = Router()

LISTING_SELECT_COLUMNS = """
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
"""
LISTING_SELECT_JOINS = """
    JOIN locations
        ON locations.id = listings.location_id
    JOIN listing_food_items
        ON listing_food_items.listing_id = listings.id
    JOIN users AS creator
        ON creator.id = listings.creator_user_id
"""

LISTING_ID_INDEX = 0
LISTING_CREATOR_USER_ID_INDEX = 1
LISTING_TYPE_INDEX = 2
LISTING_AVAILABILITY_INDEX = 3
LISTING_TRAVEL_DISTANCE_INDEX = 4
LISTING_ADDITIONAL_INSTRUCTIONS_INDEX = 5
LISTING_STATUS_INDEX = 6
LISTING_CREATED_AT_INDEX = 7
LISTING_UPDATED_AT_INDEX = 8
LISTING_LOCATION_ADDRESS_INDEX = 9
LISTING_LOCATION_LATITUDE_INDEX = 10
LISTING_LOCATION_LONGITUDE_INDEX = 11
LISTING_FOOD_START_INDEX = 12
LISTING_CREATOR_ORGANIZATION_INDEX = 20
DETAIL_CREATOR_EMAIL_INDEX = 21
DETAIL_CLAIM_START_INDEX = 22


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
        "expiration_date": (
            row[start_index + 7].isoformat() if row[start_index + 7] else None
        ),
    }


# We will format one listing row and leave room for multiple food items
def build_listing_record(row):
    return {
        "id": row[LISTING_ID_INDEX],
        "creator_user_id": row[LISTING_CREATOR_USER_ID_INDEX],
        "listing_type": row[LISTING_TYPE_INDEX],
        "availability_windows": row[LISTING_AVAILABILITY_INDEX],
        "travel_distance_miles": row[LISTING_TRAVEL_DISTANCE_INDEX],
        "additional_instructions": row[LISTING_ADDITIONAL_INSTRUCTIONS_INDEX],
        "status": row[LISTING_STATUS_INDEX],
        "created_at": row[LISTING_CREATED_AT_INDEX].isoformat(),
        "updated_at": row[LISTING_UPDATED_AT_INDEX].isoformat(),
        "location": {
            "address_text": row[LISTING_LOCATION_ADDRESS_INDEX],
            "latitude": str(row[LISTING_LOCATION_LATITUDE_INDEX]),
            "longitude": str(row[LISTING_LOCATION_LONGITUDE_INDEX]),
        },
        "foods": [],
        "creator": {
            "organization_name": row[LISTING_CREATOR_ORGANIZATION_INDEX],
        },
    }


# We will group joined listing rows so each listing appears once with a foods array
def build_listing_records(rows, relationship=None):
    records_by_id = {}

    for row in rows:
        listing_id = row[LISTING_ID_INDEX]
        if listing_id not in records_by_id:
            record = build_listing_record(row)
            if relationship:
                record["relationship"] = relationship
            records_by_id[listing_id] = record

        records_by_id[listing_id]["foods"].append(
            build_food_item(row, LISTING_FOOD_START_INDEX)
        )

    return list(records_by_id.values())


def build_listing_detail_record(rows, user):
    row = rows[0]

    return {
        "id": row[LISTING_ID_INDEX],
        "creator_user_id": row[LISTING_CREATOR_USER_ID_INDEX],
        "type": row[LISTING_TYPE_INDEX],
        "availability_windows": row[LISTING_AVAILABILITY_INDEX],
        "travel_distance_miles": row[LISTING_TRAVEL_DISTANCE_INDEX],
        "additional_instructions": row[LISTING_ADDITIONAL_INSTRUCTIONS_INDEX],
        "status": row[LISTING_STATUS_INDEX],
        "created_at": row[LISTING_CREATED_AT_INDEX].isoformat(),
        "updated_at": row[LISTING_UPDATED_AT_INDEX].isoformat(),
        "location": {
            "address_text": row[LISTING_LOCATION_ADDRESS_INDEX],
            "latitude": str(row[LISTING_LOCATION_LATITUDE_INDEX]),
            "longitude": str(row[LISTING_LOCATION_LONGITUDE_INDEX]),
        },
        "foods": [
            build_food_item(food_row, LISTING_FOOD_START_INDEX) for food_row in rows
        ],
        "creator": {
            "organization_name": row[LISTING_CREATOR_ORGANIZATION_INDEX],
            "email": row[DETAIL_CREATOR_EMAIL_INDEX],
        },
        "claim": build_listing_claim(row),
        "current_user": {
            "id": user["id"],
            "role": user["role"],
        },
    }


def build_listing_claim(row):
    if not row[DETAIL_CLAIM_START_INDEX]:
        return None

    return {
        "id": row[DETAIL_CLAIM_START_INDEX],
        "claimant_user_id": row[DETAIL_CLAIM_START_INDEX + 1],
        "status": row[DETAIL_CLAIM_START_INDEX + 2],
        "claimed_at": row[DETAIL_CLAIM_START_INDEX + 3].isoformat()
        if row[DETAIL_CLAIM_START_INDEX + 3]
        else None,
        "resolved_at": row[DETAIL_CLAIM_START_INDEX + 4].isoformat()
        if row[DETAIL_CLAIM_START_INDEX + 4]
        else None,
    }


def parse_listing_payload(body, *, require_coordinates):
    foods = parse_food_items(body["foods"])
    availability_windows = parse_availability_windows(
        body.get("availability_windows")
    )
    travel_distance_miles = int(body.get("travel_distance_miles", 0))
    if travel_distance_miles < 0:
        raise ValueError("travel_distance_miles must be 0 or greater")

    latitude = None
    longitude = None
    if require_coordinates or "latitude" in body:
        latitude = parse_decimal(body["latitude"], "latitude")
    if require_coordinates or "longitude" in body:
        longitude = parse_decimal(body["longitude"], "longitude")

    return {
        "foods": foods,
        "availability_windows": availability_windows,
        "address_text": body["address_text"],
        "latitude": latitude,
        "longitude": longitude,
        "travel_distance_miles": travel_distance_miles,
        "additional_instructions": body.get("additional_instructions") or None,
    }


def insert_listing_food_items(cur, listing_id, foods, *, return_ids=False):
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
            """
            + (" RETURNING id" if return_ids else ""),
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
        if return_ids:
            food_item_ids.append(cur.fetchone()[0])

    return food_item_ids


# GET endpoint handler that returns requests for providers or offers for recipients
def get_offers_requests(handler):

    user = get_user(handler)
    user_role = user["role"]

    if user_role == "food_provider":
        target_listing_type = "request"
    else:
        target_listing_type = "offer"

    try:
        with db.cursor() as cur:
            cur.execute(
                f"""
                SELECT {LISTING_SELECT_COLUMNS}
                FROM listings
                {LISTING_SELECT_JOINS}
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
        return send_json(
            handler, 500, {"error": "Unable to load offers or requests."}
        )

    records = build_listing_records(rows)

    return send_json(
        handler,
        200,
        {
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
                f"""
                SELECT {LISTING_SELECT_COLUMNS}
                FROM listings
                {LISTING_SELECT_JOINS}
                WHERE listings.creator_user_id = %s
                    AND listings.status IN ('available', 'claimed')
                ORDER BY listings.created_at DESC, listings.id DESC
                """,
                (user["id"],),
            )
            own_rows = cur.fetchall()

            cur.execute(
                f"""
                SELECT {LISTING_SELECT_COLUMNS}
                FROM claims
                JOIN listings
                    ON listings.id = claims.listing_id
                {LISTING_SELECT_JOINS}
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
        },
    )


# GET endpoint handler that returns the full details for one listing
def get_listing_details(handler):
    listing_id = get_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 400, {"error": "Missing listing id."})

    try:
        listing_id = parse_positive_int(listing_id, "Listing id")
    except ValueError as exc:
        return send_json(handler, 400, {"error": str(exc)})

    try:
        user = get_user(handler)

        with db.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    {LISTING_SELECT_COLUMNS},
                    creator.email,
                    claims.id,
                    claims.claimant_user_id,
                    claims.status,
                    claims.claimed_at,
                    claims.resolved_at
                FROM listings
                {LISTING_SELECT_JOINS}
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
        {"record": build_listing_detail_record(rows, user)},
    )


# POST endpoint handler that creates an offer or request listing
def create_listing(handler, listing_type):
    body = parse_validate_body(handler, ["foods", "address_text", "latitude", "longitude"])
    if body is None:
        return

    user = get_user(handler)

    try:
        listing_payload = parse_listing_payload(body, require_coordinates=True)
    except (TypeError, ValueError) as exc:
        return send_json(handler, 400, {"error": str(exc)})

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
                (
                    listing_payload["address_text"],
                    listing_payload["latitude"],
                    listing_payload["longitude"],
                ),
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
                    Json(listing_payload["availability_windows"]),
                    listing_payload["travel_distance_miles"],
                    listing_payload["additional_instructions"],
                ),
            )
            listing = cur.fetchone()

            food_item_ids = insert_listing_food_items(
                cur, listing[0], listing_payload["foods"], return_ids=True
            )

        db.commit()
    except errors.CheckViolation:
        db.rollback()
        return send_json(
            handler,
            400,
            {"error": f"{listing_type.capitalize()} data failed validation."},
        )
    except Exception:
        db.rollback()
        return send_json(
            handler,
            500,
            {"error": f"Unable to create {listing_type} due to server error."},
        )

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
                "availability_windows": listing_payload["availability_windows"],
                "travel_distance_miles": listing_payload["travel_distance_miles"],
                "additional_instructions": listing_payload["additional_instructions"],
                "location": {
                    "id": location_id,
                    "address_text": listing_payload["address_text"],
                    "latitude": str(listing_payload["latitude"]),
                    "longitude": str(listing_payload["longitude"]),
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
                        "expiration_date": (
                            food["expiration_date"].isoformat()
                            if food["expiration_date"]
                            else None
                        ),
                    }
                    for index, food in enumerate(listing_payload["foods"])
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
        listing_id = parse_positive_int(body["listing_id"], "listing_id")

        listing_payload = parse_listing_payload(body, require_coordinates=False)
    except (TypeError, ValueError) as exc:
        return send_json(handler, 400, {"error": str(exc)})

    user = get_user(handler)

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

            if listing_payload["latitude"] is None or listing_payload["longitude"] is None:
                cur.execute(
                    """
                    UPDATE locations
                    SET address_text = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (listing_payload["address_text"], listing[1]),
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
                    (
                        listing_payload["address_text"],
                        listing_payload["latitude"],
                        listing_payload["longitude"],
                        listing[1],
                    ),
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
                    Json(listing_payload["availability_windows"]),
                    listing_payload["travel_distance_miles"],
                    listing_payload["additional_instructions"],
                    listing_id,
                ),
            )
            updated_listing = cur.fetchone()

            cur.execute("DELETE FROM listing_food_items WHERE listing_id = %s", (listing_id,))
            insert_listing_food_items(cur, listing_id, listing_payload["foods"])

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
