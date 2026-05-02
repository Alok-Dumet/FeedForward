-- =====================================================================
-- TABLES
-- =====================================================================

-- locations: physical address with coordinates. Referenced by users and
-- listings. Kept as its own table so we can reuse a location across
-- multiple listings or users without duplicating the address text.
CREATE TABLE public.locations (
    id              BIGSERIAL PRIMARY KEY,
    latitude        NUMERIC(9, 6) NOT NULL,
    longitude       NUMERIC(9, 6) NOT NULL,
    address_text    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX locations_coordinates_idx
    ON public.locations (latitude, longitude);


-- users: application accounts. `role` decides which side of the
-- marketplace the user is on (food_provider posts offers, recipient
-- organisation posts requests).
CREATE TABLE public.users (
    id                       BIGSERIAL PRIMARY KEY,
    email                    VARCHAR(320) NOT NULL UNIQUE,
    password_hash            TEXT NOT NULL,
    role                     TEXT NOT NULL,
    organization_name        TEXT NOT NULL,
    phone_number             TEXT,
    location_id              BIGINT REFERENCES public.locations(id) ON DELETE SET NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_check
        CHECK (role IN ('food_provider', 'recipient_organization'))
);

CREATE INDEX users_role_idx        ON public.users (role);
CREATE INDEX users_location_id_idx ON public.users (location_id);


-- listings: an offer (food_provider posting surplus) or a request
-- (recipient_organization asking for food). status tracks the lifecycle
-- and is kept in sync with the active claim by sync_listing_status_from_claim().
CREATE TABLE public.listings (
    id                       BIGSERIAL PRIMARY KEY,
    creator_user_id          BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_type             TEXT NOT NULL,
    location_id              BIGINT NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    availability_windows     JSONB NOT NULL DEFAULT '[]'::jsonb,
    travel_distance_miles    INTEGER NOT NULL DEFAULT 0,
    additional_instructions  TEXT,
    status                   TEXT NOT NULL DEFAULT 'available',
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT listings_listing_type_check
        CHECK (listing_type IN ('offer', 'request')),
    CONSTRAINT listings_status_check
        CHECK (status IN ('available', 'claimed', 'completed', 'cancelled')),
    CONSTRAINT listings_travel_distance_miles_check
        CHECK (travel_distance_miles >= 0),
    CONSTRAINT listings_availability_windows_check
        CHECK (jsonb_typeof(availability_windows) = 'array')
);

CREATE INDEX listings_creator_user_id_idx ON public.listings (creator_user_id);
CREATE INDEX listings_location_id_idx     ON public.listings (location_id);
CREATE INDEX listings_type_status_idx     ON public.listings (listing_type, status);


-- listing_food_items: each listing can carry multiple food items. Stored
-- as a child table so quantity, expiration, and category live per item.
CREATE TABLE public.listing_food_items (
    id                BIGSERIAL PRIMARY KEY,
    listing_id        BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    food_name         TEXT NOT NULL,
    food_description  TEXT,
    food_category     TEXT NOT NULL,
    is_perishable     BOOLEAN NOT NULL,
    quantity          NUMERIC(10, 2) NOT NULL,
    quantity_unit     TEXT NOT NULL,
    expiration_date   DATE,
    CONSTRAINT listing_food_items_quantity_check
        CHECK (quantity > 0),
    CONSTRAINT listing_food_items_food_category_check
        CHECK (food_category IN (
            'produce', 'dairy', 'baked_goods', 'canned_goods', 'frozen',
            'prepared_meals', 'beverages', 'dry_goods', 'meat_seafood',
            'snacks', 'baby_food', 'mixed', 'other'
        ))
);

CREATE INDEX listing_food_items_listing_id_idx       ON public.listing_food_items (listing_id);
CREATE INDEX listing_food_items_category_idx         ON public.listing_food_items (food_category);
CREATE INDEX listing_food_items_perishable_idx       ON public.listing_food_items (is_perishable);
CREATE INDEX listing_food_items_expiration_date_idx  ON public.listing_food_items (expiration_date);


-- claims: when a counterparty accepts a listing. The check constraint
-- guarantees that any cancelled/completed claim has a resolved_at
-- timestamp, while pending/accepted claims do not.
CREATE TABLE public.claims (
    id                    BIGSERIAL PRIMARY KEY,
    listing_id            BIGINT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    claimant_user_id      BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status                TEXT NOT NULL,
    claimed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at           TIMESTAMPTZ,
    cancellation_reason   TEXT,
    CONSTRAINT claims_status_check
        CHECK (status IN ('pending', 'accepted', 'cancelled', 'completed')),
    CONSTRAINT claims_resolved_at_check
        CHECK (
            (status IN ('cancelled', 'completed') AND resolved_at IS NOT NULL)
            OR
            (status IN ('pending', 'accepted'))
        )
);

CREATE INDEX claims_claimant_user_id_idx ON public.claims (claimant_user_id);
CREATE INDEX claims_status_idx           ON public.claims (status);

-- A listing can only have one active (pending or accepted) claim at a time.
CREATE UNIQUE INDEX claims_one_active_claim_per_listing_idx
    ON public.claims (listing_id)
    WHERE status IN ('pending', 'accepted');


-- =====================================================================
-- TRIGGER FUNCTIONS
-- =====================================================================

-- We will reject claims that violate role / ownership rules at insert or
-- when the listing/claimant changes on update. Status transitions on the
-- claim itself are handled by sync_listing_status_from_claim.
CREATE OR REPLACE FUNCTION public.enforce_claim_business_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    listing_creator_user_id BIGINT;
    listing_kind            TEXT;
    listing_status          TEXT;
    claimant_role           TEXT;
BEGIN
    SELECT creator_user_id, listing_type, status
      INTO listing_creator_user_id, listing_kind, listing_status
      FROM public.listings
     WHERE id = NEW.listing_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing % does not exist', NEW.listing_id;
    END IF;

    SELECT role
      INTO claimant_role
      FROM public.users
     WHERE id = NEW.claimant_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % does not exist', NEW.claimant_user_id;
    END IF;

    IF NEW.claimant_user_id = listing_creator_user_id THEN
        RAISE EXCEPTION 'Users cannot claim their own listings';
    END IF;

    IF listing_kind = 'offer' AND claimant_role <> 'recipient_organization' THEN
        RAISE EXCEPTION 'Only recipient organizations can claim offer listings';
    END IF;

    IF listing_kind = 'request' AND claimant_role <> 'food_provider' THEN
        RAISE EXCEPTION 'Only food providers can claim request listings';
    END IF;

    IF TG_OP = 'INSERT' AND listing_status <> 'available' THEN
        RAISE EXCEPTION 'Only available listings can be claimed';
    END IF;

    RETURN NEW;
END;
$$;


-- We will mirror the claim's lifecycle onto the parent listing so that
-- the listings table is the single source of truth for "is this still
-- open?" queries.
CREATE OR REPLACE FUNCTION public.sync_listing_status_from_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        UPDATE public.listings
           SET status = 'claimed', updated_at = NOW()
         WHERE id = NEW.listing_id;
    ELSIF NEW.status = 'completed' THEN
        UPDATE public.listings
           SET status = 'completed', updated_at = NOW()
         WHERE id = NEW.listing_id;
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE public.listings
           SET status = 'cancelled', updated_at = NOW()
         WHERE id = NEW.listing_id;
    END IF;

    RETURN NEW;
END;
$$;


-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE TRIGGER claims_enforce_business_rules_trg
    BEFORE INSERT OR UPDATE OF listing_id, claimant_user_id
    ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_claim_business_rules();

CREATE TRIGGER claims_sync_listing_status_trg
    AFTER INSERT OR UPDATE OF status
    ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_listing_status_from_claim();
