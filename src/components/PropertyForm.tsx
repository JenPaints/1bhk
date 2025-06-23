import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface PropertyFormProps {
  onClose: () => void;
  onSuccess: () => void;
  property?: any;
  isEdit?: boolean;
}

export function PropertyForm({ onClose, onSuccess, property, isEdit = false }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: property?.title || "",
    description: property?.description || "",
    location: {
      address: property?.location?.address || "",
      city: property?.location?.city || "",
      state: property?.location?.state || "",
      country: property?.location?.country || "India",
      coordinates: {
        lat: property?.location?.coordinates?.lat || 0,
        lng: property?.location?.coordinates?.lng || 0,
      },
    },
    amenities: property?.amenities || [],
    pricing: {
      basePrice: property?.pricing?.basePrice || 0,
      cleaningFee: property?.pricing?.cleaningFee || 0,
      serviceFee: property?.pricing?.serviceFee || 0,
      currency: property?.pricing?.currency || "INR",
    },
    capacity: {
      maxGuests: property?.capacity?.maxGuests || 1,
      bedrooms: property?.capacity?.bedrooms || 1,
      bathrooms: property?.capacity?.bathrooms || 1,
      beds: property?.capacity?.beds || 1,
    },
    rules: {
      checkIn: property?.rules?.checkIn || "15:00",
      checkOut: property?.rules?.checkOut || "11:00",
      allowsPets: property?.rules?.allowsPets || false,
      allowsSmoking: property?.rules?.allowsSmoking || false,
      allowsParties: property?.rules?.allowsParties || false,
    },
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.propertyManagement.updateProperty);
  const generateUploadUrl = useMutation(api.properties.generateUploadUrl);

  const commonAmenities = [
    "WiFi", "Kitchen", "Washing Machine", "Air Conditioning", "Heating",
    "TV", "Parking", "Pool", "Gym", "Pet Friendly", "Smoking Allowed",
    "Balcony", "Garden", "Hot Tub", "Fireplace", "Workspace"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageIds: string[] = property?.images || [];

      // Upload new images if any
      if (images.length > 0) {
        const uploadPromises = images.map(async (image) => {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
          });
          const { storageId } = await result.json();
          return storageId;
        });

        const newImageIds = await Promise.all(uploadPromises);
        imageIds = [...imageIds, ...newImageIds];
      }

      if (isEdit && property) {
        await updateProperty({
          propertyId: property._id,
          ...formData,
        });
        toast.success("Property updated successfully!");
      } else {
        await createProperty({
          ...formData,
          images: imageIds as any,
        });
        toast.success("Property created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to save property. Please try again.");
    }
  };

  const addAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity],
      });
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a: string) => a !== amenity),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-emerald-100">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-emerald-900">
              {isEdit ? "Edit Property" : "Add New Property"}
            </h2>
            <button
              onClick={onClose}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Property Title
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                required
                className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">Capacity</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Max Guests
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.capacity.maxGuests}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, maxGuests: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.capacity.bedrooms}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, bedrooms: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.capacity.bathrooms}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, bathrooms: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Beds
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.capacity.beds}
                  onChange={(e) => setFormData({
                    ...formData,
                    capacity: { ...formData.capacity, beds: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Base Price (per night)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.pricing.basePrice}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, basePrice: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Cleaning Fee
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.pricing.cleaningFee}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, cleaningFee: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Service Fee
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.pricing.serviceFee}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, serviceFee: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">Amenities</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => 
                    formData.amenities.includes(amenity) 
                      ? removeAmenity(amenity) 
                      : addAmenity(amenity)
                  }
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.amenities.includes(amenity)
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom amenity"
                className="flex-1 px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (newAmenity.trim()) {
                    addAmenity(newAmenity.trim());
                    setNewAmenity("");
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add
              </button>
            </div>

            {formData.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity: string) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* House Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900">House Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Check-in Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.rules.checkIn}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, checkIn: e.target.value }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Check-out Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.rules.checkOut}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, checkOut: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.rules.allowsPets}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, allowsPets: e.target.checked }
                  })}
                />
                <span className="ml-2 text-emerald-700">Allow Pets</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.rules.allowsSmoking}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, allowsSmoking: e.target.checked }
                  })}
                />
                <span className="ml-2 text-emerald-700">Allow Smoking</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.rules.allowsParties}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: { ...formData.rules, allowsParties: e.target.checked }
                  })}
                />
                <span className="ml-2 text-emerald-700">Allow Parties/Events</span>
              </label>
            </div>
          </div>

          {/* Images */}
          {!isEdit && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-900">Images</h3>
              
              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-2">
                  Upload Property Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImages(Array.from(e.target.files));
                    }
                  }}
                />
                <p className="text-sm text-emerald-600 mt-1">
                  Select multiple images to showcase your property
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-emerald-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-emerald-100 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
            >
              {isEdit ? "Update Property" : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
