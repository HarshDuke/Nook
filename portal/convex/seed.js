import { internalMutationGeneric } from "convex/server";
import { examples } from "./examples";
export const skyHarbour = internalMutationGeneric({
  args: {},
  handler: async ({ db }) => {
    for (const report of examples) {
      const existing = await db
        .query("reports")
        .withIndex("company", (q) => q.eq("company", report.company))
        .collect();
      if (
        !existing.some(
          (r) => r.site === report.site && r.version === report.version,
        )
      )
        await db.insert("reports", { ...report, shared: false });
    }
  },
});
