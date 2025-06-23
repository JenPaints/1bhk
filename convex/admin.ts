import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getHostProperties = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    return properties;
  },
});

export const getHostBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get host's properties first
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    const propertyIds = properties.map(p => p._id);

    // Get all bookings for host's properties
    const allBookings = [];
    for (const propertyId of propertyIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .collect();
      
      const bookingsWithProperty = bookings.map(booking => ({
        ...booking,
        property: properties.find(p => p._id === booking.propertyId),
      }));
      
      allBookings.push(...bookingsWithProperty);
    }

    return allBookings.sort((a, b) => 
      new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    );
  },
});

export const getSyncLogs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get host's properties first
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    const propertyIds = properties.map(p => p._id);

    // Get sync logs for host's properties
    const allLogs = [];
    for (const propertyId of propertyIds) {
      const logs = await ctx.db
        .query("syncLogs")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .order("desc")
        .take(50);
      
      allLogs.push(...logs);
    }

    return allLogs.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get host's properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    const activeProperties = properties.filter(p => p.status === "active").length;

    // Get bookings for analytics
    const propertyIds = properties.map(p => p._id);
    const allBookings = [];
    
    for (const propertyId of propertyIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();
      
      allBookings.push(...bookings);
    }

    // Calculate metrics
    const totalRevenue = allBookings.reduce((sum, booking) => 
      sum + booking.pricing.total, 0
    );

    const totalRating = properties.reduce((sum, property) => 
      sum + (property.rating || 0), 0
    );
    const averageRating = properties.length > 0 ? 
      (totalRating / properties.length).toFixed(1) : "0.0";

    // Simple occupancy calculation (this would be more complex in real app)
    const occupancyRate = Math.floor(Math.random() * 30) + 60; // Mock data

    return {
      totalRevenue,
      occupancyRate,
      activeProperties,
      averageRating: parseFloat(averageRating),
      totalBookings: allBookings.length,
    };
  },
});

export const getHostAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    // Get host's properties
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();

    if (properties.length === 0) {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        occupancyRate: 0,
        totalBookings: 0,
        completedBookings: 0,
        averageRating: 0,
        reviewCount: 0,
      };
    }

    const propertyIds = properties.map(p => p._id);
    
    // Get all bookings for host's properties
    let allBookings = [];
    for (const propertyId of propertyIds) {
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .collect();
      
      allBookings.push(...bookings);
    }

    // Get all reviews for host's properties
    let allReviews = [];
    for (const propertyId of propertyIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
        .collect();
      
      allReviews.push(...reviews);
    }

    // Calculate metrics
    const completedBookings = allBookings.filter(b => b.status === "completed");
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.pricing.total, 0);
    
    // Calculate monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = completedBookings
      .filter(booking => {
        const bookingDate = new Date(booking.checkOut);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, booking) => sum + booking.pricing.total, 0);

    // Calculate occupancy rate
    const totalDays = properties.length * 365; // Total available days across all properties
    const bookedDays = allBookings
      .filter(b => b.status !== "cancelled")
      .reduce((sum, booking) => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
    
    const occupancyRate = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;

    // Calculate average rating
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      occupancyRate,
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: allReviews.length,
    };
  },
});

export const addProperty = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create property");
    }

    const propertyId = await ctx.db.insert("properties", {
      ...args,
      hostId: userId,
      status: "active",
      platformIds: {},
      reviewCount: 0,
    });

    return propertyId;
  },
});

export const updatePropertyStatus = mutation({
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

export const getPropertyListings = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db
      .query("properties")
      .withIndex("by_host", (q) => q.eq("hostId", userId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const properties = await query.take(args.limit || 50);

    // Get images for each property
    const propertiesWithImages = await Promise.all(
      properties.map(async (property) => {
        const imageUrls = await Promise.all(
          property.images.map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );
        return {
          ...property,
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );

    return propertiesWithImages;
  },
});
