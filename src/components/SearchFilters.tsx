import { useState } from "react";

interface SearchFiltersProps {
  filters: {
    search?: string;
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function SearchFilters({ filters, onFiltersChange, onClose }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border-b border-emerald-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-emerald-900">Filters</h3>
          <button
            onClick={onClose}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
      {/* Main Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-emerald-700 mb-2">
            Where to?
          </label>
          <input
            type="text"
            placeholder="Search destinations..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-emerald-700 mb-2">
            Check-in
          </label>
          <input
            type="date"
            value={filters.checkIn || ""}
            onChange={(e) => updateFilter("checkIn", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-emerald-700 mb-2">
            Check-out
          </label>
          <input
            type="date"
            value={filters.checkOut || ""}
            onChange={(e) => updateFilter("checkOut", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Guests and Advanced Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              Guests
            </label>
            <select
              value={filters.guests || 1}
              onChange={(e) => updateFilter("guests", parseInt(e.target.value))}
              className="px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-7 px-4 py-3 text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            {showAdvanced ? "Less filters" : "More filters"}
          </button>
        </div>

        <button className="mt-7 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg">
          Search
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-emerald-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Enter city"
                value={filters.city || ""}
                onChange={(e) => updateFilter("city", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Min Price (per night)
              </label>
              <input
                type="number"
                value={filters.minPrice || ""}
                onChange={(e) => updateFilter("minPrice", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Max Price (per night)
              </label>
              <input
                type="number"
                value={filters.maxPrice || ""}
                onChange={(e) => updateFilter("maxPrice", parseInt(e.target.value) || 10000)}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
