from database.database import db
from router import Router
from sessions import get_user
from utils import parse_validate_body, send_json, get_query_param
from psycopg2 import errors


router = Router()


"""
define four API endpoints
 .../listings/details
 .../listings/accept
 .../listings
 .../my-listings
"""

def get_listing_details(handler): # start of get_listing_details() function definition


    """ GET endpoint handler that returns the full details for one listing """

    listing_id = get_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 400, {"error": "missing listing id"})
    
    try:
        listing_id = int(listing_id)
    except ValueError:
        return send_json(handler, 400, {"error":"Listing id must be a valid number"})
    if listing_id <= 0:
        return send_json(handler, 400, {"error":"Listing id must be greater than zero"})
    
    # reaching here means listing id is present and valid


    try: # start of try-block so any database / runtime error can be caught and returned cleanly

        user = get_user(handler)


        with db.cursor() as cur: # open database cursor

            cur.execute( # start of execute a SELECT
                """
                SELECT  -- begin selecting the fields we want to return to the client
                    listings.id,  -- the listing's primary key
                    listings.creator_user_id,  -- the user id of whoever created the listing
                    listings.listing_type,  -- the type/category of listing
                    listings.pickup_window_start,  -- when pickup can start
                    listings.pickup_window_end,  -- when pickup can end
                    listings.travel_distance_miles,  -- how far someone may need to travel for pickup
                    listings.additional_instructions,  -- any extra notes or instructions attached to the listing
                    listings.status,  -- current status of the listing
                    listings.created_at,  -- timestamp when the listing was created
                    listings.updated_at,  -- timestamp when the listing was last updated

                    locations.address_text,  -- human-readable address for the pickup location
                    locations.latitude,  -- latitude coordinate of the location
                    locations.longitude,  -- longitude coordinate of the location

                    listing_food_items.id,  -- food item id
                    listing_food_items.food_name,  -- name of the food item associated with the listing
                    listing_food_items.food_description,  -- description of that food item
                    listing_food_items.food_category,  -- category/classification of the food item
                    listing_food_items.is_perishable,  -- whether the food is perishable
                    listing_food_items.quantity,  -- how much food is available
                    listing_food_items.quantity_unit,  -- unit for the quantity, such as lbs, boxes, meals, etc.
                    listing_food_items.expiration_date,  -- expiration date for the food item if present

                    creator.organization_name,  -- organization name of the listing creator
                    creator.email,  -- contact email of the listing creator

                    claims.id,  -- claim id if there is an active claim
                    claims.claimant_user_id,  -- user id of the person who claimed the listing
                    claims.status,  -- claim status, but only for pending/accepted claims due to the JOIN condition below
                    claims.claimed_at,  -- when the claim was made
                    claims.resolved_at  -- when the claim was resolved, if it has been resolved
                FROM listings  -- start from the listings table because that is the main entity being requested
                JOIN locations  -- inner join locations because each listing must have an associated location
                    ON locations.id = listings.location_id  -- match each listing to its location row
                JOIN listing_food_items  -- inner join listing_food_items because each listing is expected to have food-item data
                    ON listing_food_items.listing_id = listings.id  -- match the food item row(s) to this listing
                JOIN users AS creator  -- inner join users table, aliased as creator, to get info about the listing creator
                    ON creator.id = listings.creator_user_id  -- match the creator user row to the listing's creator_user_id
                LEFT JOIN claims  -- left join claims because a listing may or may not currently have a claim
                    ON claims.listing_id = listings.id  -- connect claims belonging to this listing
                    AND claims.status IN ('pending', 'accepted')  -- only include active-ish claims, not other claim states
                WHERE listings.id = %s  -- filter down to exactly the requested listing id
                """,
                (listing_id,)  # pass the listing id as a parameter tuple so the query is parameterized safely

            ) # end of execute a SELECT

            rows = cur.fetchall() # read the matching rows from the query result

        # end of database cursor

    except Exception:

        # reaching here means an error occured

        db.rollback()
        return send_json(handler, 500, {"error":"Unable to load listing details"})

    
    if not rows:
        return send_json(handler, 404, {"error":"listing not found"})


    # reaching here means listing details successfully loaded


    return send_json(handler, 200, { # send back assembled listing record

           "record": {  # top-level payload key containing the listing details
                        "id": rows[0][0],  # map selected column 0 to record.id
                        "creator_user_id": rows[0][1],  # map selected column 1 to the creator's user id
                        "type": rows[0][2],  # map selected column 2 to the listing type
                        "pickup_window_start": rows[0][3].isoformat(),  # convert pickup_window_start datetime into an ISO string for JSON
                        "pickup_window_end": rows[0][4].isoformat(),  # convert pickup_window_end datetime into an ISO string for JSON
                        "travel_distance_miles": rows[0][5],  # include the travel distance value directly
                        "additional_instructions": rows[0][6],  # include any extra instructions directly
                        "status": rows[0][7],  # include the listing status directly
                        "created_at": rows[0][8].isoformat(),  # convert created_at datetime into an ISO string
                        "updated_at": rows[0][9].isoformat(),  # convert updated_at datetime into an ISO string
                        
                        "location": {  # nested object for location-related fields
                            "address_text": rows[0][10],  # human-readable address
                            "latitude": str(rows[0][11]),  # convert latitude to string before sending JSON
                            "longitude": str(rows[0][12]),  # convert longitude to string before sending JSON
                        },  # end of nested location object

                        "foods": [build_food_item(row, 13) for row in rows],

                        "creator": {  # nested object for the creator's basic info
                            "organization_name": rows[0][21],  # include the creator organization's name
                            "email": rows[0][22],  # include the creator email for direct coordination
                        },  # end of nested creator object

                        "claim": {  # build a nested claim object if there is an active claim row
                            "id": rows[0][23],  # claim id
                            "claimant_user_id": rows[0][24],  # id of the claimant user
                            "status": rows[0][25],  # claim status
                            "claimed_at": rows[0][26].isoformat() if rows[0][26] else None,  # convert claimed_at if present
                            "resolved_at": rows[0][27].isoformat() if rows[0][27] else None,  # convert resolved_at if present
                        } if rows[0][23] else None,  # if there is no claim id, send claim as null instead of an object

                        "current_user": {  # include basic info about the currently authenticated user
                            "id": user["id"],  # current user's id from the session
                            "role": user["role"],  # current user's role from the session
                        },  # end of nested current_user object

            }  # end of record object
    })
