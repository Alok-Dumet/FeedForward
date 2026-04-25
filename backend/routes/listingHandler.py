from database.database import db
from router import Router
from sessions import get_user
from utils import parse_validate_body, send_json, get_query_param
from psycopg2 import errors


router = Router()


"""

define three API endpoints

 .../listings/details

 .../listings/accept

 .../listings

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
                    listings.discard_deadline,  -- the deadline before the food must be discarded
                    listings.travel_distance_miles,  -- how far someone may need to travel for pickup
                    listings.additional_instructions,  -- any extra notes or instructions attached to the listing
                    listings.status,  -- current status of the listing
                    listings.created_at,  -- timestamp when the listing was created
                    listings.updated_at,  -- timestamp when the listing was last updated

                    locations.address_text,  -- human-readable address for the pickup location
                    locations.latitude,  -- latitude coordinate of the location
                    locations.longitude,  -- longitude coordinate of the location

                    listing_food_items.food_name,  -- name of the food item associated with the listing
                    listing_food_items.food_description,  -- description of that food item
                    listing_food_items.food_category,  -- category/classification of the food item
                    listing_food_items.is_perishable,  -- whether the food is perishable
                    listing_food_items.quantity,  -- how much food is available
                    listing_food_items.quantity_unit,  -- unit for the quantity, such as lbs, boxes, meals, etc.
                    listing_food_items.expiration_date,  -- expiration date for the food item if present

                    creator.organization_name,  -- organization name of the listing creator

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

            row = cur.fetchone() # read the first matching row from the query result

        # end of database cursor

    except Exception:

        # reaching here means an error occured

        db.rollback()
        return send_json(handler, 500, {"error":"Unable to load listing details"})

    
    if row is None:
        return send_json(handler, 404, {"error":"listing not found"})


    # reaching here means listing details successfully loaded


    return send_json(handler, 200, { # send back assembled listing record

           "record": {  # top-level payload key containing the listing details
                        "id": row[0],  # map selected column 0 to record.id
                        "creator_user_id": row[1],  # map selected column 1 to the creator's user id
                        "type": row[2],  # map selected column 2 to the listing type
                        "pickup_window_start": row[3].isoformat(),  # convert pickup_window_start datetime into an ISO string for JSON
                        "pickup_window_end": row[4].isoformat(),  # convert pickup_window_end datetime into an ISO string for JSON
                        "discard_deadline": row[5].isoformat() if row[5] else None,  # convert discard_deadline if it exists, otherwise return null
                        "travel_distance_miles": row[6],  # include the travel distance value directly
                        "additional_instructions": row[7],  # include any extra instructions directly
                        "status": row[8],  # include the listing status directly
                        "created_at": row[9].isoformat(),  # convert created_at datetime into an ISO string
                        "updated_at": row[10].isoformat(),  # convert updated_at datetime into an ISO string
                        
                        "location": {  # nested object for location-related fields
                            "address_text": row[11],  # human-readable address
                            "latitude": str(row[12]),  # convert latitude to string before sending JSON
                            "longitude": str(row[13]),  # convert longitude to string before sending JSON
                        },  # end of nested location object

                        "food": {  # nested object for food-item-related fields
                            "name": row[14],  # food item name
                            "description": row[15],  # food item description
                            "category": row[16],  # food item category
                            "is_perishable": row[17],  # boolean telling whether the food is perishable
                            "quantity": str(row[18]),  # convert quantity to string before sending JSON
                            "quantity_unit": row[19],  # unit associated with quantity
                            "expiration_date": row[20].isoformat() if row[20] else None,  # convert expiration date if it exists, else null
                        },  # end of nested food object

                        "creator": {  # nested object for the creator's basic info
                            "organization_name": row[21],  # include the creator organization's name
                        },  # end of nested creator object

                        "claim": {  # build a nested claim object if there is an active claim row
                            "id": row[22],  # claim id
                            "claimant_user_id": row[23],  # id of the claimant user
                            "status": row[24],  # claim status
                            "claimed_at": row[25].isoformat() if row[25] else None,  # convert claimed_at if present
                            "resolved_at": row[26].isoformat() if row[26] else None,  # convert resolved_at if present
                        } if row[22] else None,  # if there is no claim id, send claim as null instead of an object

                        "current_user": {  # include basic info about the currently authenticated user
                            "id": user["id"],  # current user's id from the session
                            "role": user["role"],  # current user's role from the session
                        },  # end of nested current_user object

            }  # end of record object
    })
# end of get_listing_details() function definition





def accept_listing(handler): # start of accept_listing() function definition

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

# end of accept_listing() function definition




def build_offers_requests_record(row): # helper function that formats one listing row for the offers/requests route

    return {
        "id": row[0],
        "creator_user_id": row[1],
        "listing_type": row[2],
        "pickup_window_start": row[3].isoformat(),
        "pickup_window_end": row[4].isoformat(),
        "discard_deadline": row[5].isoformat() if row[5] else None,
        "travel_distance_miles": row[6],
        "additional_instructions": row[7],
        "status": row[8],
        "created_at": row[9].isoformat(),
        "updated_at": row[10].isoformat(),
        "location": {
            "address_text": row[11],
            "latitude": str(row[12]),
            "longitude": str(row[13]),
        },
        "food": {
            "name": row[14],
            "description": row[15],
            "category": row[16],
            "is_perishable": row[17],
            "quantity": str(row[18]),
            "quantity_unit": row[19],
            "expiration_date": row[20].isoformat() if row[20] else None,
        },
        "creator": {
            "organization_name": row[21],
        },
    }



def get_offers_requests(handler): # start of get_offers_requests() function definition

    """ GET endpoint handler that returns requests for providers or offers for recipients """

    user = get_user(handler)
    user_role = user["role"]

    if user_role == "food_provider":
        target_listing_type = "request"
        view_mode = "requests"
    elif user_role == "recipient_organization":
        target_listing_type = "offer"
        view_mode = "offers"
    else:
        return send_json(handler, 403, {"error": "This role is not allowed to view offers or requests."})

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
                    listings.discard_deadline,
                    listings.travel_distance_miles,
                    listings.additional_instructions,
                    listings.status,
                    listings.created_at,
                    listings.updated_at,
                    locations.address_text,
                    locations.latitude,
                    locations.longitude,
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
    except Exception:
        db.rollback()
        return send_json(handler, 500, {"error": "Unable to load offers or requests."})

    records = [build_offers_requests_record(row) for row in rows]

    return send_json(handler, 200, {
        "view_mode": view_mode,
        "records": records,
        "current_user": {
            "id": user["id"],
            "role": user_role,
            "organization_name": user["organization_name"],
        },
    })

# end of get_offers_requests() function definition
    



router.get("/api/listings/details", get_listing_details) # register a GET route so requests to "/api/listings/details" call the function get_listing_details()
router.post("/api/listings/accept", accept_listing) # register a POST route so requests to "/api/listings/accept" call the function accept_listing()
router.get("/api/listings", get_offers_requests) # register a GET route so requests to "/api/listings" return role-based offers or requests
