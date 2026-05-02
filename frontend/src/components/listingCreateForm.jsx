import { useState } from "react";

import FormField from "./formField.jsx";

const FOOD_CATEGORIES = [
  ["produce", "Produce"],
  ["dairy", "Dairy"],
  ["baked_goods", "Baked Goods"],
  ["canned_goods", "Canned Goods"],
  ["frozen", "Frozen"],
  ["prepared_meals", "Prepared Meals"],
  ["beverages", "Beverages"],
  ["dry_goods", "Dry Goods"],
  ["meat_seafood", "Meat & Seafood"],
  ["snacks", "Snacks"],
  ["baby_food", "Baby Food"],
  ["mixed", "Mixed"],
  ["other", "Other"],
];

const EMPTY_FOOD = {
  name: "",
  description: "",
  category: "produce",
  is_perishable: false,
  quantity: "",
  quantity_unit: "",
  expiration_date: "",
};

function toIsoDatetime(value) {
  return new Date(value).toISOString();
}

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

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function ListingCreateForm({
  additionalInstructionsPlaceholder,
  endpoint,
  foodDescriptionPlaceholder,
  foodNamePlaceholder,
  formLabel,
  locationUnavailableMessage,
  publishLabel,
  successLabel,
  travelDistanceLabel,
  user,
  windowEndLabel,
  windowStartLabel,
}) {
  const [foods, setFoods] = useState([{ ...EMPTY_FOOD }]);
  const [locationAddress, setLocationAddress] = useState(user.address_text ?? "");
  const [pickupWindowStart, setPickupWindowStart] = useState("");
  const [pickupWindowEnd, setPickupWindowEnd] = useState("");
  const [travelDistanceMiles, setTravelDistanceMiles] = useState("150");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setFoods((currentFoods) => currentFoods.filter((_, foodIndex) => foodIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasLocationCoordinates) {
      setError(locationUnavailableMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foods: foods.map(getTrimmedFood),
          pickup_window_start: toIsoDatetime(pickupWindowStart),
          pickup_window_end: toIsoDatetime(pickupWindowEnd),
          address_text: locationAddress.trim(),
          latitude: user.latitude,
          longitude: user.longitude,
          travel_distance_miles: Number(travelDistanceMiles),
          additional_instructions: additionalInstructions.trim(),
        }),
      });

      const data = await readJson(res);

      if (!res.ok) {
        setError(data?.error ?? "Unable to publish listing.");
        return;
      }

      setSuccess(successLabel);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md"
      onSubmit={handleSubmit}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
        {formLabel}
      </p>
      <h2 className="mt-3 text-2xl font-bold text-slate-900">
        Listing details
      </h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FormField label={windowStartLabel}>
          <input
            type="datetime-local"
            required
            value={pickupWindowStart}
            onChange={(event) => setPickupWindowStart(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
          />
        </FormField>

        <FormField label={windowEndLabel}>
          <input
            type="datetime-local"
            required
            value={pickupWindowEnd}
            onChange={(event) => setPickupWindowEnd(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
          />
        </FormField>

        <FormField label="Listing address">
          <input
            type="text"
            required
            value={locationAddress}
            onChange={(event) => setLocationAddress(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
          />
        </FormField>

        <FormField label={travelDistanceLabel}>
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

      <div className="mt-6">
        <FormField label="Additional instructions (optional)">
          <textarea
            rows="4"
            placeholder={additionalInstructionsPlaceholder}
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
                    placeholder={foodNamePlaceholder}
                    value={food.name}
                    onChange={(event) => updateFood(index, "name", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <FormField label="Category">
                  <select
                    required
                    value={food.category}
                    onChange={(event) => updateFood(index, "category", event.target.value)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  >
                    {FOOD_CATEGORIES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Quantity">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={food.quantity}
                    onChange={(event) => updateFood(index, "quantity", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <FormField label="Quantity unit">
                  <input
                    type="text"
                    required
                    placeholder="Boxes, pounds, trays, servings"
                    value={food.quantity_unit}
                    onChange={(event) => updateFood(index, "quantity_unit", event.target.value)}
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
                    onChange={(event) => updateFood(index, "expiration_date", event.target.value)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>

                <label className="flex min-h-[4.75rem] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={food.is_perishable}
                    onChange={(event) =>
                      updateFood(index, "is_perishable", event.target.checked)
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
                    placeholder={foodDescriptionPlaceholder}
                    value={food.description}
                    onChange={(event) => updateFood(index, "description", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                  />
                </FormField>
              </div>
            </section>
          ))}
        </div>
      </div>

      {error ? <p className="mt-5 text-sm font-semibold text-red-600">{error}</p> : null}
      {success ? (
        <p className="mt-5 text-sm font-semibold text-emerald-700">{success}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {isSubmitting ? "Publishing..." : publishLabel}
        </button>
      </div>
    </form>
  );
}
