'use client';

import {
  DEFAULT_RADIUS_KM,
  MAX_RADIUS_KM,
  MIN_RADIUS_KM,
  RADIUS_PRESETS_KM,
} from '@/lib/nearby';

interface DistanceRadiusControlProps {
  radiusKm: number;
  onChange: (km: number) => void;
  courtsInRange: number;
  disabled?: boolean;
}

export default function DistanceRadiusControl({
  radiusKm,
  onChange,
  courtsInRange,
  disabled,
}: DistanceRadiusControlProps) {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex flex-wrap gap-2 mb-4">
        {RADIUS_PRESETS_KM.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              radiusKm === preset
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset} km
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={1}
          value={radiusKm}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-green-600 bg-green-100"
          aria-label="Search radius in kilometres"
        />
        <span className="text-2xl font-bold text-green-700 tabular-nums w-16 text-right">
          {radiusKm}
          <span className="text-sm font-medium text-gray-500 ml-0.5">km</span>
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600">
        {courtsInRange === 0 ? (
          <span className="text-amber-700 font-medium">
            No courts in this range — try a larger radius.
          </span>
        ) : (
          <>
            <span className="font-semibold text-green-700">{courtsInRange}</span>
            {courtsInRange === 1 ? ' court' : ' courts'} within {radiusKm} km
          </>
        )}
      </p>
    </div>
  );
}

export { DEFAULT_RADIUS_KM };
