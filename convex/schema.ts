import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  properties: defineTable({
    title: v.string(),
    description: v.string(),
    location: v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
    }),
    images: v.array(v.id("_storage")),
    amenities: v.array(v.string()),
    pricing: v.object({
      basePrice: v.number(),
      cleaningFee: v.number(),
      serviceFee: v.number(),
      currency: v.string(),
    }),
    capacity: v.object({
      maxGuests: v.number(),
      bedrooms: v.number(),
      bathrooms: v.number(),
      beds: v.number(),
    }),
    rules: v.object({
      checkIn: v.string(),
      checkOut: v.string(),
      allowsPets: v.boolean(),
      allowsSmoking: v.boolean(),
      allowsParties: v.boolean(),
    }),
    hostId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance")),
    platformIds: v.object({
      airbnb: v.optional(v.string()),
      agoda: v.optional(v.string()),
      booking: v.optional(v.string()),
    }),
    rating: v.optional(v.number()),
    reviewCount: v.number(),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_city", ["location.city"])
    .searchIndex("search_properties", {
      searchField: "title",
      filterFields: ["location.city", "status"],
    }),

  bookings: defineTable({
    propertyId: v.id("properties"),
    guestId: v.id("users"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.object({
      adults: v.number(),
      children: v.number(),
      pets: v.number(),
    }),
    pricing: v.object({
      subtotal: v.number(),
      cleaningFee: v.number(),
      serviceFee: v.number(),
      total: v.number(),
      currency: v.string(),
    }),
    payment: v.object({
      status: v.union(
        v.literal("pending"),
        v.literal("partial"),
        v.literal("paid"),
        v.literal("refunded")
      ),
      method: v.string(),
      amountPaid: v.number(),
      transactionId: v.optional(v.string()),
    }),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    platform: v.union(
      v.literal("direct"),
      v.literal("airbnb"),
      v.literal("agoda"),
      v.literal("booking")
    ),
    platformBookingId: v.optional(v.string()),
    guestDetails: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      specialRequests: v.optional(v.string()),
    }),
    syncStatus: v.union(v.literal("synced"), v.literal("pending"), v.literal("failed")),
  })
    .index("by_property", ["propertyId"])
    .index("by_guest", ["guestId"])
    .index("by_dates", ["checkIn", "checkOut"])
    .index("by_status", ["status"])
    .index("by_platform", ["platform"]),

  blockedDates: defineTable({
    propertyId: v.id("properties"),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.union(
      v.literal("booked"),
      v.literal("maintenance"),
      v.literal("owner_block"),
      v.literal("sync_lock")
    ),
    platform: v.optional(v.string()),
    bookingId: v.optional(v.id("bookings")),
    isTemporary: v.boolean(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_property", ["propertyId"])
    .index("by_dates", ["startDate", "endDate"])
    .index("by_temporary", ["isTemporary"]),

  reviews: defineTable({
    propertyId: v.id("properties"),
    guestId: v.id("users"),
    bookingId: v.id("bookings"),
    rating: v.number(),
    comment: v.string(),
    categories: v.object({
      cleanliness: v.number(),
      accuracy: v.number(),
      communication: v.number(),
      location: v.number(),
      checkIn: v.number(),
      value: v.number(),
    }),
    response: v.optional(v.string()),
    isVerified: v.boolean(),
  })
    .index("by_property", ["propertyId"])
    .index("by_guest", ["guestId"])
    .index("by_booking", ["bookingId"]),

  wishlists: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
  })
    .index("by_user", ["userId"])
    .index("by_property", ["propertyId"]),

  syncLogs: defineTable({
    propertyId: v.id("properties"),
    platform: v.string(),
    action: v.union(
      v.literal("availability_check"),
      v.literal("booking_sync"),
      v.literal("calendar_update"),
      v.literal("price_update")
    ),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    details: v.string(),
    error: v.optional(v.string()),
  })
    .index("by_property", ["propertyId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
    loyaltyTier: v.union(v.literal("Green"), v.literal("Emerald"), v.literal("Elite")),
    loyaltyPoints: v.number(),
    totalBookings: v.number(),
    isHost: v.boolean(),
    preferences: v.object({
      currency: v.string(),
      language: v.string(),
      notifications: v.object({
        email: v.boolean(),
        sms: v.boolean(),
        whatsapp: v.boolean(),
      }),
    }),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
