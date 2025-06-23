import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

interface PropertyDetailProps {
  propertyId: string;
  navigate: (page: Page) => void;
}

export function PropertyDetail({ propertyId, navigate }: PropertyDetailProps) {
  const property = useQuery(api.properties.getById, { 
    id: propertyId as Id<"properties"> 
  });

  if (property === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Property not found</h1>
        <button
          onClick={() => navigate({ type: "home" })}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate({ type: "home" })}
        className="flex items-center text-emerald-600 hover:text-emerald-800 mb-6 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="mb-8">
            {property.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 h-96">
                <div className="col-span-2 md:col-span-1">
                  <img
                    src={property.imageUrls[0] || ""}
                    alt={property.title}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="hidden md:grid grid-cols-1 gap-4">
                  {property.imageUrls.slice(1, 3).map((url, index) => (
                    <img
                      key={index}
                      src={url || ""}
                      alt={`${property.title} ${index + 2}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-96 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-24 h-24 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-emerald-900 mb-2">
                  {property.title}
                </h1>
                <p className="text-emerald-600 text-lg">
                  {property.location.address}, {property.location.city}, {property.location.state}
                </p>
              </div>
              
              {property.rating && (
                <div className="flex items-center bg-emerald-50 px-3 py-2 rounded-full">
                  <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium text-emerald-700">
                    {property.rating.toFixed(1)} ({property.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-emerald-600 mb-6">
              <span>{property.capacity.maxGuests} guests</span>
              <span>•</span>
              <span>{property.capacity.bedrooms} bedrooms</span>
              <span>•</span>
              <span>{property.capacity.bathrooms} bathrooms</span>
              <span>•</span>
              <span>{property.capacity.beds} beds</span>
            </div>

            <p className="text-emerald-700 text-lg leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center p-3 bg-emerald-50 rounded-xl">
                  <svg className="w-5 h-5 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">House Rules</h2>
            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-2">Check-in / Check-out</h3>
                  <p className="text-emerald-600">Check-in: {property.rules.checkIn}</p>
                  <p className="text-emerald-600">Check-out: {property.rules.checkOut}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-2">Policies</h3>
                  <p className="text-emerald-600">
                    Pets: {property.rules.allowsPets ? "Allowed" : "Not allowed"}
                  </p>
                  <p className="text-emerald-600">
                    Smoking: {property.rules.allowsSmoking ? "Allowed" : "Not allowed"}
                  </p>
                  <p className="text-emerald-600">
                    Parties: {property.rules.allowsParties ? "Allowed" : "Not allowed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-emerald-900">
                    {property.pricing.currency} {property.pricing.basePrice.toLocaleString()}
                  </span>
                  <span className="text-emerald-600 ml-2">/ night</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-2">
                    Guests
                  </label>
                  <select className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none">
                    {Array.from({ length: property.capacity.maxGuests }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => navigate({ type: "booking", propertyId: property._id })}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
              >
                Reserve Now
              </button>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">Base price (1 night)</span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {property.pricing.basePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Cleaning fee</span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {property.pricing.cleaningFee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Service fee</span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {property.pricing.serviceFee.toLocaleString()}
                  </span>
                </div>
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-900">Total</span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {(
                      property.pricing.basePrice + 
                      property.pricing.cleaningFee + 
                      property.pricing.serviceFee
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
