import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

interface BookingFlowProps {
  propertyId: string;
  navigate: (page: Page) => void;
}

export function BookingFlow({ propertyId, navigate }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: { adults: 2, children: 0, pets: 0 },
    guestDetails: {
      name: "",
      email: "",
      phone: "",
      specialRequests: "",
    },
    paymentMethod: "card",
    paymentType: "full" as "full" | "partial",
  });

  const property = useQuery(api.properties.getById, { id: propertyId as Id<"properties"> });
  const createBooking = useMutation(api.bookings.create);
  const confirmPayment = useMutation(api.bookings.confirmPayment);

  const handleBookingSubmit = async () => {
    try {
      const result = await createBooking({
        propertyId: propertyId as Id<"properties">,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        guestDetails: bookingData.guestDetails,
        paymentMethod: bookingData.paymentMethod,
        paymentType: bookingData.paymentType,
      });

      // Simulate payment processing
      setTimeout(async () => {
        await confirmPayment({
          bookingId: result.bookingId,
          transactionId: `txn_${Date.now()}`,
          amountPaid: result.amountToPay,
        });
        
        toast.success("Booking confirmed successfully!");
        navigate({ type: "dashboard" });
      }, 2000);

      setStep(3); // Payment processing step
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
    }
  };

  if (!property) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const nights = bookingData.checkIn && bookingData.checkOut 
    ? Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const subtotal = property.pricing.basePrice * nights;
  const total = subtotal + property.pricing.cleaningFee + property.pricing.serviceFee;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate({ type: "property", id: propertyId })}
          className="flex items-center text-emerald-600 hover:text-emerald-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to property
        </button>
        <h1 className="text-3xl font-bold text-emerald-900">Complete your booking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
              <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Booking Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.checkIn}
                    onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.checkOut}
                    onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-emerald-900 mb-4">Guests</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">Adults</label>
                    <select
                      className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={bookingData.guests.adults}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guests: { ...bookingData.guests, adults: parseInt(e.target.value) }
                      })}
                    >
                      {[1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">Children</label>
                    <select
                      className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={bookingData.guests.children}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guests: { ...bookingData.guests, children: parseInt(e.target.value) }
                      })}
                    >
                      {[0,1,2,3,4].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-emerald-900 mb-2">Pets</label>
                    <select
                      className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={bookingData.guests.pets}
                      onChange={(e) => setBookingData({
                        ...bookingData,
                        guests: { ...bookingData.guests, pets: parseInt(e.target.value) }
                      })}
                      disabled={!property.rules.allowsPets}
                    >
                      {[0,1,2].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!bookingData.checkIn || !bookingData.checkOut}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Guest Details
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
              <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Guest Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.guestDetails.name}
                    onChange={(e) => setBookingData({
                      ...bookingData,
                      guestDetails: { ...bookingData.guestDetails, name: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.guestDetails.email}
                    onChange={(e) => setBookingData({
                      ...bookingData,
                      guestDetails: { ...bookingData.guestDetails, email: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.guestDetails.phone}
                    onChange={(e) => setBookingData({
                      ...bookingData,
                      guestDetails: { ...bookingData.guestDetails, phone: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={bookingData.guestDetails.specialRequests}
                    onChange={(e) => setBookingData({
                      ...bookingData,
                      guestDetails: { ...bookingData.guestDetails, specialRequests: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Payment Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={bookingData.paymentType === "full"}
                        onChange={(e) => setBookingData({ ...bookingData, paymentType: e.target.value as "full" | "partial" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-3 text-emerald-900">Pay full amount now</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentType"
                        value="partial"
                        checked={bookingData.paymentType === "partial"}
                        onChange={(e) => setBookingData({ ...bookingData, paymentType: e.target.value as "full" | "partial" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-3 text-emerald-900">Pay 50% now, 50% later</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-emerald-100 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={!bookingData.guestDetails.name || !bookingData.guestDetails.email || !bookingData.guestDetails.phone}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
              <h2 className="text-2xl font-semibold text-emerald-900 mb-2">Processing Payment</h2>
              <p className="text-emerald-600">Please wait while we confirm your booking...</p>
            </div>
          )}
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 sticky top-8">
            <h3 className="text-xl font-semibold text-emerald-900 mb-4">Booking Summary</h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-emerald-900 mb-2">{property.title}</h4>
              <p className="text-sm text-emerald-600">
                {property.location.city}, {property.location.state}
              </p>
            </div>

            {bookingData.checkIn && bookingData.checkOut && (
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">Check-in</span>
                  <span className="text-emerald-900">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Check-out</span>
                  <span className="text-emerald-900">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Guests</span>
                  <span className="text-emerald-900">
                    {bookingData.guests.adults + bookingData.guests.children} guests
                  </span>
                </div>
              </div>
            )}

            {nights > 0 && (
              <div className="border-t border-emerald-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">
                    {property.pricing.currency} {property.pricing.basePrice.toLocaleString()} × {nights} nights
                  </span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {subtotal.toLocaleString()}
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
                <div className="border-t border-emerald-100 pt-3 flex justify-between font-semibold">
                  <span className="text-emerald-900">Total</span>
                  <span className="text-emerald-900">
                    {property.pricing.currency} {total.toLocaleString()}
                  </span>
                </div>
                {bookingData.paymentType === "partial" && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Due now (50%)</span>
                    <span>{property.pricing.currency} {(total * 0.5).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
