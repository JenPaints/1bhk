import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    search: v.optional(v.string()),
    city: v.optional(v.string()),
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    guests: v.optional(v.number()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("properties");
    
    if (args.search) {
      const properties = await ctx.db
        .query("properties")
        .withSearchIndex("search_properties", (q) =>
          q.search("title", args.search!)
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(args.limit || 20);

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
    }
    
    const properties = await query
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(args.limit || 20);

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

export const getById = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;

    const imageUrls = await Promise.all(
      property.images.map(async (imageId) => {
        const url = await ctx.storage.getUrl(imageId);
        return url;
      })
    );

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", args.id))
      .collect();

    return {
      ...property,
      imageUrls: imageUrls.filter(Boolean),
      reviews,
    };
  },
});

export const create = mutation({
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

export const checkAvailability = internalQuery({
  args: {
    propertyId: v.id("properties"),
    checkIn: v.string(),
    checkOut: v.string(),
  },
  handler: async (ctx, args) => {
    const blockedDates = await ctx.db
      .query("blockedDates")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .filter((q) =>
        q.or(
          q.and(
            q.lte(q.field("startDate"), args.checkIn),
            q.gte(q.field("endDate"), args.checkIn)
          ),
          q.and(
            q.lte(q.field("startDate"), args.checkOut),
            q.gte(q.field("endDate"), args.checkOut)
          ),
          q.and(
            q.gte(q.field("startDate"), args.checkIn),
            q.lte(q.field("endDate"), args.checkOut)
          )
        )
      )
      .collect();

    return {
      available: blockedDates.length === 0,
      conflicts: blockedDates,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to upload images");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Internal functions for sync operations
export const getPropertyForSync = internalQuery({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.propertyId);
  },
});

export const getActiveProperties = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("properties")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
