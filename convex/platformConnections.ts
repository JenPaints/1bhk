import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Get platform connections for a host
export const getPlatformConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get host's properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    // If no properties, return empty connections
    if (properties.length === 0) {
      return {
        airbnb: { connected: false, lastSync: null as null | number },
        booking: { connected: false, lastSync: null as null | number },
        agoda: { connected: false, lastSync: null as null | number },
      };
    }

    // Check if any property has platform connections
    const connections = {
      airbnb: { connected: false, lastSync: null as null | number },
      booking: { connected: false, lastSync: null as null | number },
      agoda: { connected: false, lastSync: null as null | number },
    };

    // Check each property for platform connections
    for (const property of properties) {
      if (property.platformIds.airbnb) {
        connections.airbnb.connected = true;
      }
      if (property.platformIds.booking) {
        connections.booking.connected = true;
      }
      if (property.platformIds.agoda) {
        connections.agoda.connected = true;
      }
    }

    // Get the latest sync logs for each platform
    const syncLogs = await ctx.db
      .query("syncLogs")
      .filter((q) => q.eq(q.field("propertyId"), properties[0]._id))
      .order("desc")
      .collect();

    // Update last sync time for each platform
    for (const log of syncLogs) {
      if (log.platform === "airbnb" && connections.airbnb.connected && connections.airbnb.lastSync === null) {
        connections.airbnb.lastSync = log._creationTime;
      }
      if (log.platform === "booking" && connections.booking.connected && connections.booking.lastSync === null) {
        connections.booking.lastSync = log._creationTime;
      }
      if (log.platform === "agoda" && connections.agoda.connected && connections.agoda.lastSync === null) {
        connections.agoda.lastSync = log._creationTime;
      }
    }

    return connections;
  },
});

// Connect a property to a platform
export const connectPlatform = mutation({
  args: {
    propertyId: v.id("properties"),
    platform: v.union(v.literal("airbnb"), v.literal("booking"), v.literal("agoda")),
    platformPropertyId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to connect platform");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to connect platform for this property");
    }

    // Update the property with the platform ID
    const platformIds = { ...property.platformIds };
    platformIds[args.platform] = args.platformPropertyId;

    await ctx.db.patch(args.propertyId, {
      platformIds,
    });

    // Log the connection activity
    await ctx.db.insert("syncLogs", {
      propertyId: args.propertyId,
      platform: args.platform,
      action: "calendar_update",
      status: "success",
      details: `Connected to ${args.platform} with ID ${args.platformPropertyId}`,
    });

    return true;
  },
});

// Disconnect a property from a platform
export const disconnectPlatform = mutation({
  args: {
    propertyId: v.id("properties"),
    platform: v.union(v.literal("airbnb"), v.literal("booking"), v.literal("agoda")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to disconnect platform");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to disconnect platform for this property");
    }

    // Update the property by removing the platform ID
    const platformIds = { ...property.platformIds };
    delete platformIds[args.platform];

    await ctx.db.patch(args.propertyId, {
      platformIds,
    });

    // Log the disconnection activity
    await ctx.db.insert("syncLogs", {
      propertyId: args.propertyId,
      platform: args.platform,
      action: "calendar_update",
      status: "success",
      details: `Disconnected from ${args.platform}`,
    });

    return true;
  },
});

// Sync a property with all connected platforms
export const syncProperty = mutation({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to sync property");
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    if (property.hostId !== userId) {
      throw new Error("Not authorized to sync this property");
    }

    // Get all bookings for this property
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    // For each connected platform, log a sync activity
    const platforms = ["airbnb", "booking", "agoda"] as const;
    const syncResults = [];

    for (const platform of platforms) {
      if (property.platformIds[platform]) {
        try {
          // In a real implementation, this would make API calls to external platforms
          // For now, we'll simulate the sync with a delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Log successful sync
          const logId = await ctx.db.insert("syncLogs", {
            propertyId: args.propertyId,
            platform,
            action: "calendar_update",
            status: "success",
            details: `Successfully synced calendar with ${platform}`,
          });

          syncResults.push({
            platform,
            success: true,
            logId,
          });
        } catch (error) {
          // Log failed sync
          const logId = await ctx.db.insert("syncLogs", {
            propertyId: args.propertyId,
            platform,
            action: "calendar_update",
            status: "failed",
            details: `Failed to sync calendar with ${platform}`,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          syncResults.push({
            platform,
            success: false,
            logId,
          });
        }
      }
    }

    return syncResults;
  },
});