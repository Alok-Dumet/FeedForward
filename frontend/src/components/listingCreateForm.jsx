import { useState } from 'react';

import { useToast } from '../hooks/useToast.js';
import { FOOD_CATEGORY_LABELS } from '../utils/foods.js';
import FormField from './formField.jsx';

const EMPTY_FOOD = {
  name: '',
  description: '',
  category: 'produce',
  is_perishable: false,
  quantity: '',
  quantity_unit: '',
  expiration_date: '',
};

const DAY_OPTIONS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

const EMPTY_AVAILABILITY_WINDOW = {
  day: 'monday',
  start_time: '09:00',
  end_time: '17:00',
};

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

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {copy.availabilityTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={addAvailabilityWindow}
            className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
          >
            Add time
          </button>
        </div>

        {availabilityWindows.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Don't worry! You can sort timing once someone accepts.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {availabilityWindows.map((window, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <FormField label="Day">
                  <select
                    required
                    value={window.day}
                    onChange={(event) =>
                      updateAvailabilityWindow(index, 'day', event.target.value)
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  >
                    {DAY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Start time">
                  <input
                    type="time"
                    required
                    value={window.start_time}
                    onChange={(event) =>
                      updateAvailabilityWindow(
                        index,
                        'start_time',
                        event.target.value
                      )
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <FormField label="End time">
                  <input
                    type="time"
                    required
                    value={window.end_time}
                    onChange={(event) =>
                      updateAvailabilityWindow(
                        index,
                        'end_time',
                        event.target.value
                      )
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeAvailabilityWindow(index)}
                    className="inline-flex h-[46px] cursor-pointer items-center rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">Food items</h3>
          <button
            type="button"
            onClick={addFood}
            className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
          >
            Add food item
          </button>
        </div>

        <div className="mt-4 grid gap-5">
          {foods.map((food, index) => (
            <section
              key={index}
              className="rounded-3xl border border-slate-200 bg-white/80 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-base font-bold text-slate-900">
                  Food item {index + 1}
                </h4>
                {foods.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeFood(index)}
                    className="inline-flex cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <FormField label="Food name">
                  <input
                    type="text"
                    required
                    placeholder={copy.foodNamePlaceholder}
                    value={food.name}
                    onChange={(event) =>
                      updateFood(index, 'name', event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <FormField label="Category">
                  <select
                    required
                    value={food.category}
                    onChange={(event) =>
                      updateFood(index, 'category', event.target.value)
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  >
                    {Object.entries(FOOD_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField label="Quantity">
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
                </FormField>

                <FormField label="Quantity unit">
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
                </FormField>

                <FormField
                  label="Expiration date"
                  hint="Leave blank if it does not expire."
                >
                  <input
                    type="date"
                    value={food.expiration_date}
                    onChange={(event) =>
                      updateFood(index, 'expiration_date', event.target.value)
                    }
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <label className="flex min-h-[4.75rem] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={food.is_perishable}
                    onChange={(event) =>
                      updateFood(index, 'is_perishable', event.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer accent-amber-700"
                  />
                  Perishable
                </label>
              </div>

              <div className="mt-5">
                <FormField label="Description (optional)">
                  <textarea
                    rows="3"
                    placeholder={copy.foodDescriptionPlaceholder}
                    value={food.description}
                    onChange={(event) =>
                      updateFood(index, 'description', event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>
              </div>
            </section>
          ))}
        </div>
      </div>

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