# end of get_listing_details() function definition


# start of accept_listing() function definition
def accept_listing(handler):

    """ POST endpoint handler that lets the current user accept/claim a listing """

    body = parse_validate_body(handler, ["listing_id"]) # parse the JSON request body and require that listing_id be present

    if body is None:
        return

    
    try:
        listing_id = int(body["listing_id"])
    except (TypeError, ValueError):
        return send_json(handler, 400, {"error":"listing_id must be a valid number"})
    if listing_id <= 0:
        return send_json(handler, 400, {"error":"listing_id must be greater than zero"})

    
    try: # start of try-block so DB errors can be caught and returned cleanly

        user = get_user(handler)

        with db.cursor() as cur: # open a database cursor

            cur.execute( # start of execute an INSERT that creates a new claim row for this listing

                """
                INSERT INTO claims( -- the columns of `claims` table that we wish to insert data into

                    listing_id,

                    claimant_user_id,

                    status
                )
                VALUES(%s, %s, 'accepted')                                                  -- insert the provided listing id, current user id and hardcoded status 'accepted'
                RETURNING id, listing_id, claimant_user_id, status, claimed_at              -- immediately return the newly created claim fields
                """,
                (
                    listing_id, # first SQL parameter: the listing id from the request body
                    user["id"] # second SQL parameter: the current authenticated user's id
                )
            ) # end of execute an INSERT that creates a new claim row for this listing

            claim = cur.fetchone() # read the inserted row that was returned by RETURNING

        # end of database cursor
        
        db.commit() # lock-in the transaction so the new claim is saved

    # reaching here means error with the insertion transaction
    except errors.UniqueViolation:
        db.rollback()
        return send_json(handler, 409, {"error":"This listing has already been claimed"})
    except errors.ForeignKeyViolation:
        db.rollback()
        return send_json(handler, 404, {"error":"Listing not found"})
    except errors.RaiseException as exc:
        db.rollback()

        message = str(exc) # `message` takes on raw database error text

        if "Listing" in message and "does not exist" in message:
            return send_json(handler, 404, {"error":"Listing not found"})

        if "Users cannot claim their own listings" in message:
            return send_json(handler, 403, {
                "error": "You cannot claim your own listing."
            })

        if "Only recipient organizations can claim offer listings" in message:
            return send_json(handler, 403, {"error": "Only recipient organizations can claim offer listings."})

        if "Only food providers can claim request listings" in message:
            return send_json(handler, 403, {"error": "Only food providers can claim request listings."})

        if "Only available listings can be claimed" in message:
            return send_json(handler, 409, {"error": "This listing is no longer available."})

        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error."})
    except Exception: # fallback catchall
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to accept listing due to a server error"})


    # reaching here means a new claim record was successfully created

    return send_json(handler, 201, {

        "claim" : { # send back the newly created claim data

            "id": claim[0],

            "listing_id" : claim[1],

            "claimant_user_id" : claim[2],

            "status" : claim[3],

            "claimed_at": claim[4].isoformat()
        }
    })


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


# start of get_offers_requests() function definition
def get_offers_requests(handler):

    """ GET endpoint handler that returns requests for providers or offers for recipients """

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


#GET endpoint that returns the current user's active listings including ones they created ones they have an active claim on
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


router.get("/api/listings/details", get_listing_details) # register a GET route so requests to "/api/listings/details" call the function get_listing_details()
router.post("/api/listings/accept", accept_listing) # register a POST route so requests to "/api/listings/accept" call the function accept_listing()
router.get("/api/listings", get_offers_requests) # register a GET route so requests to "/api/listings" return role-based offers or requests
router.get("/api/my-listings", get_my_listings) # register a GET route for the user's own active + claimed listings
