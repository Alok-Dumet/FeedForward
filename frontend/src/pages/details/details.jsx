import { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { useToast } from '../../hooks/useToast.js';
import { formatAvailabilityWindows } from '../../utils/formatDates.js';
import {
  formatFoodCategory,
  formatFoodQuantity,
  formatNumber,
  getFoodTitle,
} from '../../utils/foods.js';

const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const FOOD_CATEGORIES = [
  ['produce', 'Produce'],
  ['dairy', 'Dairy'],
  ['baked_goods', 'Baked Goods'],
  ['canned_goods', 'Canned Goods'],
  ['frozen', 'Frozen'],
  ['prepared_meals', 'Prepared Meals'],
  ['beverages', 'Beverages'],
  ['dry_goods', 'Dry Goods'],
  ['meat_seafood', 'Meat & Seafood'],
  ['snacks', 'Snacks'],
  ['baby_food', 'Baby Food'],
  ['mixed', 'Mixed'],
  ['other', 'Other'],
];
const DAY_OPTIONS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];
const EMPTY_FOOD = {
  name: '',
  description: '',
  category: 'produce',
  is_perishable: false,
  quantity: '',
  quantity_unit: '',
  expiration_date: '',
};
const EMPTY_AVAILABILITY = {
  day: 'monday',
  start_time: '09:00',
  end_time: '17:00',
};

function humanize(value) {
  if (!value) {
    return 'To be confirmed';
  }

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) {
    return 'To be confirmed';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFmt.format(date);
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">
        {value || 'To be confirmed'}
      </dd>
    </div>
  );
}

function getEditableFood(food) {
  return {
    id: food.id,
    name: food.name ?? '',
    description: food.description ?? '',
    category: food.category ?? 'produce',
    is_perishable: Boolean(food.is_perishable),
    quantity: food.quantity ?? '',
    quantity_unit: food.quantity_unit ?? '',
    expiration_date: food.expiration_date ?? '',
  };
}

