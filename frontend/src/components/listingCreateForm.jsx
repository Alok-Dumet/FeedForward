import { useState } from 'react';

import useEditableList from '../hooks/useEditableList.js';
import { useToast } from './toast.jsx';
import { apiRequest } from '../utils/api.js';
import { EMPTY_AVAILABILITY_WINDOW, EMPTY_FOOD } from '../utils/listings.js';
import FormField from './formField.jsx';
import { ListingAvailabilityEditor, ListingFoodEditor } from './listingFormFields.jsx';

const LISTING_COPY = {
  offer: {
    heading: 'Offer details',
    formLabel: 'Offer Form',
    publishLabel: 'Publish offer',
    successLabel: 'Offer published.',
    locationUnavailableMessage: 'Your account needs a valid location before you can publish an offer.',
    travelDistanceLabel: "Distance we're willing to deliver",
    foodNamePlaceholder: 'Example: Hawaiian Pizza',
    foodDescriptionPlaceholder: 'Example: Thin crust, pineapple, onions, olives, stuffed crust',
    additionalInstructionsPlaceholder: 'Example: Please enter through the second door on the left side of the building',
    availabilityTitle: 'Times people can pick up food (Optional)',
  },
  request: {
    heading: 'Request details',
    formLabel: 'Request Form',
    publishLabel: 'Publish request',
    successLabel: 'Request published.',
    locationUnavailableMessage: 'Your account needs a valid location before you can publish a request.',
    travelDistanceLabel: "Distance we're willing to pick up",
    foodNamePlaceholder: 'Example: Canned vegetables',
    foodDescriptionPlaceholder: 'Example: Shelf-stable items, low-sodium options preferred, family-size packages welcome',
    additionalInstructionsPlaceholder: 'Example: Please bring donations to the front desk during pantry intake hours',
    availabilityTitle: 'Times people can drop off food (Optional)',
  },
};

//We will remove extra spaces from food fields before sending them to the backend
function getTrimmedFood(food) {
  return {
    name: food.name.trim(),
    description: food.description.trim(),
    category: food.category,
    is_perishable: food.is_perishable,
    quantity: food.quantity,
    quantity_unit: food.quantity_unit.trim(),
    expiration_date: food.expiration_date,
  };
}

export default function ListingCreateForm({ listingType, user }) {
  const copy = LISTING_COPY[listingType];
  const [foods, { updateItem: updateFood, addItem: addFood, removeItem: removeFood }] = useEditableList([{ ...EMPTY_FOOD }], EMPTY_FOOD);
  const [availabilityWindows, { updateItem: updateAvailabilityWindow, addItem: addAvailabilityWindow, removeItem: removeAvailabilityWindow }] = useEditableList([], EMPTY_AVAILABILITY_WINDOW);
  const [travelDistanceMiles, setTravelDistanceMiles] = useState('150');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const hasAccountLocation = user.address_text && user.latitude && user.longitude;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasAccountLocation) {
      showToast(copy.locationUnavailableMessage, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('/api/listings', {
        method: 'POST',
        body: {
          type: listingType,
          foods: foods.map(getTrimmedFood),
          availability_windows: availabilityWindows,
          travel_distance_miles: Number(travelDistanceMiles),
          additional_instructions: additionalInstructions.trim(),
        },
        errorMessage: 'Unable to publish listing.',
        networkErrorMessage: 'Network error. Please try again.',
      });

      showToast(copy.successLabel, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="surface-glass p-6" onSubmit={handleSubmit}>
      <p className="label-small tracking-[0.18em] text-amber-700">{copy.formLabel}</p>
      <h2 className="mt-3 text-2xl font-bold text-slate-900">{copy.heading}</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FormField label="Listing address">
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{user.address_text ?? 'Account location unavailable'}</p>
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
            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">miles</span>
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
            className="form-control text-sm leading-6"
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
        <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm disabled:bg-slate-500">
          {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
          {isSubmitting ? 'Publishing...' : copy.publishLabel}
        </button>
      </div>
    </form>
  );
}
