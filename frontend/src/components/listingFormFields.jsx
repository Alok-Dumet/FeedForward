import { FOOD_CATEGORY_LABELS } from '../utils/foods.js';
import { DAY_OPTIONS } from '../utils/listingFormData.js';
import FormField from './formField.jsx';

export function ListingAvailabilityEditor({
  title,
  windows,
  onAdd,
  onUpdate,
  onRemove,
  emptyMessage = null,
  sectionClassName = 'mt-8 rounded-3xl border border-slate-200 bg-white/80 p-5',
  titleClassName = 'text-xl font-bold text-slate-900',
  gridClassName = 'mt-4 grid gap-4',
  itemClassName = 'grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]',
}) {
  return (
    <section className={sectionClassName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className={titleClassName}>{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
        >
          Add time
        </button>
      </div>

      {windows.length === 0 && emptyMessage ? (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        <div className={gridClassName}>
          {windows.map((window, index) => (
            <div key={index} className={itemClassName}>
              <FormField label="Day">
                <select
                  required
                  value={window.day}
                  onChange={(event) =>
                    onUpdate(index, 'day', event.target.value)
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
                    onUpdate(index, 'start_time', event.target.value)
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
                    onUpdate(index, 'end_time', event.target.value)
                  }
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
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
  );
}

export function ListingFoodEditor({
  foods,
  onAdd,
  onUpdate,
  onRemove,
  title = 'Food items',
  itemTitle = (index) => `Food item ${index + 1}`,
  foodNamePlaceholder = 'Example: Hawaiian Pizza',
  foodDescriptionPlaceholder = 'Example: Thin crust, pineapple, onions, olives, stuffed crust',
  sectionClassName = 'mt-8',
  gridClassName = 'mt-4 grid gap-5',
  itemClassName = 'rounded-3xl border border-slate-200 bg-white/80 p-5',
  removeLabel = 'Remove',
}) {
  return (
    <div className={sectionClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
        >
          Add food item
        </button>
      </div>

      <div className={gridClassName}>
        {foods.map((food, index) => (
          <section
            key={`${food.id ?? 'new'}-${index}`}
            className={itemClassName}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-base font-bold text-slate-900">
                {itemTitle(index)}
              </h4>
              {foods.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                >
                  {removeLabel}
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
                  onChange={(event) =>
                    onUpdate(index, 'name', event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <FormField label="Category">
                <select
                  required
                  value={food.category}
                  onChange={(event) =>
                    onUpdate(index, 'category', event.target.value)
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
                    onUpdate(index, 'quantity', event.target.value)
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
                    onUpdate(index, 'quantity_unit', event.target.value)
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
                    onUpdate(index, 'expiration_date', event.target.value)
                  }
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>

              <label className="flex min-h-[4.75rem] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={food.is_perishable}
                  onChange={(event) =>
                    onUpdate(index, 'is_perishable', event.target.checked)
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
                  onChange={(event) =>
                    onUpdate(index, 'description', event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-amber-300"
                />
              </FormField>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