export default function Details() {
  const { page, record } = useLoaderData();
  const { showToast } = useToast();
  const [listing, setListing] = useState(record);
  const foods = listing.foods ?? [];
  const [status, setStatus] = useState(record.status);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [acceptedThisSession, setAcceptedThisSession] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFoods, setEditFoods] = useState(
    (record.foods ?? []).map(getEditableFood)
  );
  const [editAvailability, setEditAvailability] = useState(
    record.availability_windows ?? []
  );
  const [editAddress, setEditAddress] = useState(
    record.location?.address_text ?? ''
  );
  const [editDistance, setEditDistance] = useState(
    String(record.travel_distance_miles ?? 0)
  );
  const [editInstructions, setEditInstructions] = useState(
    record.additional_instructions ?? ''
  );

  const isOffer = listing.type === 'offer';
  const isHistory = page.backTo === '/history';
  const isOwnListing = listing.current_user?.id === listing.creator_user_id;
  const isClaimedByCurrentUser =
    acceptedThisSession ||
    listing.claim?.claimant_user_id === listing.current_user?.id;
  const canAccept = !isHistory && status === 'available' && !isOwnListing;
  const canEdit = !isHistory && isOwnListing && status === 'available';
  const canCancel =
    !isHistory && isOwnListing && ['available', 'claimed'].includes(status);
  const canComplete = !isHistory && isOwnListing && status === 'claimed';
  const actionPending = isSubmittingAction;
  const historyStatusLabel =
    isHistory && ['completed', 'cancelled'].includes(status)
      ? humanize(status)
      : null;
  const historyStatusClass =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-800'
      : 'bg-red-50 text-red-700';
  const distanceLabel = isOffer
    ? "Distance we're willing to deliver"
    : "Distance we're willing to pick up";

  async function handleAcceptListing() {
    setIsSubmittingAction(true);

    try {
      const res = await fetch('/api/listings/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listing.id,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(data?.error ?? 'Unable to update this listing.', 'error');
        return;
      }

      setStatus('claimed');
      setAcceptedThisSession(true);
      showToast('Claimed.', 'success');
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleListingAction(endpoint, nextStatus, message) {
    setIsSubmittingAction(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing_id: listing.id }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(data?.error ?? 'Unable to update this listing.', 'error');
        return;
      }

      setStatus(nextStatus);
      showToast(message, 'success');
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  function updateFood(index, field, value) {
    setEditFoods((currentFoods) =>
      currentFoods.map((food, foodIndex) =>
        foodIndex === index ? { ...food, [field]: value } : food
      )
    );
  }

  function updateAvailability(index, field, value) {
    setEditAvailability((currentAvailability) =>
      currentAvailability.map((availability, availabilityIndex) =>
        availabilityIndex === index
          ? { ...availability, [field]: value }
          : availability
      )
    );
  }

  async function handleSaveEdits(event) {
    event.preventDefault();
    setIsSubmittingAction(true);

    try {
      const res = await fetch('/api/listings/edit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listing.id,
          foods: editFoods,
          availability_windows: editAvailability,
          address_text: editAddress.trim(),
          latitude: listing.location?.latitude,
          longitude: listing.location?.longitude,
          travel_distance_miles: Number(editDistance),
          additional_instructions: editInstructions.trim(),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(data?.error ?? 'Unable to save changes.', 'error');
        return;
      }

      setListing((currentListing) => ({
        ...currentListing,
        foods: editFoods,
        availability_windows: editAvailability,
        travel_distance_miles: Number(editDistance),
        additional_instructions: editInstructions.trim(),
        updated_at: data?.listing?.updated_at ?? currentListing.updated_at,
        location: {
          ...currentListing.location,
          address_text: editAddress.trim(),
        },
      }));
      setIsEditing(false);
      showToast('Changes saved.', 'success');
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="surface-glass px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-amber-700 uppercase">
                {page.sectionLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {getFoodTitle(listing)}
              </h1>
            </div>

            <Link to={page.backTo} className="btn-soft py-2.5">
              Back to {page.backLabel}
            </Link>
          </div>

          {!isHistory ? (
            <div className="mt-5">
              {canAccept ? (
                <button
                  type="button"
                  onClick={handleAcceptListing}
                  disabled={actionPending}
                  className="inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {actionPending ? 'Working...' : 'Accept'}
                </button>
              ) : null}
              {!isOwnListing && isClaimedByCurrentUser ? (
                <p className="inline-flex rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">
                  Claimed by you
                </p>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsEditing((current) => !current)}
                  className="btn-soft ml-3 px-5"
                >
                  {isEditing ? 'Close Edit' : 'Edit'}
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  onClick={() =>
                    handleListingAction(
                      '/api/listings/cancel',
                      'cancelled',
                      'Listing cancelled.'
                    )
                  }
                  disabled={actionPending}
                  className="ml-3 inline-flex cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel Listing
                </button>
              ) : null}
              {canComplete ? (
                <button
                  type="button"
                  onClick={() =>
                    handleListingAction(
                      '/api/listings/complete',
                      'completed',
                      'Listing completed.'
                    )
                  }
                  disabled={actionPending}
                  className="ml-3 inline-flex cursor-pointer rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Complete
                </button>
              ) : null}
            </div>
          ) : null}
          {historyStatusLabel ? (
            <div className="mt-5">
              <p
                className={`inline-flex rounded-2xl px-5 py-3 text-sm font-semibold ${historyStatusClass}`}
              >
                {historyStatusLabel}
              </p>
            </div>
          ) : null}
        </section>

        {isEditing ? (
          <form className="surface-glass px-6 py-5" onSubmit={handleSaveEdits}>
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Listing
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Address
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(event) => setEditAddress(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {distanceLabel}
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={editDistance}
                  onChange={(event) => setEditDistance(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </label>
            </div>

            <div className="mt-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Additional instructions
                <textarea
                  rows="3"
                  value={editInstructions}
                  onChange={(event) => setEditInstructions(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </label>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  Available Times
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setEditAvailability((current) => [
                      ...current,
                      EMPTY_AVAILABILITY,
                    ])
                  }
                  className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  Add time
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                {editAvailability.map((availability, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <select
                      value={availability.day}
                      onChange={(event) =>
                        updateAvailability(index, 'day', event.target.value)
                      }
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                    >
                      {DAY_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      required
                      value={availability.start_time}
                      onChange={(event) =>
                        updateAvailability(
                          index,
                          'start_time',
                          event.target.value
                        )
                      }
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                    />
                    <input
                      type="time"
                      required
                      value={availability.end_time}
                      onChange={(event) =>
                        updateAvailability(
                          index,
                          'end_time',
                          event.target.value
                        )
                      }
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditAvailability((current) =>
                          current.filter(
                            (_, availabilityIndex) =>
                              availabilityIndex !== index
                          )
                        )
                      }
                      className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  Food Items
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setEditFoods((current) => [...current, EMPTY_FOOD])
                  }
                  className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  Add food item
                </button>
              </div>

              <div className="mt-3 grid gap-4">
                {editFoods.map((food, index) => (
                  <section
                    key={`${food.id ?? 'new'}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Example: Hawaiian Pizza"
                        value={food.name}
                        onChange={(event) =>
                          updateFood(index, 'name', event.target.value)
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                      />
                      <select
                        value={food.category}
                        onChange={(event) =>
                          updateFood(index, 'category', event.target.value)
                        }
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                      >
                        {FOOD_CATEGORIES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={food.quantity}
                        onChange={(event) =>
                          updateFood(index, 'quantity', event.target.value)
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Example: Boxes, pounds, trays, servings"
                        value={food.quantity_unit}
                        onChange={(event) =>
                          updateFood(index, 'quantity_unit', event.target.value)
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                      />
                      <input
                        type="date"
                        value={food.expiration_date}
                        onChange={(event) =>
                          updateFood(
                            index,
                            'expiration_date',
                            event.target.value
                          )
                        }
                        className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                      />
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={food.is_perishable}
                          onChange={(event) =>
                            updateFood(
                              index,
                              'is_perishable',
                              event.target.checked
                            )
                          }
                          className="h-4 w-4 cursor-pointer accent-amber-700"
                        />
                        Perishable
                      </label>
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Example: Thin crust, pineapple, onions, olives, stuffed crust"
                      value={food.description}
                      onChange={(event) =>
                        updateFood(index, 'description', event.target.value)
                      }
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                    />
                    {editFoods.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFoods((current) =>
                            current.filter(
                              (_, foodIndex) => foodIndex !== index
                            )
                          )
                        }
                        className="mt-3 inline-flex cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      >
                        Remove food item
                      </button>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={actionPending}
              className="mt-6 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {actionPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : null}

        <section className="surface-glass px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Food Details</h2>
          <div className="mt-4 grid gap-4">
            {foods.map((food) => (
              <article
                key={food.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {food.name}
                </h3>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailField
                    label="Quantity"
                    value={formatFoodQuantity(food)}
                  />
                  <DetailField
                    label="Category"
                    value={formatFoodCategory(food.category)}
                  />
                  <DetailField
                    label="Handling"
                    value={food.is_perishable ? 'Perishable' : 'Shelf-stable'}
                  />
                  <DetailField
                    label="Expiration Date"
                    value={
                      food.expiration_date
                        ? formatDate(food.expiration_date)
                        : 'Does Not Expire'
                    }
                  />
                </dl>

                {food.description ? (
                  <div className="mt-5 rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                      Description
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {food.description}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="surface-glass px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Pickup and Coordination
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField
              label="Available Times"
              value={formatAvailabilityWindows(listing.availability_windows)}
            />
            <DetailField
              label="Address"
              value={listing.location?.address_text}
            />
            <DetailField
              label={distanceLabel}
              value={`${formatNumber(listing.travel_distance_miles ?? 0)} miles`}
            />
          </dl>

          {listing.additional_instructions ? (
            <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Instructions
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {listing.additional_instructions}
              </p>
            </div>
          ) : null}
        </section>

        <section className="surface-glass px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Listing Information
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField
              label={
                isOffer ? 'Provider Organization' : 'Requesting Organization'
              }
              value={listing.creator?.organization_name}
            />
            <DetailField label="Contact Email" value={listing.creator?.email} />
            <DetailField label="Status" value={humanize(status)} />
            <DetailField
              label="Created"
              value={formatDate(listing.created_at)}
            />
            <DetailField
              label="Last Updated"
              value={formatDate(listing.updated_at)}
            />
          </dl>
        </section>
      </div>
    </main>
  );
}
