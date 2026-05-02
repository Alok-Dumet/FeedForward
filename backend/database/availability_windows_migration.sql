ALTER TABLE public.listings
    DROP CONSTRAINT IF EXISTS listings_pickup_window_check,
    DROP COLUMN IF EXISTS pickup_window_start,
    DROP COLUMN IF EXISTS pickup_window_end,
    ADD COLUMN IF NOT EXISTS availability_windows JSONB NOT NULL DEFAULT '[]'::jsonb;

DROP INDEX IF EXISTS public.listings_pickup_window_idx;

ALTER TABLE public.listings
    DROP CONSTRAINT IF EXISTS listings_availability_windows_check,
    ADD CONSTRAINT listings_availability_windows_check
        CHECK (jsonb_typeof(availability_windows) = 'array');
