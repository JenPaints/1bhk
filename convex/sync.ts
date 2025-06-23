import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Multi-platform synchronization system
export const syncBookingAcrossPlatforms = internalAction({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.runQuery(internal.bookings.getBookingForSync, {
      bookingId: args.bookingId,
    });

    if (!booking) return;

    const property = await ctx.runQuery(internal.properties.getPropertyForSync, {
      propertyId: booking.propertyId,
    });

    if (!property) return;

    // Sync to all connected platforms
    const platforms = ["airbnb", "agoda", "booking"] as const;
    
    for (const platform of platforms) {
      const platformId = property.platformIds[platform];
      if (platformId) {
        try {
          await syncToExternalPlatform(platform, {
            propertyId: platformId,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            action: "block_dates",
          });

          await ctx.runMutation(internal.sync.logSyncActivity, {
            propertyId: booking.propertyId,
            platform,
            action: "booking_sync",
            status: "success",
            details: `Successfully blocked dates for booking ${args.bookingId}`,
          });
        } catch (error) {
          await ctx.runMutation(internal.sync.logSyncActivity, {
            propertyId: booking.propertyId,
            platform,
            action: "booking_sync",
            status: "failed",
            details: `Failed to sync booking ${args.bookingId}`,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    // Update booking sync status
    await ctx.runMutation(internal.bookings.updateSyncStatus, {
      bookingId: args.bookingId,
      syncStatus: "synced",
    });
  },
});

export const syncExternalBooking = internalAction({
  args: {
    platform: v.union(v.literal("airbnb"), v.literal("agoda"), v.literal("booking")),
    platformBookingId: v.string(),
    platformPropertyId: v.string(),
    checkIn: v.string(),
    checkOut: v.string(),
    guestDetails: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Find the property by platform ID
    const properties = await ctx.runQuery(internal.properties.getActiveProperties, {});
    const property = properties.find(p => 
      p.platformIds[args.platform] === args.platformPropertyId
    );

    if (!property) {
      // Can't log without a valid property ID, so just return
      return;
    }

    // Check if booking already exists
    const existingBooking = await ctx.runQuery(internal.bookings.findByPlatformId, {
      platformBookingId: args.platformBookingId,
      platform: args.platform,
    });

    if (existingBooking) {
      return; // Booking already synced
    }

    // Create the external booking
    const bookingId = await ctx.runMutation(internal.bookings.createExternalBooking, {
      propertyId: property._id,
      platformBookingId: args.platformBookingId,
      platform: args.platform,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guestDetails: args.guestDetails,
    });

    if (bookingId) {
      // Sync to other platforms
      await ctx.scheduler.runAfter(0, internal.sync.syncBookingAcrossPlatforms, {
        bookingId,
      });

      await ctx.runMutation(internal.sync.logSyncActivity, {
        propertyId: property._id,
        platform: args.platform,
        action: "booking_sync",
        status: "success",
        details: `External booking ${args.platformBookingId} synced successfully`,
      });
    }
  },
});

export const logSyncActivity = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", args);
  },
});

// Mock external platform sync function
async function syncToExternalPlatform(
  platform: "airbnb" | "agoda" | "booking",
  data: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    action: string;
  }
) {
  // In a real implementation, this would make API calls to external platforms
  // For now, we'll simulate the sync with a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures for testing
  if (Math.random() < 0.1) {
    throw new Error(`${platform} API temporarily unavailable`);
  }
  
  return { success: true };
}
