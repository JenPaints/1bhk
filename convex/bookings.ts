import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    propertyId: v.id("properties"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.object({
      adults: v.number(),
      children: v.number(),
      pets: v.number(),
    }),
    guestDetails: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      specialRequests: v.optional(v.string()),
    }),
    paymentMethod: v.string(),
    paymentType: v.union(v.literal("full"), v.literal("partial")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create booking");
    }

    // Check availability
    const availability = await ctx.runQuery(internal.properties.checkAvailability, {
      propertyId: args.propertyId,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
    });

    if (!availability.available) {
      throw new Error("Property is not available for selected dates");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    // Calculate pricing
    const nights = Math.ceil(
      (new Date(args.checkOut).getTime() - new Date(args.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const subtotal = property.pricing.basePrice * nights;
    const total = subtotal + property.pricing.cleaningFee + property.pricing.serviceFee;
    const amountToPay = args.paymentType === "full" ? total : total * 0.5;

    // Create temporary block
    await ctx.db.insert("blockedDates", {
      propertyId: args.propertyId,
      startDate: args.checkIn,
      endDate: args.checkOut,
      reason: "sync_lock",
      isTemporary: true,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const bookingId = await ctx.db.insert("bookings", {
      propertyId: args.propertyId,
      guestId: userId,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      pricing: {
        subtotal,
        cleaningFee: property.pricing.cleaningFee,
        serviceFee: property.pricing.serviceFee,
        total,
        currency: property.pricing.currency,
      },
      payment: {
        status: "pending",
        method: args.paymentMethod,
        amountPaid: 0,
      },
      status: "pending",
      platform: "direct",
      guestDetails: args.guestDetails,
      syncStatus: "pending",
    });

    // Schedule sync across platforms
    await ctx.scheduler.runAfter(0, internal.sync.syncBookingAcrossPlatforms, {
      bookingId,
    });

    // Add loyalty points
    await ctx.runMutation(internal.users.addLoyaltyPoints, {
      userId,
      points: Math.floor(total / 100), // 1 point per ₹100
      bookingAmount: total,
    });

    return { bookingId, amountToPay };
  },
});

export const getUserBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_guest", (q) => q.eq("guestId", userId))
      .order("desc")
      .collect();

    const bookingsWithProperties = await Promise.all(
      bookings.map(async (booking) => {
        const property = await ctx.db.get(booking.propertyId);
        return {
          ...booking,
          property,
        };
      })
    );

    return bookingsWithProperties;
  },
});

export const confirmPayment = mutation({
  args: {
    bookingId: v.id("bookings"),
    transactionId: v.string(),
    amountPaid: v.number(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const isFullPayment = args.amountPaid >= booking.pricing.total;
    
    await ctx.db.patch(args.bookingId, {
      payment: {
        ...booking.payment,
        status: isFullPayment ? "paid" : "partial",
        amountPaid: args.amountPaid,
        transactionId: args.transactionId,
      },
      status: "confirmed",
    });

    // Remove temporary block and add permanent block
    const tempBlocks = await ctx.db
      .query("blockedDates")
      .withIndex("by_property", (q) => q.eq("propertyId", booking.propertyId))
      .filter((q) => q.eq(q.field("reason"), "sync_lock"))
      .collect();

    for (const block of tempBlocks) {
      await ctx.db.delete(block._id);
    }

    await ctx.db.insert("blockedDates", {
      propertyId: booking.propertyId,
      startDate: booking.checkIn,
      endDate: booking.checkOut,
      reason: "booked",
      bookingId: args.bookingId,
      isTemporary: false,
    });

    return booking;
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update booking status");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if user is the host of the property
    const property = await ctx.db.get(booking.propertyId);
    if (!property || property.hostId !== userId) {
      throw new Error("Not authorized to update this booking");
    }

    await ctx.db.patch(args.bookingId, {
      status: args.status,
    });

    return args.bookingId;
  },
});

// Internal functions for sync operations
export const getBookingForSync = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookingId);
  },
});

export const updateSyncStatus = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    syncStatus: v.union(v.literal("synced"), v.literal("pending"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      syncStatus: args.syncStatus,
    });
  },
});

export const findByPlatformId = internalQuery({
  args: {
    platformBookingId: v.string(),
    platform: v.union(
      v.literal("direct"),
      v.literal("airbnb"),
      v.literal("agoda"),
      v.literal("booking")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .filter((q) => q.eq(q.field("platformBookingId"), args.platformBookingId))
      .unique();
  },
});

export const createExternalBooking = internalMutation({
  args: {
    propertyId: v.id("properties"),
    platformBookingId: v.string(),
    platform: v.union(
      v.literal("airbnb"),
      v.literal("agoda"),
      v.literal("booking")
    ),
    checkIn: v.string(),
    checkOut: v.string(),
    guestDetails: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) return;

    // Calculate pricing (simplified)
    const nights = Math.ceil(
      (new Date(args.checkOut).getTime() - new Date(args.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const subtotal = property.pricing.basePrice * nights;
    const total = subtotal + property.pricing.cleaningFee + property.pricing.serviceFee;

    const bookingId = await ctx.db.insert("bookings", {
      propertyId: args.propertyId,
      guestId: property.hostId, // Temporary - would need proper guest management
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: { adults: 2, children: 0, pets: 0 }, // Default values
      pricing: {
        subtotal,
        cleaningFee: property.pricing.cleaningFee,
        serviceFee: property.pricing.serviceFee,
        total,
        currency: property.pricing.currency,
      },
      payment: {
        status: "paid",
        method: "external",
        amountPaid: total,
      },
      status: "confirmed",
      platform: args.platform,
      platformBookingId: args.platformBookingId,
      guestDetails: args.guestDetails,
      syncStatus: "synced",
    });

    // Block dates
    await ctx.db.insert("blockedDates", {
      propertyId: args.propertyId,
      startDate: args.checkIn,
      endDate: args.checkOut,
      reason: "booked",
      platform: args.platform,
      bookingId,
      isTemporary: false,
    });

    return bookingId;
  },
});
