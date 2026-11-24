import type { ComponentType } from "react";
import type { StrapiApp } from "@strapi/strapi/admin";

export default {
  register(app: StrapiApp) {
    app.customFields.register({
      name: "promotion-products",
      type: "json",
      intlLabel: { id: "promotion-products.label", defaultMessage: "Rail products" },
      intlDescription: { id: "promotion-products.description", defaultMessage: "Select and order products for a homepage banner with rail." },
      components: {
        Input: async () => ({
          default: (await import("./PromotionProductsInput")).default as unknown as ComponentType,
        }),
      },
    });
  },
};
