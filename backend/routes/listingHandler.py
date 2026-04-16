from urllib.parse import urlparse, parse_qs

from database.database import db
from router import Router
from sessions import get_user
from utils import parse_validate_body, send_json

router = Router()


"""

define two API endpoints

 .../listings/details

 .../listings/accept


"""


def get_query_param(handler, name):

    """ extracts one query parameter from the request URL """

    query = urlparse(handler.path).query # take the request path, parse it as a URL and pull out only the query-string portion
    values = parse_qs(query).get(name) # parse the query string into a dictionary and get the list of values for the requested parameter names

    if not values: # check whether the parameter was missing or had no values
        return None # let the call know value was absent

    return values[0] # return the first value for that parameter since query params come back as lists




def get_listing_details(handler): # start of get_listing_details() function definition


    """ GET endpoint handler that returns the full details for one listing """

    listing_id = get_query_param(handler, "id")
    if not listing_id:
        return send_json(handler, 401, {"error": "missing listing id"})
    
    # reaching here means listing id is present


    try: # start of try-block so any database / runtime error can be caught and returned cleanly


        user = get_user(handler)
        if user is None:
            return send_json(handler, 400, {"error": "Not authenticated"})

        # reaching here means user is present

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

    except Exception as exc:

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

    
    try: # start of try-block so DB errors can be caught and returned cleanly

        user = get_user(handler)  # get the currently authenticated user from the session/request

        if user is None:
            return send_json(handler, 401, {"error": "User is not authenticated"})

        
        # reaching here means `user` is authenticated

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
                    body["listing_id"], # first SQL parameter: the listing id from the request body
                    user["id"] # second SQL parameter: the current authenticated user's id
                )
            ) # end of execute an INSERT that creates a new claim row for this listing

            claim = cur.fetchone() # read the inserted row that was returned by RETURNING

        # end of database cursor
        

        db.commit() # lock-in the transaction so the new claim is saved

    except Exception as exc:

        # reaching here means an error occurred for the insertion transaction

        db.rollback()
        return send_json(handler, 400, {"error": str(exc)})



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
    







router.get("/api/listings/details", get_listing_details) # register a GET route so requests to "/api/listings/details" call the function get_listing_details()
router.post("/api/listings/accept", accept_listing) # register a POST route so requests to "/api/listings/accept" call the function accept_listing()

