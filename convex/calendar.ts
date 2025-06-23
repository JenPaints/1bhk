import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getHostCalendar = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get host's properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    const propertyIds = properties.map(p => p._id);

    // Get all bookings for the month across all properties
    const startDate = new Date(args.year, args.month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(args.year, args.month, 0).toISOString().split('T')[0];

    const allBookings = [];
    const allBlocks = [];

    for (const propertyId of propertyIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .filter((q) => 
          q.and(
            q.lte(q.field("checkIn"), endDate),
            q.gte(q.field("checkOut"), startDate),
            q.neq(q.field("status"), "cancelled")
          )
        )
        .collect();

      const blocks = await ctx.db
        .query("blockedDates")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .filter((q) => 
          q.and(
            q.lte(q.field("startDate"), endDate),
            q.gte(q.field("endDate"), startDate)
          )
        )
        .collect();

      allBookings.push(...bookings.map(b => ({ ...b, property: properties.find(p => p._id === propertyId) })));
      allBlocks.push(...blocks.map(b => ({ ...b, property: properties.find(p => p._id === propertyId) })));
    }

    return {
      bookings: allBookings,
      blocks: allBlocks,
      properties,
    };
  },
});

export const bulkBlockDates = mutation({
  args: {
    propertyIds: v.array(v.id("properties")),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.union(v.literal("maintenance"), v.literal("owner_block")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to block dates");
    }

    // Verify ownership of all properties
    for (const propertyId of args.propertyIds) {
      const property = await ctx.db.get(propertyId);
      if (!property || property.hostId !== userId) {
        throw new Error("Not authorized to block dates for one or more properties");
      }
    }

    // Create blocks for all properties
    for (const propertyId of args.propertyIds) {
      await ctx.db.insert("blockedDates", {
        propertyId,
        startDate: args.startDate,
        endDate: args.endDate,
        reason: args.reason,
        isTemporary: false,
      });
    }

    return true;
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get host's properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    const propertyIds = properties.map(p => p._id);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const upcomingEvents: Array<{
      type: "check-in" | "check-out";
      date: string;
      property?: string;
      guest: string;
      booking: any;
    }> = [];

    for (const propertyId of propertyIds) {
      // Check-ins
      const checkIns = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .filter((q) => 
          q.and(
            q.gte(q.field("checkIn"), today),
            q.lte(q.field("checkIn"), nextWeek),
            q.eq(q.field("status"), "confirmed")
          )
        )
        .collect();

      // Check-outs
      const checkOuts = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .filter((q) => 
          q.and(
            q.gte(q.field("checkOut"), today),
            q.lte(q.field("checkOut"), nextWeek),
            q.eq(q.field("status"), "confirmed")
          )
        )
        .collect();

      const property = properties.find(p => p._id === propertyId);

      checkIns.forEach(booking => {
        upcomingEvents.push({
          type: "check-in",
          date: booking.checkIn,
          property: property?.title,
          guest: booking.guestDetails.name,
          booking,
        });
      });

      checkOuts.forEach(booking => {
        upcomingEvents.push({
          type: "check-out",
          date: booking.checkOut,
          property: property?.title,
          guest: booking.guestDetails.name,
          booking,
        });
      });
    }

    return upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
});
