import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Clean up expired temporary blocks
export const cleanupExpiredBlocks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expiredBlocks = await ctx.db
      .query("blockedDates")
      .withIndex("by_temporary", (q) => q.eq("isTemporary", true))
      .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
      .collect();

    for (const block of expiredBlocks) {
      await ctx.db.delete(block._id);
    }

    console.log(`Cleaned up ${expiredBlocks.length} expired temporary blocks`);
  },
});

const crons = cronJobs();

// Run cleanup every 5 minutes
crons.interval("cleanup expired blocks", { minutes: 5 }, internal.crons.cleanupExpiredBlocks, {});

export default crons;
