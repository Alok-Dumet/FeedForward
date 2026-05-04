from psycopg2.extras import Json, execute_values

from database.database import db
from router import Router
from sessions import get_user
from utils import (
    parse_availability_windows,
    parse_food_items,
    parse_positive_int,
    parse_query_param,
    parse_validate_body,
    send_json,
)

router = Router()

LISTING_FIELDS = """
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
    creator.organization_name,
    creator.email,
    claims.id,
    claims.claimant_user_id,
    claims.claimed_at,
    claims.resolved_at
"""
LISTING_TABLES = """
FROM listings
JOIN locations
    ON locations.id = listings.location_id
JOIN users AS creator
    ON creator.id = listings.creator_user_id
LEFT JOIN claims
    ON claims.listing_id = listings.id
"""

LISTING_SELECT = f"""
SELECT
{LISTING_FIELDS}
{LISTING_TABLES}
"""
LISTING_SELECT_WITH_RELATIONSHIP = f"""
SELECT
{LISTING_FIELDS},
    %s AS relationship
{LISTING_TABLES}
"""

INSERT_FOOD_ITEM_QUERY = """
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
VALUES %s
RETURNING id
"""


# We will fetch all unique listing_items for the given listing ids
def get_food_rows(cur, listing_ids):
    if not listing_ids:
        return []

    cur.execute(
        """
        SELECT
            listing_id,
            id,
            food_name,
            food_description,
            food_category,
            is_perishable,
            quantity,
            quantity_unit,
            expiration_date
        FROM listing_food_items
        WHERE listing_id = ANY(%s)
        ORDER BY listing_id, id
        """,
        (listing_ids)
    )

    return cur.fetchall()


# We will build the slim listing card records used by /api/listings and GET /api/my-listings
# Each record contains the listing fields, location, creator's organization name, its food items, and an optional "relationship" tag ("own" or "claimed")
def build_listing_records(listing_rows, food_rows):
    grouped_foods = {}
    for food in food_rows:
        grouped_foods.setdefault(food[0], []).append(
            {
                "id": food[1],
                "name": food[2],
                "description": food[3],
                "category": food[4],
                "is_perishable": food[5],
                "quantity": str(food[6]),
                "quantity_unit": food[7],
                "expiration_date": food[8].isoformat() if food[8] else None,
            }
        )

    records = []
    for row in listing_rows:
        record = {
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
            "creator": {
                "organization_name": row[12],
            },
            "foods": grouped_foods.get(row[0], []),
        }
        if len(row) > 18:
            record["relationship"] = row[18]
        records.append(record)

    return records


# We will build the detailed listing record for the details page.
# It additionally stores creator email, the claim record (if claimed), and some columns from the creator
def build_listing_detail_record(listing_row, food_rows, user):
    row = listing_row
    claim = None
    if row[14]:
        claim = {
            "id": row[14],
            "claimant_user_id": row[15],
            "claimed_at": row[16].isoformat() if row[16] else None,
            "resolved_at": row[17].isoformat() if row[17] else None,
        }

    return {
        "id": row[0],
        "creator_user_id": row[1],
        "type": row[2],
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
        "foods": [
            {
                "id": food[1],
                "name": food[2],
                "description": food[3],
                "category": food[4],
                "is_perishable": food[5],
                "quantity": str(food[6]),
                "quantity_unit": food[7],
                "expiration_date": food[8].isoformat() if food[8] else None,
            }
            for food in food_rows
        ],
        "creator": {
            "organization_name": row[12],
            "email": row[13],
        },
        "claim": claim,
        "current_user": {
            "id": user["id"],
            "role": user["role"],
        },
    }


# Helper function for checking if the user's submitted listing in malformed
def parse_listing_payload(body):
    foods = parse_food_items(body["foods"])
    availability_windows = parse_availability_windows(body.get("availability_windows"))
    travel_distance_miles = int(body.get("travel_distance_miles", 0))
    if travel_distance_miles < 0:
        raise ValueError("travel_distance_miles must be 0 or greater")

    listing_payload = {
        "foods": foods,
        "availability_windows": availability_windows,
        "travel_distance_miles": travel_distance_miles,
        "additional_instructions": body.get("additional_instructions") or None,
    }
    if "address_text" in body:
        listing_payload["address_text"] = body["address_text"]

    return listing_payload


