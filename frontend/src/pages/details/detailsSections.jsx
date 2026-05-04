import { Link } from 'react-router-dom';

import { FOOD_CATEGORY_LABELS, formatAvailabilityWindows, formatNumber, summarizeFoods } from '../../utils/format.js';

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="label-small tracking-[0.15em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || 'To be confirmed'}</dd>
    </div>
  );
}

export function DetailsHeader({ page, listing }) {
  return (
    <section className="surface-glass px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-amber-700 uppercase">{page.sectionLabel}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{summarizeFoods(listing).title}</h1>
        </div>

        <Link to={page.backTo} className="btn-soft py-2.5">
          Back to {page.backLabel}
        </Link>
      </div>
    </section>
  );
}

export function FoodDetailsSection({ foods, formatDate }) {
  return (
    <section className="surface-glass px-6 py-5">
      <h2 className="text-lg font-semibold text-slate-900">Food Details</h2>
      <div className="mt-4 grid gap-4">
        {foods.map((food) => (
          <article key={food.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <h3 className="text-base font-semibold text-slate-900">{food.name}</h3>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField label="Quantity" value={`${formatNumber(food.quantity)} ${food.quantity_unit}`} />
              <DetailField label="Category" value={FOOD_CATEGORY_LABELS[food.category]} />
              <DetailField label="Handling" value={food.is_perishable ? 'Perishable' : 'Shelf-stable'} />
              <DetailField label="Expiration Date" value={food.expiration_date ? formatDate(food.expiration_date) : 'Does Not Expire'} />
            </dl>

            {food.description ? (
              <div className="mt-5 rounded-2xl bg-white px-4 py-3">
                <p className="label-small tracking-[0.15em] text-slate-500">Description</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{food.description}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function PickupDetailsSection({ listing, distanceLabel }) {
  return (
    <section className="surface-glass px-6 py-5">
      <h2 className="text-lg font-semibold text-slate-900">Pickup and Coordination</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailField label="Available Times" value={formatAvailabilityWindows(listing.availability_windows)} />
        <DetailField label="Address" value={listing.location.address_text} />
        <DetailField label={distanceLabel} value={`${formatNumber(listing.travel_distance_miles)} miles`} />
      </dl>

      {listing.additional_instructions ? (
        <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3">
          <p className="label-small tracking-[0.15em] text-slate-500">Instructions</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{listing.additional_instructions}</p>
        </div>
      ) : null}
    </section>
  );
}

export function ListingInfoSection({ listing, status, isOffer, humanize, formatDate }) {
  return (
    <section className="surface-glass px-6 py-5">
      <h2 className="text-lg font-semibold text-slate-900">Listing Information</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailField label={isOffer ? 'Provider Organization' : 'Requesting Organization'} value={listing.creator.organization_name} />
        <DetailField label="Contact Email" value={listing.creator.email} />
        <DetailField label="Status" value={humanize(status)} />
        <DetailField label="Created" value={formatDate(listing.created_at)} />
        <DetailField label="Last Updated" value={formatDate(listing.updated_at)} />
      </dl>
    </section>
  );
}
