import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      // Return null if no profile exists - will be created by mutation
      return null;
    }

    return profile;
  },
});

export const createUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) return existingProfile;

    // Create default profile
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const newProfile = await ctx.db.insert("userProfiles", {
        userId,
        firstName: user.name?.split(" ")[0] || "Guest",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
        loyaltyTier: "Green",
        loyaltyPoints: 0,
        totalBookings: 0,
        isHost: false,
        preferences: {
          currency: "INR",
          language: "en",
          notifications: {
            email: true,
            sms: false,
            whatsapp: false,
          },
        },
      });

      return await ctx.db.get(newProfile);
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    preferences: v.object({
      currency: v.string(),
      language: v.string(),
      notifications: v.object({
        email: v.boolean(),
        sms: v.boolean(),
        whatsapp: v.boolean(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update profile");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, args);
    return profile._id;
  },
});

export const addLoyaltyPoints = internalMutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
    bookingAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return;

    const newPoints = profile.loyaltyPoints + args.points;
    const newBookingCount = profile.totalBookings + 1;

    // Determine new tier
    let newTier = profile.loyaltyTier;
    if (newPoints >= 800) {
      newTier = "Elite";
    } else if (newPoints >= 300) {
      newTier = "Emerald";
    }

    await ctx.db.patch(profile._id, {
      loyaltyPoints: newPoints,
      totalBookings: newBookingCount,
      loyaltyTier: newTier,
    });
  },
});
