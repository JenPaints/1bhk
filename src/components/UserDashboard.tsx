import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

interface UserDashboardProps {
  navigate: (page: Page) => void;
}

export function UserDashboard({ navigate }: UserDashboardProps) {
  const user = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.users.getUserProfile);
  const bookings = useQuery(api.bookings.getUserBookings);

  if (!user || !userProfile || !bookings) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => 
    new Date(b.checkIn) > new Date() && b.status === "confirmed"
  );
  const pastBookings = bookings.filter(b => 
    new Date(b.checkOut) < new Date() && b.status === "completed"
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Elite": return "from-yellow-500 to-yellow-700";
      case "Emerald": return "from-emerald-500 to-emerald-700";
      default: return "from-green-500 to-green-700";
    }
  };

  const getNextTierPoints = (tier: string, points: number) => {
    switch (tier) {
      case "Green": return 300 - points;
      case "Emerald": return 800 - points;
      default: return 0;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">
          Welcome back, {userProfile.firstName}!
        </h1>
        <p className="text-emerald-600">Manage your trips and explore new destinations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Trips */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-900 mb-6">Upcoming Trips</h2>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-emerald-100">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No upcoming trips</h3>
                <p className="text-emerald-600 mb-6">Ready for your next adventure?</p>
                <button
                  onClick={() => navigate({ type: "home" })}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
                >
                  Explore Properties
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                          {booking.property?.title}
                        </h3>
                        <p className="text-emerald-600 mb-4">
                          {booking.property?.location.city}, {booking.property?.location.state}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-emerald-600">
                          <span>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</span>
                          <span>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</span>
                          <span>{booking.guests.adults + booking.guests.children} guests</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === "confirmed" 
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {booking.status}
                        </div>
                        <p className="text-emerald-900 font-semibold mt-2">
                          {booking.pricing.currency} {booking.pricing.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past Trips */}
          <section>
            <h2 className="text-2xl font-bold text-emerald-900 mb-6">Past Trips</h2>
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-emerald-100">
                <p className="text-emerald-600">No past trips yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastBookings.slice(0, 3).map((booking) => (
                  <div key={booking._id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-emerald-900 mb-1">
                          {booking.property?.title}
                        </h3>
                        <p className="text-emerald-600 text-sm mb-2">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">
                        Write Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Loyalty Status */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 bg-gradient-to-br ${getTierColor(userProfile.loyaltyTier)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-lg">
                  {userProfile.loyaltyTier[0]}
                </span>
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-1">
                {userProfile.loyaltyTier} Member
              </h3>
              <p className="text-emerald-600 text-sm">
                {userProfile.loyaltyPoints} points earned
              </p>
            </div>

            {userProfile.loyaltyTier !== "Elite" && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-emerald-600 mb-2">
                  <span>Progress to next tier</span>
                  <span>{getNextTierPoints(userProfile.loyaltyTier, userProfile.loyaltyPoints)} points to go</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(userProfile.loyaltyPoints / (userProfile.loyaltyTier === "Green" ? 300 : 800)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-emerald-600">Total Bookings</span>
                <span className="font-medium text-emerald-900">{userProfile.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-600">Member Since</span>
                <span className="font-medium text-emerald-900">
                  {new Date(user._creationTime).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate({ type: "home" })}
                className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-emerald-700">Find New Properties</span>
              </button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center">
                <svg className="w-5 h-5 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-emerald-700">View Wishlist</span>
              </button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center">
                <svg className="w-5 h-5 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-emerald-700">Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Exclusive Offers */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Exclusive Offer</h3>
            <p className="text-emerald-100 text-sm mb-4">
              Book your next stay and earn double points!
            </p>
            <button className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
