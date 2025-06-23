interface PropertyCardProps {
  property: {
    _id: string;
    title: string;
    location: {
      city: string;
      state: string;
    };
    pricing: {
      basePrice: number;
      currency: string;
    };
    capacity: {
      maxGuests: number;
      bedrooms: number;
      bathrooms: number;
    };
    rating?: number;
    reviewCount: number;
    imageUrls?: (string | null)[];
  };
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const hasImages = property.imageUrls && property.imageUrls.length > 0;
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-emerald-100"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        {hasImages ? (
          <img
            src={property.imageUrls?.[0] || ""}
            alt={property.title}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex space-x-2">
          {property.rating && property.rating >= 4.8 && (
            <span className="bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Guest's Choice
            </span>
          )}
          {property.reviewCount < 5 && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Rare Find
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-4 right-4 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-emerald-900 group-hover:text-emerald-700 transition-colors">
            {property.title}
          </h3>
          {property.rating && (
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-emerald-900">
                {property.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-emerald-600 text-sm mb-3">
          {property.location.city}, {property.location.state}
        </p>

        <div className="flex items-center text-sm text-emerald-600 mb-4 space-x-4">
          <span>{property.capacity.maxGuests} guests</span>
          <span>•</span>
          <span>{property.capacity.bedrooms} bedrooms</span>
          <span>•</span>
          <span>{property.capacity.bathrooms} bathrooms</span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-emerald-900">
              {property.pricing.currency} {property.pricing.basePrice.toLocaleString()}
            </span>
            <span className="text-emerald-600 text-sm"> / night</span>
          </div>
          
          {property.reviewCount > 0 && (
            <span className="text-sm text-emerald-600">
              {property.reviewCount} reviews
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
