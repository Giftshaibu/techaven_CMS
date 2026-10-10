import { PLACEMENTS, normalizePromotion } from "../../../utils/promotion";
import {
  type PreviewStatus,
  verifyPromotionPreview,
} from "../../../utils/promotion-preview";

const CACHE_CONTROL =
  "public, max-age=30, s-maxage=120, stale-while-revalidate=300";

function publicUrl(strapi: any): string {
  return (
    strapi.config.get("server.absoluteUrl") ||
    strapi.config.get("server.url") ||
    `http://localhost:${strapi.config.get("server.port", 1337)}`
  );
}

export default {
  async preview(ctx: any) {
    const documentId = String(ctx.params.documentId || "");
    const status: PreviewStatus =
      ctx.query.status === "published" ? "published" : "draft";
    const expires = Number(ctx.query.expires);
    const signature =
      typeof ctx.query.signature === "string" ? ctx.query.signature : "";
    const secret =
      process.env.PREVIEW_SECRET || process.env.ADMIN_JWT_SECRET || "";

    if (
      !verifyPromotionPreview(documentId, status, expires, signature, secret)
    ) {
      strapi.log.warn(
        JSON.stringify({ event: "promotion_preview_rejected", documentId }),
      );
      return ctx.unauthorized("Invalid or expired promotion preview");
    }

    const entity = await strapi
      .service("api::promotion.promotion")
      .findPreviewByDocumentId(documentId, status);
    if (!entity) return ctx.notFound("Promotion preview not found");

    ctx.set("Cache-Control", "private, no-store");
    ctx.body = { data: normalizePromotion(entity, publicUrl(strapi)) };
  },

  async active(ctx: any) {
    const placement = ctx.query.placement;
    if (
      placement !== undefined &&
      (typeof placement !== "string" ||
        !PLACEMENTS.includes(placement as never))
    ) {
      return ctx.badRequest("Unknown promotion placement", {
        field: "placement",
      });
    }

    try {
      const entities = await strapi
        .service("api::promotion.promotion")
        .findActive(placement);
      ctx.set("Cache-Control", CACHE_CONTROL);
      ctx.body = {
        data: entities.map((entity: any) =>
          normalizePromotion(entity, publicUrl(strapi)),
        ),
      };
    } catch (error) {
      strapi.log.error(
        JSON.stringify({
          event: "promotion_api_error",
          route: "active",
          message: (error as Error).message,
        }),
      );
      throw error;
    }
  },

  async findBySlug(ctx: any) {
    try {
      const entity = await strapi
        .service("api::promotion.promotion")
        .findActiveBySlug(ctx.params.slug);
      if (!entity) return ctx.notFound("Promotion not found");
      ctx.set("Cache-Control", CACHE_CONTROL);
      ctx.body = { data: normalizePromotion(entity, publicUrl(strapi)) };
    } catch (error) {
      strapi.log.error(
        JSON.stringify({
          event: "promotion_api_error",
          route: "slug",
          message: (error as Error).message,
        }),
      );
      throw error;
    }
  },
};
