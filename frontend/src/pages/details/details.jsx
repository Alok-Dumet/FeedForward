import { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { ListingAvailabilityEditor, ListingFoodEditor } from '../../components/listingFormFields.jsx';
import useEditableList from '../../hooks/useEditableList.js';
import { useToast } from '../../components/toast.jsx';
import { FOOD_CATEGORY_LABELS, formatAvailabilityWindows, formatNumber, summarizeFoods } from '../../utils/format.js';
import { EMPTY_AVAILABILITY_WINDOW, EMPTY_FOOD } from '../../utils/listings.js';

const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

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
  return dateFmt.format(date);
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="label-small tracking-[0.15em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || 'To be confirmed'}</dd>
    </div>
  );
}

function getEditableFood(food) {
  return {
    id: food.id,
    name: food.name,
    description: food.description,
    category: food.category,
    is_perishable: Boolean(food.is_perishable),
    quantity: food.quantity,
    quantity_unit: food.quantity_unit,
    expiration_date: food.expiration_date,
  };
}

export default function Details() {
  const { page, record } = useLoaderData();
  const { showToast } = useToast();
  const [listing, setListing] = useState(record);
  const foods = listing.foods;
  const [status, setStatus] = useState(record.status);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFoods, { updateItem: updateFood, addItem: addFood, removeItem: removeFood }] = useEditableList(record.foods.map(getEditableFood), EMPTY_FOOD);
  const [editAvailability, { updateItem: updateAvailability, addItem: addAvailability, removeItem: removeAvailability }] = useEditableList(record.availability_windows, EMPTY_AVAILABILITY_WINDOW);
  const [editAddress, setEditAddress] = useState(record.location.address_text);
  const [editDistance, setEditDistance] = useState(String(record.travel_distance_miles));
  const [editInstructions, setEditInstructions] = useState(record.additional_instructions ?? '');

  const isOffer = listing.type === 'offer';
  const isHistory = page.backTo === '/history';
  let currentUserId = null;
  if (listing.current_user) {
    currentUserId = listing.current_user.id;
  }

  let claimantUserId = null;
  if (listing.claim) {
    claimantUserId = listing.claim.claimant_user_id;
  }

  const isOwnListing = currentUserId === listing.creator_user_id;
  const isClaimedByCurrentUser = claimantUserId === currentUserId;
  const canAccept = !isHistory && status === 'available' && !isOwnListing;
  const canEdit = !isHistory && isOwnListing && status === 'available';
  const canCancel = !isHistory && isOwnListing && ['available', 'claimed'].includes(status);
  const canComplete = !isHistory && isOwnListing && status === 'claimed';
  const actionPending = isSubmittingAction;
  let historyStatusLabel = null;
  if (isHistory && ['completed', 'cancelled'].includes(status)) {
    historyStatusLabel = humanize(status);
  }

  let historyStatusClass = 'bg-red-50 text-red-700';
  if (status === 'completed') {
    historyStatusClass = 'bg-emerald-50 text-emerald-800';
  }

  let distanceLabel = "Distance we're willing to pick up";
  if (isOffer) {
    distanceLabel = "Distance we're willing to deliver";
  }

  async function handleListingAction(endpoint, message, onSuccess, body = null) {
    setIsSubmittingAction(true);

    let method = 'POST';
    if (body) {
      method = 'PATCH';
    }

    try {
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body) {
        requestOptions.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, requestOptions);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMessage = 'Unable to update this listing.';
        if (data && data.error) {
          errorMessage = data.error;
        }

        showToast(errorMessage, 'error');
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      }
      showToast(message, 'success');
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  function handleAcceptListing() {
    return handleListingAction(`/api/listings/${listing.id}/claim`, 'Claimed.', (data) => {
      setStatus('claimed');
      setListing((currentListing) => ({
        ...currentListing,
        status: 'claimed',
        claim: data && data.claim ? data.claim : currentListing.claim,
      }));
    });
  }

  async function handleSaveEdits(event) {
    event.preventDefault();
    setIsSubmittingAction(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foods: editFoods,
          availability_windows: editAvailability,
          address_text: editAddress.trim(),
          latitude: listing.location.latitude,
          longitude: listing.location.longitude,
          travel_distance_miles: Number(editDistance),
          additional_instructions: editInstructions.trim(),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMessage = 'Unable to save changes.';
        if (data && data.error) {
          errorMessage = data.error;
        }

        showToast(errorMessage, 'error');
        return;
      }

      setListing((currentListing) => {
        let updatedAt = currentListing.updated_at;
        if (data && data.listing && data.listing.updated_at) {
          updatedAt = data.listing.updated_at;
        }

        return {
          ...currentListing,
          foods: editFoods,
          availability_windows: editAvailability,
          travel_distance_miles: Number(editDistance),
          additional_instructions: editInstructions.trim(),
          updated_at: updatedAt,
          location: {
            ...currentListing.location,
            address_text: editAddress.trim(),
          },
        };
      });
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
              <p className="text-sm font-medium tracking-[0.18em] text-amber-700 uppercase">{page.sectionLabel}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{summarizeFoods(listing).title}</h1>
            </div>

            <Link to={page.backTo} className="btn-soft py-2.5">
              Back to {page.backLabel}
            </Link>
          </div>

          {!isHistory ? (
            <div className="mt-5">
              {canAccept ? (
                <button type="button" onClick={handleAcceptListing} disabled={actionPending} className="btn-primary inline-flex px-5 py-3 text-sm">
                  {actionPending ? 'Working...' : 'Accept'}
                </button>
              ) : null}
              {!isOwnListing && isClaimedByCurrentUser ? <p className="inline-flex rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800">Claimed by you</p> : null}
              {canEdit ? (
                <button type="button" onClick={() => setIsEditing((current) => !current)} className="btn-soft ml-3 px-5">
                  {isEditing ? 'Close Edit' : 'Edit'}
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  onClick={() => handleListingAction(`/api/listings/${listing.id}/status`, 'Listing cancelled.', () => setStatus('cancelled'), { status: 'cancelled' })}
                  disabled={actionPending}
                  className="ml-3 inline-flex cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel Listing
                </button>
              ) : null}
              {canComplete ? (
                <button
                  type="button"
                  onClick={() => handleListingAction(`/api/listings/${listing.id}/status`, 'Listing completed.', () => setStatus('completed'), { status: 'completed' })}
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
              <p className={`inline-flex rounded-2xl px-5 py-3 text-sm font-semibold ${historyStatusClass}`}>{historyStatusLabel}</p>
            </div>
          ) : null}
        </section>

        {isEditing ? (
          <form className="surface-glass px-6 py-5" onSubmit={handleSaveEdits}>
            <h2 className="text-lg font-semibold text-slate-900">Edit Listing</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Address
                <input type="text" required value={editAddress} onChange={(event) => setEditAddress(event.target.value)} className="form-control text-sm" />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                {distanceLabel}
                <input type="number" required min="0" step="1" value={editDistance} onChange={(event) => setEditDistance(event.target.value)} className="form-control text-sm" />
              </label>
            </div>

            <div className="mt-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Additional instructions
                <textarea rows="3" value={editInstructions} onChange={(event) => setEditInstructions(event.target.value)} className="form-control text-sm leading-6" />
              </label>
            </div>

            <ListingAvailabilityEditor
              title="Available Times"
              windows={editAvailability}
              onAdd={addAvailability}
              onUpdate={updateAvailability}
              onRemove={removeAvailability}
              sectionClassName="mt-6"
              titleClassName="text-base font-bold text-slate-900"
              gridClassName="mt-3 grid gap-3"
              itemClassName="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
            />

            <ListingFoodEditor
              foods={editFoods}
              onAdd={addFood}
              onUpdate={updateFood}
              onRemove={removeFood}
              title="Food Items"
              sectionClassName="mt-6"
              gridClassName="mt-3 grid gap-4"
              itemClassName="rounded-2xl border border-slate-200 bg-white p-4"
              removeLabel="Remove food item"
            />

            <button type="submit" disabled={actionPending} className="btn-primary mt-6 inline-flex px-5 py-3 text-sm">
              {actionPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : null}

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
      </div>
    </main>
  );
}
