import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PropertyForm } from "./PropertyForm";
import { CalendarView } from "./CalendarView";
import { toast } from "sonner";

interface EnhancedAdminDashboardProps {
  user: any;
}

export function EnhancedAdminDashboard({ user }: EnhancedAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "properties" | "bookings" | "calendar" | "analytics">("overview");
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Queries
  const hostProperties = useQuery(api.admin.getHostProperties);
  const hostBookings = useQuery(api.admin.getHostBookings);
  const hostAnalytics = useQuery(api.admin.getHostAnalytics);
  const upcomingEvents = useQuery(api.calendar.getUpcomingEvents);

  // Mutations
  const deleteProperty = useMutation(api.propertyManagement.deleteProperty);
  const togglePropertyStatus = useMutation(api.propertyManagement.togglePropertyStatus);
  const updateBookingStatus = useMutation(api.bookings.updateStatus);

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      try {
        await deleteProperty({ propertyId: propertyId as any });
        toast.success("Property deleted successfully");
      } catch (error) {
        toast.error("Failed to delete property. It may have active bookings.");
      }
    }
  };

  const handleTogglePropertyStatus = async (propertyId: string, status: "active" | "inactive" | "maintenance") => {
    try {
      await togglePropertyStatus({ propertyId: propertyId as any, status });
      toast.success("Property status updated");
    } catch (error) {
      toast.error("Failed to update property status");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateBookingStatus({ bookingId: bookingId as any, status });
      toast.success("Booking status updated");
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "maintenance":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "properties", label: "Properties", icon: "🏠" },
    { id: "bookings", label: "Bookings", icon: "📅" },
    { id: "calendar", label: "Calendar", icon: "🗓️" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">Host Dashboard</h1>
          <p className="text-emerald-600 mt-2">Welcome back, {user?.name || "Host"}!</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-emerald-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-emerald-500 hover:text-emerald-700 hover:border-emerald-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-600">Total Properties</p>
                    <p className="text-2xl font-bold text-emerald-900">{hostProperties?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-emerald-900">{hostBookings?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(hostAnalytics?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-emerald-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {hostAnalytics?.averageRating?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-900 mb-4">Upcoming Events</h3>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${
                          event.type === "check-in" ? "bg-green-100" : "bg-blue-100"
                        }`}>
                          {event.type === "check-in" ? "📥" : "📤"}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-emerald-900">
                            {event.type === "check-in" ? "Check-in" : "Check-out"}: {event.guest}
                          </p>
                          <p className="text-sm text-emerald-600">{event.property}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-900">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-600">No upcoming events</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-emerald-900">Your Properties</h2>
              <button
                onClick={() => setShowPropertyForm(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
              >
                Add New Property
              </button>
            </div>

            {/* Properties Grid */}
            {hostProperties && hostProperties.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {hostProperties.map((property) => (
                  <div key={property._id} className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                    <div className="relative">
                      {(property as any).imageUrls && (property as any).imageUrls.length > 0 ? (
                        <img
                          src={(property as any).imageUrls[0]}
                          alt={property.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-2">{property.title}</h3>
                      <p className="text-emerald-600 text-sm mb-4">
                        {property.location.city}, {property.location.state}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-emerald-900">
                          {formatCurrency(property.pricing.basePrice)}
                        </span>
                        <span className="text-emerald-600 text-sm">/ night</span>
                      </div>

                      <div className="flex space-x-2 mb-4">
                        <button
                          onClick={() => {
                            setEditingProperty(property);
                            setShowPropertyForm(true);
                          }}
                          className="flex-1 bg-emerald-100 text-emerald-700 py-2 px-4 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPropertyId(property._id);
                            setActiveTab("calendar");
                          }}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Calendar
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property._id)}
                          className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTogglePropertyStatus(property._id, property.status === "active" ? "inactive" : "active")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            property.status === "active"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {property.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleTogglePropertyStatus(property._id, "maintenance")}
                          className="flex-1 bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                        >
                          Maintenance
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                </svg>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Properties Yet</h3>
                <p className="text-emerald-600 mb-6">Start by adding your first property to begin hosting.</p>
                <button
                  onClick={() => setShowPropertyForm(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
                >
                  Add Your First Property
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-emerald-900">Bookings</h2>
            
            {hostBookings && hostBookings.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-emerald-200">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-emerald-200">
                      {hostBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-emerald-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-emerald-900">
                                {booking.guestDetails.name}
                              </div>
                              <div className="text-sm text-emerald-500">
                                {booking.guestDetails.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-emerald-900">{booking.property?.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-emerald-900">
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-emerald-900">
                              {formatCurrency(booking.pricing.total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {booking.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking._id, "confirmed")}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking._id, "cancelled")}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {booking.status === "confirmed" && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, "completed")}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Bookings Yet</h3>
                <p className="text-emerald-600">Your bookings will appear here once guests start booking your properties.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-emerald-900">Calendar Management</h2>
            <CalendarView propertyId={selectedPropertyId || undefined} />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-emerald-900">Analytics</h2>
            
            {hostAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Revenue Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Total Revenue</span>
                      <span className="font-semibold text-emerald-900">
                        {formatCurrency(hostAnalytics.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Monthly Revenue</span>
                      <span className="font-semibold text-emerald-900">
                        {formatCurrency(hostAnalytics.monthlyRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Booking Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Total Bookings</span>
                      <span className="font-semibold text-emerald-900">{hostAnalytics.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Completed</span>
                      <span className="font-semibold text-emerald-900">{hostAnalytics.completedBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Occupancy Rate</span>
                      <span className="font-semibold text-emerald-900">{hostAnalytics.occupancyRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Guest Satisfaction</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Average Rating</span>
                      <span className="font-semibold text-emerald-900">
                        {hostAnalytics.averageRating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">Total Reviews</span>
                      <span className="font-semibold text-emerald-900">{hostAnalytics.reviewCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Analytics Data</h3>
                <p className="text-emerald-600">Analytics will be available once you have properties and bookings.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          property={editingProperty}
          isEdit={!!editingProperty}
          onClose={() => {
            setShowPropertyForm(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            setShowPropertyForm(false);
            setEditingProperty(null);
          }}
        />
      )}
    </div>
  );
}
