from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from psycopg2 import errors

from database.database import db
from router import Router
from sessions import get_user
from utils import parse_body, strip_strings, send_json


router = Router()


ALLOWED_FOOD_CATEGORIES = {

    "produce",
    "dairy",
    "baked_goods",
    "canned_goods",
    "frozen",
    "prepared_meals",
    "beverages",
    "dry_goods",
    "meat_seafood",
    "snacks",
    "baby_food",
    "mixed",
    "other"
}


def normalize_food_category(value): # start of normalize_food_category() function definition

    if not isinstance(value, str):
        return None

    raw = value.strip().lower()
    aliases = {

        "bakery" : "baked_goods",

        "baked goods" : "baked_goods",

        "prepared meals" : "prepared_meals", "prepared meal" : "prepared_meals",

        "canned goods" : "canned_goods",

        "dry goods": "dry_goods",

        "baby food" : "baby_food",

        "meat and seafood" : "meat_seafood",

        "meat & seafood": "meat_seafood",
    }

    if raw in aliases:
        return aliases[raw]

    
    normalized = raw.replace("-", "_").replace(" ", "_")
    return normalized if normalized in ALLOWED_FOOD_CATEGORIES else None

# end of normalize_food_category() function definition



def parse_datetime(value, field_name): # start of parse_datetime() function definition


    if not isinstance(value, str) or not value:
        raise ValueError(f"{field_name} must be a valid ISO datetime") 

    text = value[:-1] + "+00:00" if value.endswith("Z") else value

    try:
        parsed = datetime.fromisoformat(text)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO datetime") from exc

    if parsed.tzinfo is None:
        raise ValueError(f"{field_name} must include a timezone offset")

    return parsed

# end of parse_datetime() function definition



def parse_optional_date(value, field_name): # start of parse_optional_date() function definition

    if value in (None, ""):
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a valid ISO date") 

    try: 
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO date") from exc

# start of parse_optional_date() function definition