# Helper function for inserting a new listing_item when editing or creating a listing
def insert_listing_food_items(cur, listing_id, foods):
    inserted_foods = execute_values(
        cur,
        INSERT_FOOD_ITEM_QUERY,
        [
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
            for food in foods
        ],
        fetch=True,
    )

    return [food[0] for food in inserted_foods]


# GET endpoint handler that returns requests for providers or offers for recipients
def get_offers_requests(handler):
    user = get_user(handler)
    user_role = user["role"]

    target_listing_type = "request" if user_role == "food_provider" else "offer"

    try:
        with db.cursor() as cur:
            cur.execute(
                f"""
                {LISTING_SELECT}
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

            listing_rows = cur.fetchall()
            food_rows = get_food_rows(cur, [row[0] for row in listing_rows])
    except Exception as exc:
        db.rollback()
        print(f"[get_offers_requests] DB error: {exc}")
        return send_json(handler, 500, {"error": "Unable to load offers or requests."})

    records = build_listing_records(listing_rows, food_rows)

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
                {LISTING_SELECT_WITH_RELATIONSHIP}
                WHERE listings.creator_user_id = %s
                    AND listings.status IN ('available', 'claimed')

                UNION

                {LISTING_SELECT_WITH_RELATIONSHIP}
                WHERE claims.claimant_user_id = %s
                    AND listings.status = 'claimed'

                ORDER BY updated_at DESC, id DESC
                """,
                ("own", user["id"], "claimed", user["id"]),
            )
            listing_rows = cur.fetchall()
            food_rows = get_food_rows(cur, [row[0] for row in listing_rows])
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load your listings."})

    return send_json(
        handler,
        200,
        {
            "records": build_listing_records(listing_rows, food_rows),
        },
    )


# GET endpoint handler that returns the full details for one listing
def get_listing_details(handler):
    listing_id = parse_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 400, {"error": "Missing listing id."})

    try:
        listing_id = parse_positive_int(listing_id, "Listing id")
    except ValueError:
        return send_json(handler, 400, {"error": "Invalid listing id."})

    try:
        user = get_user(handler)

        with db.cursor() as cur:
            cur.execute(
                f"""
                {LISTING_SELECT}
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
            listing_row = cur.fetchone()

            if not listing_row:
                return send_json(handler, 404, {"error": "Listing not found."})

            food_rows = get_food_rows(cur, [listing_row[0]])
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load listing details."})

    return send_json(
        handler,
        200,
        {"record": build_listing_detail_record(listing_row, food_rows, user)},
    )


# The core code for create_offer and create_request POST endpoint handlers
def create_listing(handler, listing_type):
    body = parse_validate_body(handler, ["foods"])
    if body is None:
        return

    user = get_user(handler)
    if not user["location_id"]:
        return send_json(handler, 400, {"error": "Your account needs a valid location before creating a listing."})

    try:
        listing_payload = parse_listing_payload(body)
    except (TypeError, ValueError):
        return send_json(handler, 400, {"error": "Listing information is invalid."})

    try:
        with db.cursor() as cur:
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
                    user["location_id"],
                    Json(listing_payload["availability_windows"]),
                    listing_payload["travel_distance_miles"],
                    listing_payload["additional_instructions"],
                ),
            )
            listing = cur.fetchone()

            food_item_ids = insert_listing_food_items(cur, listing[0], listing_payload["foods"])

        db.commit()
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
                    "id": user["location_id"],
                    "address_text": user["address_text"],
                    "latitude": user["latitude"],
                    "longitude": user["longitude"],
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
                        "expiration_date": (food["expiration_date"].isoformat() if food["expiration_date"] else None),
                    }
                    for index, food in enumerate(listing_payload["foods"])
                ],
            }
        },
    )

# POST endpoint handler that creates an offer
def create_offer(handler):
    return create_listing(handler, "offer")


# POST endpoint handler that creates a request
def create_request(handler):
    return create_listing(handler, "request")


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

        listing_payload = parse_listing_payload(body)
    except (TypeError, ValueError):
        return send_json(handler, 400, {"error": "Listing information is invalid."})

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

            cur.execute(
                """
                UPDATE locations
                SET address_text = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (listing_payload["address_text"], listing[1]),
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
router.post("/api/listings/offers/create", create_offer)
router.post("/api/listings/requests/create", create_request)
router.patch("/api/listings/edit", edit_listing)
