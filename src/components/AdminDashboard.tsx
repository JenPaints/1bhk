import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "react-hot-toast";
import { PropertyForm } from "./PropertyForm";

type Page = 
  | { type: "home" }
  | { type: "property"; id: string }
  | { type: "booking"; propertyId: string }
  | { type: "dashboard" }
  | { type: "admin" };

interface AdminDashboardProps {
  navigate: (page: Page) => void;
}

type AdminTab = "overview" | "properties" | "bookings" | "sync" | "analytics";

export function AdminDashboard({ navigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  
  const user = useQuery(api.auth.loggedInUser);
  const properties = useQuery(api.admin.getPropertyListings);
  const bookings = useQuery(api.admin.getHostBookings);
  const syncLogs = useQuery(api.admin.getSyncLogs);
  const analytics = useQuery(api.admin.getAnalytics);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "properties", name: "Properties", icon: "🏠" },
    { id: "bookings", name: "Bookings", icon: "📅" },
    { id: "sync", name: "Platform Sync", icon: "🔄" },
    { id: "analytics", name: "Analytics", icon: "📈" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">Host Dashboard</h1>
        <p className="text-emerald-600">Manage your properties and bookings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-emerald-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-emerald-500 hover:text-emerald-700 hover:border-emerald-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab analytics={analytics} />}
      {activeTab === "properties" && <PropertiesTab properties={properties} />}
      {activeTab === "bookings" && <BookingsTab bookings={bookings} />}
      {activeTab === "sync" && <SyncTab syncLogs={syncLogs} />}
      {activeTab === "analytics" && <AnalyticsTab analytics={analytics} />}
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: any }) {
  if (!analytics) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-900">
                ₹{analytics.totalRevenue?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-xl">💰</span>
            </div>
          </div>
          <p className="text-emerald-500 text-sm mt-2">
            +12% from last month
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Occupancy Rate</p>
              <p className="text-2xl font-bold text-emerald-900">
                {analytics.occupancyRate || "0"}%
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-xl">📊</span>
            </div>
          </div>
          <p className="text-emerald-500 text-sm mt-2">
            +5% from last month
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Active Properties</p>
              <p className="text-2xl font-bold text-emerald-900">
                {analytics.activeProperties || "0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-xl">🏠</span>
            </div>
          </div>
          <p className="text-emerald-500 text-sm mt-2">
            2 new this month
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Avg Rating</p>
              <p className="text-2xl font-bold text-emerald-900">
                {analytics.averageRating || "0.0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-xl">⭐</span>
            </div>
          </div>
          <p className="text-emerald-500 text-sm mt-2">
            Based on 127 reviews
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
        <h3 className="text-xl font-semibold text-emerald-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: "booking", message: "New booking for Luxury Villa Mumbai", time: "2 hours ago" },
            { type: "sync", message: "Airbnb sync completed successfully", time: "4 hours ago" },
            { type: "review", message: "New 5-star review received", time: "1 day ago" },
            { type: "payment", message: "Payment of ₹15,000 received", time: "2 days ago" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-emerald-600">
                  {activity.type === "booking" && "📅"}
                  {activity.type === "sync" && "🔄"}
                  {activity.type === "review" && "⭐"}
                  {activity.type === "payment" && "💳"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-emerald-900 font-medium">{activity.message}</p>
                <p className="text-emerald-600 text-sm">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertiesTab({ properties }: { properties: any }) {
  const addProperty = useMutation(api.admin.addProperty);
  const updateProperty = useMutation(api.propertyManagement.updateProperty);
  const updatePropertyStatus = useMutation(api.admin.updatePropertyStatus);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  if (!properties) {
    return <div className="animate-pulse">Loading properties...</div>;
  }

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setShowPropertyForm(true);
  };

  const handleEditProperty = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyForm(true);
  };

  const handlePropertyFormClose = () => {
    setShowPropertyForm(false);
    setSelectedProperty(null);
  };

  const handlePropertyFormSuccess = () => {
    setShowPropertyForm(false);
    setSelectedProperty(null);
    // The properties list will automatically refresh due to useQuery
  };

  const handleStatusChange = async (propertyId: string, newStatus: "active" | "inactive" | "maintenance") => {
    try {
      await updatePropertyStatus({ propertyId, status: newStatus });
      // You would typically refresh the properties list here
      // This will happen automatically if you're using useQuery with Convex
    } catch (error) {
      console.error("Failed to update property status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-900">Your Properties</h2>
        <button
          onClick={handleAddProperty}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          Add New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-600 text-3xl">🏠</span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900 mb-2">No properties yet</h3>
          <p className="text-emerald-600 mb-8">Start by adding your first property to begin hosting</p>
          <button
            onClick={handleAddProperty}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-3 rounded-full font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all"
          >
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <div key={property._id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">
                    {property.title}
                  </h3>
                  <p className="text-emerald-600 text-sm">
                    {property.location.city}, {property.location.state}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  property.status === "active" 
                    ? "bg-green-100 text-green-800"
                    : property.status === "maintenance"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {property.status}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">Base Price</span>
                  <span className="font-medium text-emerald-900">
                    ₹{property.pricing.basePrice.toLocaleString()}/night
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Capacity</span>
                  <span className="font-medium text-emerald-900">
                    {property.capacity.maxGuests} guests
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Reviews</span>
                  <span className="font-medium text-emerald-900">
                    {property.reviewCount} reviews
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-emerald-100 flex space-x-2">
                <button 
                  onClick={() => handleEditProperty(property)}
                  className="flex-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  Edit
                </button>
                <div className="relative flex-1">
                  <select 
                    value={property.status}
                    onChange={(e) => handleStatusChange(property._id, e.target.value as any)}
                    className="w-full appearance-none bg-transparent text-emerald-600 hover:text-emerald-800 text-sm font-medium cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <button className="flex-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium">
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      {showPropertyForm && (
        <PropertyForm
          onClose={handlePropertyFormClose}
          onSuccess={handlePropertyFormSuccess}
          property={selectedProperty}
          isEdit={!!selectedProperty}
        />
      )}
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: any }) {
  if (!bookings) {
    return <div className="animate-pulse">Loading bookings...</div>;
  }

  const upcomingBookings = bookings.filter((b: any) => 
    new Date(b.checkIn) > new Date()
  );
  const currentBookings = bookings.filter((b: any) => 
    new Date(b.checkIn) <= new Date() && new Date(b.checkOut) >= new Date()
  );

  return (
    <div className="space-y-8">
      {/* Current Guests */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Current Guests</h2>
        {currentBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-emerald-100">
            <p className="text-emerald-600">No current guests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking: any) => (
              <div key={booking._id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                      {booking.guestDetails.name}
                    </h3>
                    <p className="text-emerald-600 mb-2">
                      {booking.property?.title}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-emerald-600">
                      <span>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</span>
                      <span>{booking.guests.adults + booking.guests.children} guests</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors">
                      Message
                    </button>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Bookings */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Upcoming Bookings</h2>
        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-emerald-100">
            <p className="text-emerald-600">No upcoming bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking: any) => (
              <div key={booking._id} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                      {booking.guestDetails.name}
                    </h3>
                    <p className="text-emerald-600 mb-2">
                      {booking.property?.title}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-emerald-600">
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
                      ₹{booking.pricing.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SyncTab({ syncLogs }: { syncLogs: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  
  // Get platform connections
  const platformConnectionsQuery = useQuery(
    api.platformConnections.getPlatformConnections
  );
  const { data: platformConnections, isLoading: isLoadingConnections } = platformConnectionsQuery || { data: undefined, isLoading: true };
  
  // Get host properties for platform connections
  const propertiesQuery = useQuery(api.admin.getPropertyListings);
  const { data: properties } = propertiesQuery || { data: undefined };
  
  // Mutations for platform operations
  const { mutate: connectPlatform } = useMutation(api.platformConnections.connectPlatform);
  const { mutate: disconnectPlatform } = useMutation(api.platformConnections.disconnectPlatform);
  const { mutate: syncProperty } = useMutation(api.platformConnections.syncProperty);
  
  // Handle platform sync
  const handleSync = async (platform: string) => {
    if (!properties || properties.length === 0) return;
    
    setSyncingPlatform(platform);
    setIsLoading(true);
    
    try {
      await syncProperty({ propertyId: properties[0]._id });
      toast.success(`Successfully synced with ${platform}`);
    } catch (error) {
      toast.error(`Failed to sync with ${platform}: ${error}`);
    } finally {
      setIsLoading(false);
      setSyncingPlatform(null);
    }
  };
  
  // Handle platform connection/reconnection
  const handleConnect = async (platform: string) => {
    if (!properties || properties.length === 0) return;
    
    // In a real app, this would open a modal to get the platform property ID
    // For demo purposes, we'll use a mock ID
    const platformPropertyId = `mock-${platform}-${Date.now()}`;
    
    try {
      await connectPlatform({
        propertyId: properties[0]._id,
        platform: platform as any,
        platformPropertyId,
      });
      toast.success(`Connected to ${platform}`);
    } catch (error) {
      toast.error(`Failed to connect to ${platform}: ${error}`);
    }
  };

  if (!syncLogs || isLoadingConnections) {
    return <div className="animate-pulse">Loading sync status...</div>;
  }

  const platforms = [
    { 
      name: "Airbnb", 
      id: "airbnb",
      status: platformConnections?.airbnb.connected ? "connected" : "disconnected", 
      lastSync: platformConnections?.airbnb.lastSync 
        ? new Date(platformConnections.airbnb.lastSync).toLocaleString() 
        : "Never", 
      color: platformConnections?.airbnb.connected ? "green" : "red" 
    },
    { 
      name: "Booking.com", 
      id: "booking",
      status: platformConnections?.booking.connected ? "connected" : "disconnected", 
      lastSync: platformConnections?.booking.lastSync 
        ? new Date(platformConnections.booking.lastSync).toLocaleString() 
        : "Never", 
      color: platformConnections?.booking.connected ? "green" : "red" 
    },
    { 
      name: "Agoda", 
      id: "agoda",
      status: platformConnections?.agoda.connected ? "connected" : "disconnected", 
      lastSync: platformConnections?.agoda.lastSync 
        ? new Date(platformConnections.agoda.lastSync).toLocaleString() 
        : "Never", 
      color: platformConnections?.agoda.connected ? "green" : "red" 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Platform Status */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Platform Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div key={platform.name} className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-900">{platform.name}</h3>
                <div className={`w-3 h-3 rounded-full ${
                  platform.color === "green" ? "bg-green-500" : "bg-red-500"
                }`}></div>
              </div>
              <p className={`text-sm font-medium mb-2 ${
                platform.status === "connected" ? "text-green-600" : "text-red-600"
              }`}>
                {platform.status === "connected" ? "Connected" : "Disconnected"}
              </p>
              <p className="text-emerald-600 text-sm">
                Last sync: {platform.lastSync}
              </p>
              <button 
                className={`mt-4 w-full ${
                  isLoading && syncingPlatform === platform.id
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                } py-2 rounded-lg text-sm font-medium transition-colors`}
                onClick={() => platform.status === "connected" 
                  ? handleSync(platform.id) 
                  : handleConnect(platform.id)
                }
                disabled={isLoading && syncingPlatform === platform.id}
              >
                {isLoading && syncingPlatform === platform.id 
                  ? "Syncing..." 
                  : platform.status === "connected" 
                    ? "Sync Now" 
                    : "Connect"
                }
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Sync Logs */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Recent Sync Activity</h2>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm">
          <div className="p-6">
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-emerald-600">
                No sync activity yet. Connect a platform to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {syncLogs.slice(0, 10).map((log: any, index: number) => (
                  <div key={index} className="flex items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
                    <div className={`w-3 h-3 rounded-full mr-4 ${
                      log.status === "success" ? "bg-green-500" : 
                      log.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-emerald-900 font-medium">
                        {log.platform} - {log.action.replace("_", " ")}
                      </p>
                      <p className="text-emerald-600 text-sm">{log.details}</p>
                    </div>
                    <span className="text-emerald-500 text-sm">
                      {new Date(log._creationTime).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsTab({ analytics }: { analytics: any }) {
  if (!analytics) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Revenue Chart Placeholder */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Revenue Overview</h2>
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
          <div className="h-64 bg-emerald-50 rounded-xl flex items-center justify-center">
            <p className="text-emerald-600">Revenue chart would be displayed here</p>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section>
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">Booking Sources</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-emerald-600">Direct</span>
                <span className="font-medium text-emerald-900">45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">Airbnb</span>
                <span className="font-medium text-emerald-900">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">Booking.com</span>
                <span className="font-medium text-emerald-900">25%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">Guest Demographics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-emerald-600">Domestic</span>
                <span className="font-medium text-emerald-900">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">International</span>
                <span className="font-medium text-emerald-900">30%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">Top Performing Property</h3>
            <p className="text-emerald-600 text-sm mb-2">Luxury Villa Mumbai</p>
            <p className="text-2xl font-bold text-emerald-900">₹2,45,000</p>
            <p className="text-emerald-500 text-sm">This month</p>
          </div>
        </div>
      </section>
    </div>
  );
}
