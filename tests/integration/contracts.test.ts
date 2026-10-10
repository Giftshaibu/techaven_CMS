import { describe, expect, it } from "vitest";
import promotionRoutes from "../../src/api/promotion/routes/promotion";
import syncRoutes from "../../src/api/catalog-sync/routes/catalog-sync";
import promotionSchema from "../../src/api/promotion/content-types/promotion/schema.json";

describe("HTTP and schema security contracts", () => {
  it("exposes only normalized public promotion reads", () => {
    expect(
      promotionRoutes.routes.map(({ method, path }) => `${method} ${path}`),
    ).toEqual([
      "GET /promotions/preview/:documentId",
      "GET /promotions/active",
      "GET /promotions/:slug",
    ]);
  });

  it("protects both sync routes with the token policy", () => {
    for (const route of syncRoutes.routes)
      expect(route.config.policies).toContain("global::sync-token");
  });

  it("keeps editor notes private and draft/publish enabled", () => {
    expect(promotionSchema.options.draftAndPublish).toBe(true);
    expect(promotionSchema.attributes.notes.private).toBe(true);
  });
});
