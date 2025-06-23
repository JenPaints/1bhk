import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updateProperty = mutation({
  args: {
    propertyId: v.id("properties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.object({
      address: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
    })),
    amenities: v.optional(v.array(v.string())),
    pricing: v.optional(v.object({
      basePrice: v.number(),
      cleaningFee: v.number(),
      serviceFee: v.number(),
      currency: v.string(),
    })),
    capacity: v.optional(v.object({
      maxGuests: v.number(),
      bedrooms: v.number(),
      bathrooms: v.number(),
      beds: v.number(),
    })),
    rules: v.optional(v.object({
      checkIn: v.string(),
      checkOut: v.string(),
      allowsPets: v.boolean(),
      allowsSmoking: v.boolean(),
      allowsParties: v.boolean(),
    })),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update property");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to update this property");
    }

    const updateData: any = {};
    Object.keys(args).forEach(key => {
      if (key !== "propertyId" && args[key as keyof typeof args] !== undefined) {
        updateData[key] = args[key as keyof typeof args];
      }
    });

    await ctx.db.patch(args.propertyId, updateData);
    return args.propertyId;
  },
});

export const deleteProperty = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to delete property");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to delete this property");
    }

    // Check for active bookings
    const activeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    if (activeBookings.length > 0) {
      throw new Error("Cannot delete property with active bookings");
    }

    await ctx.db.delete(args.propertyId);
    return true;
  },
});

export const togglePropertyStatus = mutation({
  args: { 
    propertyId: v.id("properties"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update property status");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to update this property");
    }

    await ctx.db.patch(args.propertyId, { status: args.status });
    return args.propertyId;
  },
});

export const getPropertyAnalytics = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.hostId !== userId) {
      return null;
    }

    // Get bookings for this property
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const completedBookings = bookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.pricing.total, 0);
    
    // Calculate occupancy rate (simplified)
    const currentYear = new Date().getFullYear();
    const daysInYear = 365;
    const bookedDays = bookings.filter(b => 
      new Date(b.checkIn).getFullYear() === currentYear
    ).reduce((sum, booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    const occupancyRate = Math.round((bookedDays / daysInYear) * 100);

    // Get reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return {
      totalRevenue,
      occupancyRate,
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
      monthlyRevenue: completedBookings
        .filter(b => new Date(b.checkIn).getMonth() === new Date().getMonth())
        .reduce((sum, booking) => sum + booking.pricing.total, 0),
    };
  },
});

export const blockDates = mutation({
  args: {
    propertyId: v.id("properties"),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.union(v.literal("maintenance"), v.literal("owner_block")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to block dates");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.hostId !== userId) {
      throw new Error("Not authorized to block dates for this property");
    }

    await ctx.db.insert("blockedDates", {
      propertyId: args.propertyId,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      isTemporary: false,
    });

    return true;
  },
});

export const unblockDates = mutation({
  args: { blockId: v.id("blockedDates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to unblock dates");
    }

    const block = await ctx.db.get(args.blockId);
    if (!block) {
      throw new Error("Block not found");
    }

    const property = await ctx.db.get(block.propertyId);
    if (!property || property.hostId !== userId) {
      throw new Error("Not authorized to unblock dates for this property");
    }

    if (block.reason === "booked") {
      throw new Error("Cannot unblock dates that are booked");
    }

    await ctx.db.delete(args.blockId);
    return true;
  },
});

export const getPropertyCalendar = query({
  args: { 
    propertyId: v.id("properties"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.hostId !== userId) {
      return null;
    }

    // Get blocked dates for the month
    const startDate = new Date(args.year, args.month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(args.year, args.month, 0).toISOString().split('T')[0];

    const blockedDates = await ctx.db
      .query("blockedDates")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => 
        q.and(
          q.lte(q.field("startDate"), endDate),
          q.gte(q.field("endDate"), startDate)
        )
      )
      .collect();

    // Get bookings for the month
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => 
        q.and(
          q.lte(q.field("checkIn"), endDate),
          q.gte(q.field("checkOut"), startDate),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .collect();

    return {
      blockedDates,
      bookings,
      property,
    };
  },
});

export const updatePricing = mutation({
  args: {
    propertyId: v.id("properties"),
    basePrice: v.number(),
    cleaningFee: v.number(),
    serviceFee: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update pricing");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.hostId !== userId) {
      throw new Error("Not authorized to update pricing for this property");
    }

    await ctx.db.patch(args.propertyId, {
      pricing: {
        ...property.pricing,
        basePrice: args.basePrice,
        cleaningFee: args.cleaningFee,
        serviceFee: args.serviceFee,
      },
    });

    return true;
  },
});
