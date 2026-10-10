import { describe, expect, it } from "vitest";
import {
  PLACEMENTS,
  absoluteMediaUrl,
  isActiveAt,
  normalizePromotion,
  validatePromotion,
} from "../../src/utils/promotion";

const valid = {
  placement: "home_hero",
  layout: "hero",
  theme: "brand",
  targetType: "none",
};

describe("promotion validation", () => {
  it("accepts a basic promotion", () =>
    expect(validatePromotion(valid)).toEqual([]));

  it("accepts every controlled marketing hero placement", () => {
    const heroPlacements = [
      "home_hero",
      "categories_hero",
      "category_hero",
      "products_hero",
      "shops_hero",
      "shop_hero",
      "catalogs_hero",
      "deals_hero",
      "compare_hero",
      "trade_in_hero",
      "help_hero",
      "search_hero",
      "promotion_page_hero",
    ];
    expect(
      heroPlacements.every((placement) =>
        PLACEMENTS.includes(placement as never),
      ),
    ).toBe(true);
    for (const placement of heroPlacements) {
      expect(validatePromotion({ ...valid, placement })).toEqual([]);
    }
  });

  it("rejects invalid scheduling and enum values", () => {
    const errors = validatePromotion({
      ...valid,
      placement: "somewhere",
      startsAt: "2026-09-26T00:00:00Z",
      endsAt: "2026-09-25T00:00:00Z",
    });
    expect(errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(["placement", "endsAt"]),
    );
  });

  it("requires destinations for labelled CTAs", () => {
    expect(
      validatePromotion({ ...valid, ctaLabel: "Shop now" }),
    ).toContainEqual({
      path: "targetType",
      message: "CTA label requires a destination",
    });
    expect(
      validatePromotion({
        ...valid,
        targetType: "external_url",
        externalUrl: "http://unsafe.test",
      }),
    ).toContainEqual({
      path: "externalUrl",
      message: "External CTA requires a valid HTTPS URL",
    });
  });

  it("requires content for rail layouts", () => {
    expect(
      validatePromotion({ ...valid, layout: "product_rail", products: [] })[0]
        .path,
    ).toBe("products");
    expect(
      validatePromotion({
        ...valid,
        layout: "shop_rail",
        shops: { connect: [] },
      })[0].path,
    ).toBe("shops");
    expect(
      validatePromotion({
        ...valid,
        layout: "product_grid",
        products: [{ active: true }],
      })[0].path,
    ).toBe("products");
    expect(
      validatePromotion({
        ...valid,
        layout: "product_grid",
        products: [{ active: true }, { active: true }],
      }),
    ).toEqual([]);
  });

  it("validates secondary CTAs and accepts promotion page targets", () => {
    expect(
      validatePromotion({ ...valid, secondaryCtaLabel: "Campaign" }),
    ).toContainEqual({
      path: "secondaryTargetType",
      message: "Secondary CTA label requires a destination",
    });
    expect(
      validatePromotion({
        ...valid,
        targetType: "promotion_page",
        targetValue: "back-to-school",
      }),
    ).toEqual([]);
  });
});

describe("promotion activity and normalization", () => {
  const now = new Date("2026-09-25T12:00:00Z");
  it("uses inclusive open schedule boundaries", () => {
    expect(isActiveAt({}, now)).toBe(true);
    expect(
      isActiveAt(
        { startsAt: now.toISOString(), endsAt: now.toISOString() },
        now,
      ),
    ).toBe(true);
    expect(isActiveAt({ startsAt: "2026-09-26T00:00:00Z" }, now)).toBe(false);
    expect(isActiveAt({ endsAt: "2026-09-24T00:00:00Z" }, now)).toBe(false);
  });

  it("creates absolute media URLs and exposes only the public shape", () => {
    expect(absoluteMediaUrl("/uploads/hero.webp", "https://cms.example")).toBe(
      "https://cms.example/uploads/hero.webp",
    );
    const normalized = normalizePromotion(
      {
        documentId: "doc_1",
        slug: "sale",
        headline: "Sale",
        placement: "home_hero",
        layout: "hero",
        theme: "brand",
        targetType: "category",
        targetValue: "phones",
        ctaLabel: "Shop",
        notes: "secret",
        desktopBackground: {
          url: "/uploads/hero.webp",
          alternativeText: "Hero",
        },
        products: [{ externalId: "1", slug: "phone" }],
        shops: [],
      },
      "https://cms.example",
    );
    expect(normalized.cta?.targetValue).toBe("phones");
    expect(normalized.desktopBackground?.alt).toBe("Hero");
    expect(normalized.targeting).toEqual({
      categorySlug: null,
      shopExternalId: null,
      brandSlug: null,
      campaignSlug: null,
    });
    expect(normalized.seo).toEqual({
      title: null,
      description: null,
      image: null,
    });
    expect(normalized).not.toHaveProperty("notes");
  });
});
