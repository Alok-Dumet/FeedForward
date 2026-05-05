import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function normalizeRadius(value) {
  const radius = Number(value);
  if (Number.isFinite(radius) && radius > 0) {
    return radius;
  }

  return 150;
}

export default function RadiusSlider({ defaultMiles }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRadius = searchParams.get('radius_miles');
  const [value, setValue] = useState(normalizeRadius(urlRadius ?? defaultMiles));

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.set('radius_miles', String(value));
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(handle);
  }, [value, searchParams, setSearchParams]);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor="radius_miles" className="text-sm font-semibold text-slate-600">
        Within {value} {value === 1 ? 'mile' : 'miles'}
      </label>
      <input
        id="radius_miles"
        name="radius_miles"
        type="range"
        min={25}
        max={6000}
        step={25}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-2 w-full max-w-md cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
      />
    </div>
  );
}
