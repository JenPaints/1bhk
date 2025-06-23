import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PropertyCard } from "./PropertyCard";
import { SearchFilters } from "./SearchFilters";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

interface HomePageProps {
  navigate: (page: Page) => void;
}

interface SearchFilters {
  search?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
}

export function HomePage({ navigate }: HomePageProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const properties = useQuery(api.properties.list, {
    ...filters,
    limit: 20,
  });

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Luxury Stays,
              <br />
              <span className="text-emerald-200">Perfectly Synced</span>
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Discover premium accommodations with real-time availability across all platforms. 
              No double bookings, just seamless experiences.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Where
                  </label>
                  <input
                    type="text"
                    placeholder="Search destinations"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={filters.search || ""}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={filters.checkIn || ""}
                    onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={filters.checkOut || ""}
                    onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Guests
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={filters.guests || ""}
                    onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) || undefined })}
                  >
                    <option value="">Any</option>
                    <option value="1">1 guest</option>
                    <option value="2">2 guests</option>
                    <option value="3">3 guests</option>
                    <option value="4">4 guests</option>
                    <option value="5">5+ guests</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Filters
                </button>
                
                <button
                  onClick={() => handleSearch(filters)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-emerald-900">Featured Properties</h2>
            <p className="text-emerald-600 mt-2">
              {properties?.length || 0} luxury stays available
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select className="px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option>Sort by: Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
              <option>Rating</option>
            </select>
          </div>
        </div>

        {properties === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-emerald-100 rounded-2xl h-64 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-emerald-100 rounded w-3/4"></div>
                  <div className="h-4 bg-emerald-100 rounded w-1/2"></div>
                  <div className="h-4 bg-emerald-100 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-2">No properties found</h3>
            <p className="text-emerald-600 mb-8">Try adjusting your search filters or explore different dates</p>
            <button
              onClick={() => setFilters({})}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onClick={() => navigate({ type: "property", id: property._id })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-emerald-900 mb-4">Why Choose 1bhk.life?</h2>
            <p className="text-emerald-600 max-w-2xl mx-auto">
              Experience the future of luxury rentals with our advanced platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">Real-time Sync</h3>
              <p className="text-emerald-600">
                Never worry about double bookings. Our platform syncs across all major booking sites instantly.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">Luxury Properties</h3>
              <p className="text-emerald-600">
                Handpicked premium accommodations that meet our strict quality standards.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">Loyalty Rewards</h3>
              <p className="text-emerald-600">
                Earn points with every booking and unlock exclusive perks as you climb our loyalty tiers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