def parse_decimal(value, field_name): # start of parse_decimal() function definition
    try:
        return Decimal(str(value))
    except(InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid number") from exc
# end of parse_decimal() function definition












def create_offer(handler): # start of create_offer() function definition

    """
    main endpoint function that handles POST /api/listings/offers/create
    """

    # authenticate + authorize User
    body = parse_body(handler)
    if body is None:
        return send_json(handler, 400, {"error": "Invalid JSON body"})

    body = strip_strings(body)

    try:
        user = get_user(handler)
    except Exception:
        return send_json(handler, 500, {"error": "Unable to load session due to server error"})

    if user["role"] != "food_provider":
        return send_json(handler, 403, {"error": "Only food providers can create offers"})



    


    # reaching here means authentication and authorization passed so now we can validate+normalize required fields

    required_fields = [  # mandatory fields of an Offer creation
        "food_name", 
        "food_category",
        "quantity",
        "quantity_unit",
        "pickup_window_start",
        "pickup_window_end",
        "address_text",
        "latitude",
        "longitude"
    ]

    missing = [name for name in required_fields if body.get(name) in (None, "")]
    if "is_perishable" not in body:
        missing.append("is_perishable")
    if missing:
        return send_json(handler, 400, {"error": f"Missing fields: {','.join(missing)}"})
    
    if not isinstance(body["is_perishable"], bool):
        return send_json(handler, 400, {"error": "is_perishable must be a boolean"})

    food_category = normalize_food_category(body["food_category"])
    if food_category is None:
        return send_json(handler, 400, {"error": "Invalid food_category"})

    
    try:

        quantity = parse_decimal(body["quantity"], "quantity")
        if quantity <= 0:
            raise ValueError("quantity must be greater than 0")

        latitude = parse_decimal(body["latitude"], "latitude")
        if latitude < Decimal("-90") or latitude > Decimal("90"):
            raise ValueError("latitude must be between -90 and 90")

        longitude = parse_decimal(body["longitude"], "longitude")
        if longitude < Decimal("-180") or longitude > Decimal("180"):
            raise ValueError("longitude must be between -180 and 180")

        travel_distance_miles = int(body.get("travel_distance_miles",0))
        if travel_distance_miles < 0:
            raise ValueError("travel_distance_miles must be 0 or greater")

        pickup_window_start = parse_datetime(body["pickup_window_start"], "pickup_window_start")
        pickup_window_end = parse_datetime(body["pickup_window_end"], "pickup_window_end")
        if pickup_window_end < pickup_window_start:
            raise ValueError("pick window end must be on or after pickup window start")

        discard_deadline = None
        if body.get("discard_deadline") not in (None, ""):
            discard_deadline = parse_datetime(body["discard_deadline"], "discard_deadline")
            if discard_deadline < pickup_window_start:
                raise ValueError("discard_deadline must be on or after pickup_window_start")

        expiration_date = parse_optional_date(body.get("expiration_date"), "expiration_date")

    except(TypeError, ValueError) as exc:
        return send_json(handler, 400, {"error": str(exc)})

    food_description = body.get("food_description") or None
    additional_instructions = body.get("additional_instructions") or None






    # reaching here means all the data is valid and normalized, we can perform DB transactions

    try:

        with db.cursor() as cur:

            cur.execute( # insert a new `location` role because `listing` needs a FK to `location`
                """
                INSERT into locations(
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

            cur.execute( # insert the main listing row, linking it to location and authenticated user
                """

                INSERT into listings(

                    creator_user_id,
                    listing_type,
                    location_id,
                    pickup_window_start,
                    pickup_window_end,
                    discard_deadline,
                    travel_distance_miles,
                    additional_instructions
                
                )
                VALUES(%s, 'offer', %s, %s, %s, %s, %s, %s)
                RETURNING id, status, created_at, updated_at
                """,
                (
                    user["id"],
                    location_id,
                    pickup_window_start,
                    pickup_window_end,
                    discard_deadline,
                    travel_distance_miles,
                    additional_instructions,
                )

            )
            listing = cur.fetchone()


            cur.execute( # insert the food specific detail role associated with the listing

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
                VALUES (%s, %s, %s, %s, %s,%s, %s, %s)
                RETURNING id
                """,
                (
                  listing[0],
                  body["food_name"],
                  food_description,
                  food_category,
                  body["is_perishable"],
                  quantity,
                  body["quantity_unit"],
                  expiration_date,
                )
            )
            food_item_id = cur.fetchone()[0]

        db.commit() # lock in the database transactions


    except errors.CheckViolation:
        db.rollback()
        return send_json(handler, 400, {"error": "Offer data failed validation"})
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to create offer due to server error"})


    # reaching here means all validations passed, the db inserts successful and all transactions locked in

    return send_json(handler, 201, { # return to the User

        "offer": {
            "id": listing[0],
            "creator_user_id": user["id"],
            "type": "offer",
            "status": listing[1],
            "created_at": listing[2].isoformat(),
            "updated_at": listing[3].isoformat(),
            "pickup_window_start": pickup_window_start.isoformat(),
            "pickup_window_end": pickup_window_end.isoformat(),
            "discard_deadline": discard_deadline.isoformat() if discard_deadline else None,
            "travel_distance_miles": travel_distance_miles,
            "additional_instructions": additional_instructions,
            "location": {
                "id": location_id,
                "address_text": body["address_text"],
                "latitude": str(latitude),
                "longitude": str(longitude),
            },
            "food": {
                "id": food_item_id,
                "name": body["food_name"],
                "description": food_description,
                "category": food_category,
                "is_perishable": body["is_perishable"],
                "quantity": str(quantity),
                "quantity_unit": body["quantity_unit"],
                "expiration_date": expiration_date.isoformat() if expiration_date else None,
            },
        }
    })

# end of create_offer function definition


router.post("/api/listings/offers/create", create_offer) # register the POST endpoint path and bind it to create_offer()