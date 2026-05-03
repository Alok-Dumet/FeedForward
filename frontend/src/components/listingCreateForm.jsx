import { useState } from 'react';

import { useToast } from '../hooks/useToast.js';
import {
  EMPTY_AVAILABILITY_WINDOW,
  EMPTY_FOOD,
  getTrimmedFood,
} from '../utils/listingFormData.js';
import FormField from './formField.jsx';
import {
  ListingAvailabilityEditor,
  ListingFoodEditor,
} from './listingFormFields.jsx';

const LISTING_COPY = {
  offer: {
    heading: 'Offer details',
    formLabel: 'Offer Form',
    endpoint: '/api/listings/offers/create',
    publishLabel: 'Publish offer',
    successLabel: 'Offer published.',
    locationUnavailableMessage:
      'Your account needs a valid location before you can publish an offer.',
    travelDistanceLabel: "Distance we're willing to deliver",
    foodNamePlaceholder: 'Example: Hawaiian Pizza',
    foodDescriptionPlaceholder:
      'Example: Thin crust, pineapple, onions, olives, stuffed crust',
    additionalInstructionsPlaceholder:
      'Example: Please enter through the second door on the left side of the building',
    availabilityTitle: 'Times people can pick up food (Optional)',
  },
  request: {
    heading: 'Request details',
    formLabel: 'Request Form',
    endpoint: '/api/listings/requests/create',
    publishLabel: 'Publish request',
    successLabel: 'Request published.',
    locationUnavailableMessage:
      'Your account needs a valid location before you can publish a request.',
    travelDistanceLabel: "Distance we're willing to pick up",
    foodNamePlaceholder: 'Example: Canned vegetables',
    foodDescriptionPlaceholder:
      'Example: Shelf-stable items, low-sodium options preferred, family-size packages welcome',
    additionalInstructionsPlaceholder:
      'Example: Please bring donations to the front desk during pantry intake hours',
    availabilityTitle: 'Times people can drop off food (Optional)',
  },
};

export default function ListingCreateForm({ listingType, user }) {
  const copy = LISTING_COPY[listingType];
  const [foods, setFoods] = useState([{ ...EMPTY_FOOD }]);
  const [availabilityWindows, setAvailabilityWindows] = useState([]);
  const [locationAddress, setLocationAddress] = useState(
    user.address_text ?? ''
  );
  const [travelDistanceMiles, setTravelDistanceMiles] = useState('150');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const hasLocationCoordinates = user.latitude && user.longitude;

  function updateFood(index, field, value) {
    setFoods((currentFoods) =>
      currentFoods.map((food, foodIndex) =>
        foodIndex === index ? { ...food, [field]: value } : food
      )
    );
  }

  function addFood() {
    setFoods((currentFoods) => [...currentFoods, { ...EMPTY_FOOD }]);
  }

  function removeFood(index) {
    setFoods((currentFoods) =>
      currentFoods.filter((_, foodIndex) => foodIndex !== index)
    );
  }

  function updateAvailabilityWindow(index, field, value) {
    setAvailabilityWindows((currentWindows) =>
      currentWindows.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: value } : window
      )
    );
  }

  function addAvailabilityWindow() {
    setAvailabilityWindows((currentWindows) => [
      ...currentWindows,
      { ...EMPTY_AVAILABILITY_WINDOW },
    ]);
  }

  function removeAvailabilityWindow(index) {
    setAvailabilityWindows((currentWindows) =>
      currentWindows.filter((_, windowIndex) => windowIndex !== index)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasLocationCoordinates) {
      showToast(copy.locationUnavailableMessage, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(copy.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foods: foods.map(getTrimmedFood),
          availability_windows: availabilityWindows,
          address_text: locationAddress.trim(),
          latitude: user.latitude,
          longitude: user.longitude,
          travel_distance_miles: Number(travelDistanceMiles),
          additional_instructions: additionalInstructions.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        showToast(data?.error ?? 'Unable to publish listing.', 'error');
        return;
      }

      showToast(copy.successLabel, 'success');
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="surface-glass p-6" onSubmit={handleSubmit}>
      <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
        {copy.formLabel}
      </p>
      <h2 className="mt-3 text-2xl font-bold text-slate-900">{copy.heading}</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FormField label="Listing address">
          <input
            type="text"
            required
            value={locationAddress}
            onChange={(event) => setLocationAddress(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
          />
        </FormField>

        <FormField label={copy.travelDistanceLabel}>
          <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-amber-300">
            <input
              type="number"
              required
              min="0"
              step="1"
              value={travelDistanceMiles}
              onChange={(event) => setTravelDistanceMiles(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
            />
            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
              miles
            </span>
          </div>
        </FormField>
      </div>

      <ListingAvailabilityEditor
        title={copy.availabilityTitle}
        windows={availabilityWindows}
        onAdd={addAvailabilityWindow}
        onUpdate={updateAvailabilityWindow}
        onRemove={removeAvailabilityWindow}
        emptyMessage="Don't worry! You can sort timing once someone accepts."
      />

      <div className="mt-6">
        <FormField label="Additional instructions (optional)">
          <textarea
            rows="4"
            placeholder={copy.additionalInstructionsPlaceholder}
            value={additionalInstructions}
            onChange={(event) => setAdditionalInstructions(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
          />
        </FormField>
      </div>

      <ListingFoodEditor
        foods={foods}
        onAdd={addFood}
        onUpdate={updateFood}
        onRemove={removeFood}
        foodNamePlaceholder={copy.foodNamePlaceholder}
        foodDescriptionPlaceholder={copy.foodDescriptionPlaceholder}
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {isSubmitting ? 'Publishing...' : copy.publishLabel}
        </button>
      </div>
    </form>
  );
}
