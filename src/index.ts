import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { validatePromotion } from "./utils/promotion";
import { seedDefaultPromotions } from "./seed/default-promotions";

const PROMOTION_UID = "api::promotion.promotion";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context, next) => {
      if (
        context.uid !== PROMOTION_UID ||
        !["create", "update", "publish"].includes(context.action)
      ) {
        return next();
      }

      const params = context.params as any;
      let existing: Record<string, unknown> = {};
      if (params.documentId) {
        existing =
          ((await strapi.documents(PROMOTION_UID).findOne({
            documentId: params.documentId,
            status: "draft",
            populate: [
              "products",
              "secondaryProducts",
              "anchorProduct",
              "shops",
            ],
          } as any)) as any) || {};
      }
      const data = { ...existing, ...(params.data || {}) };
      const fieldErrors = validatePromotion(data);
      if (fieldErrors.length) {
        strapi.log.warn(
          JSON.stringify({
            event: "promotion_validation_failed",
            fields: fieldErrors.map(({ path }) => path),
          }),
        );
        throw new errors.ValidationError("Promotion validation failed", {
          errors: fieldErrors,
        });
      }
      return next();
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.STRAPI_SYNC_TOKEN
    ) {
      throw new Error("STRAPI_SYNC_TOKEN is required in production");
    }
    if (process.env.CATALOG_RECONCILIATION_ENABLED === "true") {
      const missing = [
        "TECHAVEN_COMMERCE_API_URL",
        "TECHAVEN_COMMERCE_API_TOKEN",
      ].filter((key) => !process.env[key]);
      if (missing.length)
        throw new Error(
          `Reconciliation enabled but missing: ${missing.join(", ")}`,
        );
    }
    if (process.env.RESET_LEGACY_CATALOG_ON_BOOT === "true") {
      await strapi.service('api::catalog-sync.catalog-sync').resetLegacyProducts();
    }
    const placementMap: Record<string, string> = {
      home_banner: "home_banner_1",
      home_product_rail: "home_product_rail_1",
      home_inline: "home_inline_1",
      category_inline: "category_inline_1",
      search_inline: "search_inline_1",
      deals_inline: "deals_inline_1",
      shop_inline: "shop_inline_1",
    };
    for (const [legacy, current] of Object.entries(placementMap)) {
      await strapi.db
        .query(PROMOTION_UID)
        .updateMany({
          where: { placement: legacy },
          data: { placement: current },
        });
    }
    const migrationStore = strapi.store({
      type: "core",
      name: "techaven-promotions",
    });
    const presentationMigration = "promotion-presentation-and-groups-v1";
    if (!(await migrationStore.get({ key: presentationMigration }))) {
      await strapi.db.query(PROMOTION_UID).updateMany({
        where: { layout: "split", presentation: { $null: true } },
        data: { presentation: "image_top" },
      });
      for (const [slug, groupOrder] of [
        ["starter-compare-devices", 1],
        ["starter-trade-in", 2],
      ] as const) {
        await strapi.db.query(PROMOTION_UID).updateMany({
          where: { slug, slotGroup: { $null: true } },
          data: { slotGroup: "home-upgrade-pair", groupOrder },
        });
      }
      await migrationStore.set({
        key: presentationMigration,
        value: { completedAt: new Date().toISOString() },
      });
      strapi.log.info(
        JSON.stringify({
          event: "promotion_data_migration_complete",
          migration: presentationMigration,
        }),
      );
    }
    if (process.env.SEED_DEFAULT_PROMOTIONS === "true")
      await seedDefaultPromotions(strapi);
    const publicRole = await strapi.db
      .query("plugin::users-permissions.role")
      .findOne({
        where: { type: "public" },
      });
    if (publicRole) {
      await strapi.db.query("plugin::users-permissions.permission").deleteMany({
        where: {
          action: "plugin::users-permissions.auth.register",
          role: publicRole.id,
        },
      });
    }
    strapi.log.info(JSON.stringify({ event: "techaven_promotions_ready" }));
  },
};
