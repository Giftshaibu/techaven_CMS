export const PLACEMENTS = [
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
  "home_banner_1",
  "home_product_rail_1",
  "home_banner_2",
  "home_shop_rail",
  "home_inline_1",
  "category_inline_1",
  "category_inline_2",
  "search_inline_1",
  "deals_inline_1",
  "shops_inline_1",
  "shop_inline_1",
  "product_inline_1",
  "catalog_inline_1",
  "promotion_page_hero",
  "promotion_page_inline_1",
  "promotion_page_inline_2",
  "promotion_page_inline_3",
  "header_mega_menu",
  "site_announcement",
] as const;

export const LAYOUTS = [
  "hero",
  "hero_product",
  "split",
  "banner",
  "lifestyle_banner",
  "product_rail",
  "product_grid",
  "shop_rail",
  "service_grid",
  "card_rail",
  "flash_deals",
  "coupon",
  "editorial",
  "announcement",
] as const;

export const PRESENTATIONS = [
  "standard",
  "product_led",
  "lifestyle",
  "dark_editorial",
  "image_top",
  "image_side",
  "image_right",
  "background_image",
  "compact",
] as const;

export const THEMES = [
  "light",
  "dark",
  "brand",
  "brand_soft",
  "neutral",
] as const;

export const TARGET_TYPES = [
  "product",
  "shop",
  "category",
  "catalog",
  "search",
  "compare",
  "trade_in",
  "deals",
  "promotion_page",
  "internal_path",
  "external_url",
  "none",
] as const;

export type PromotionData = Record<string, unknown>;

export type FieldError = { path: string; message: string };

function relationCount(value: unknown): number {
  if (Array.isArray(value))
    return value.filter((item: any) => item?.active !== false).length;
  if (!value || typeof value !== "object") return 0;
  const relation = value as Record<string, unknown>;
  if (Array.isArray(relation.set)) return relation.set.length;
  if (Array.isArray(relation.connect)) return relation.connect.length;
  if (relation.id || relation.documentId || relation.externalId)
    return relation.active === false ? 0 : 1;
  return 0;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePromotion(data: PromotionData): FieldError[] {
  const errors: FieldError[] = [];
  const startsAt =
    typeof data.startsAt === "string" ? Date.parse(data.startsAt) : NaN;
  const endsAt =
    typeof data.endsAt === "string" ? Date.parse(data.endsAt) : NaN;

  if (!Number.isNaN(startsAt) && !Number.isNaN(endsAt) && endsAt <= startsAt) {
    errors.push({
      path: "endsAt",
      message: "End date must be later than start date",
    });
  }

  if (
    data.placement !== undefined &&
    !PLACEMENTS.includes(data.placement as never)
  ) {
    errors.push({ path: "placement", message: "Unknown promotion placement" });
  }
  if (data.layout !== undefined && !LAYOUTS.includes(data.layout as never)) {
    errors.push({ path: "layout", message: "Unknown promotion layout" });
  }
  if (
    data.presentation !== undefined &&
    !PRESENTATIONS.includes(data.presentation as never)
  ) {
    errors.push({
      path: "presentation",
      message: "Unknown promotion presentation",
    });
  }
  if (data.theme !== undefined && !THEMES.includes(data.theme as never)) {
    errors.push({ path: "theme", message: "Unknown promotion theme" });
  }
  if (
    data.targetType !== undefined &&
    !TARGET_TYPES.includes(data.targetType as never)
  ) {
    errors.push({ path: "targetType", message: "Unknown CTA target type" });
  }
  if (
    data.secondaryTargetType !== undefined &&
    !TARGET_TYPES.includes(data.secondaryTargetType as never)
  ) {
    errors.push({
      path: "secondaryTargetType",
      message: "Unknown secondary CTA target type",
    });
  }

  const label = typeof data.ctaLabel === "string" ? data.ctaLabel.trim() : "";
  const targetType =
    typeof data.targetType === "string" ? data.targetType : "none";
  const targetValue =
    typeof data.targetValue === "string" ? data.targetValue.trim() : "";
  const externalUrl =
    typeof data.externalUrl === "string" ? data.externalUrl.trim() : "";

  if (label && targetType === "none") {
    errors.push({
      path: "targetType",
      message: "CTA label requires a destination",
    });
  }
  if (targetType === "external_url" && !isHttpsUrl(externalUrl)) {
    errors.push({
      path: "externalUrl",
      message: "External CTA requires a valid HTTPS URL",
    });
  }
  if (targetType !== "none" && targetType !== "external_url" && !targetValue) {
    errors.push({
      path: "targetValue",
      message: "CTA destination value is required",
    });
  }
  if (data.layout === "product_rail" && relationCount(data.products) < 2) {
    errors.push({
      path: "products",
      message: "Product rail requires at least two active products",
    });
  }
  if (data.layout === "product_grid" && relationCount(data.products) < 2) {
    errors.push({
      path: "products",
      message: "Product grid requires at least two active products",
    });
  }
  if (data.layout === "shop_rail" && relationCount(data.shops) < 2) {
    errors.push({
      path: "shops",
      message: "Shop rail requires at least two active shops",
    });
  }
  if (data.layout === "hero_product" && relationCount(data.anchorProduct) < 1) {
    errors.push({
      path: "anchorProduct",
      message: "Product hero requires an active anchor product",
    });
  }
  if (
    ["split", "service_grid", "card_rail"].includes(String(data.layout)) &&
    !(typeof data.slotGroup === "string" && data.slotGroup.trim())
  ) {
    errors.push({
      path: "slotGroup",
      message: "Grouped promotion layout requires a slot group",
    });
  }
  if (data.layout === "flash_deals") {
    if (relationCount(data.products) < 2)
      errors.push({
        path: "products",
        message: "Flash deals require at least two active products",
      });
    if (!data.startsAt)
      errors.push({
        path: "startsAt",
        message: "Flash deals require a start date",
      });
    if (!data.endsAt)
      errors.push({
        path: "endsAt",
        message: "Flash deals require an end date",
      });
  }
  if (data.layout === "coupon") {
    const instructions = [
      data.instructionOne,
      data.instructionTwo,
      data.instructionThree,
    ].filter((value) => typeof value === "string" && value.trim()).length;
    if (
      !(typeof data.couponCode === "string" && data.couponCode.trim()) &&
      instructions < 2
    ) {
      errors.push({
        path: "couponCode",
        message: "Coupon layout requires a code or at least two instructions",
      });
    }
  }
  if (data.presentation === "background_image" && !data.desktopBackground) {
    errors.push({
      path: "desktopBackground",
      message: "Background-image presentation requires desktop artwork",
    });
  }
  const secondaryLabel =
    typeof data.secondaryCtaLabel === "string"
      ? data.secondaryCtaLabel.trim()
      : "";
  const secondaryType =
    typeof data.secondaryTargetType === "string"
      ? data.secondaryTargetType
      : "none";
  const secondaryValue =
    typeof data.secondaryTargetValue === "string"
      ? data.secondaryTargetValue.trim()
      : "";
  const secondaryExternal =
    typeof data.secondaryExternalUrl === "string"
      ? data.secondaryExternalUrl.trim()
      : "";
  if (secondaryLabel && secondaryType === "none")
    errors.push({
      path: "secondaryTargetType",
      message: "Secondary CTA label requires a destination",
    });
  if (secondaryType === "external_url" && !isHttpsUrl(secondaryExternal))
    errors.push({
      path: "secondaryExternalUrl",
      message: "Secondary external CTA requires a valid HTTPS URL",
    });
  if (
    secondaryType !== "none" &&
    secondaryType !== "external_url" &&
    !secondaryValue
  )
    errors.push({
      path: "secondaryTargetValue",
      message: "Secondary CTA destination value is required",
    });

  return errors;
}

export function isActiveAt(
  promotion: { startsAt?: string | null; endsAt?: string | null },
  now = new Date(),
): boolean {
  const timestamp = now.getTime();
  return (
    (!promotion.startsAt || Date.parse(promotion.startsAt) <= timestamp) &&
    (!promotion.endsAt || Date.parse(promotion.endsAt) >= timestamp)
  );
}

type Media =
  | { url?: string; alternativeText?: string | null }
  | null
  | undefined;

export function absoluteMediaUrl(url: string, publicUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, `${publicUrl.replace(/\/$/, "")}/`).toString();
}

export function normalizeMedia(
  media: Media,
  promotion: { altTextOverride?: string | null; headline: string },
  publicUrl: string,
) {
  if (!media?.url) return null;
  return {
    url: absoluteMediaUrl(media.url, publicUrl),
    alt:
      promotion.altTextOverride || media.alternativeText || promotion.headline,
  };
}

export function normalizePromotion(entity: any, publicUrl: string) {
  const targetType = entity.targetType || "none";
  const ctaTarget =
    targetType === "external_url" ? entity.externalUrl : entity.targetValue;
  const cta =
    entity.ctaLabel && targetType !== "none" && ctaTarget
      ? { label: entity.ctaLabel, targetType, targetValue: ctaTarget }
      : null;
  const mediaContext = {
    altTextOverride: entity.altTextOverride,
    headline: entity.headline,
  };
  const secondaryType = entity.secondaryTargetType || "none";
  const secondaryTarget =
    secondaryType === "external_url"
      ? entity.secondaryExternalUrl
      : entity.secondaryTargetValue;
  const secondaryCta =
    entity.secondaryCtaLabel && secondaryType !== "none" && secondaryTarget
      ? {
          label: entity.secondaryCtaLabel,
          targetType: secondaryType,
          targetValue: secondaryTarget,
        }
      : null;

  return {
    id: entity.documentId,
    slug: entity.slug,
    eyebrow: entity.eyebrow ?? null,
    headline: entity.headline,
    subheadline: entity.subheadline ?? null,
    body: entity.body ?? null,
    campaignIntro: entity.campaignIntro ?? null,
    badge: entity.badge ?? null,
    finePrint: entity.finePrint ?? null,
    placement: entity.placement,
    layout: entity.layout,
    presentation: entity.presentation || "standard",
    slotGroup: entity.slotGroup ?? null,
    groupOrder: entity.groupOrder ?? 0,
    imagePosition: entity.imagePosition || "right",
    theme: entity.theme,
    desktopBackground: normalizeMedia(
      entity.desktopBackground,
      mediaContext,
      publicUrl,
    ),
    mobileBackground: normalizeMedia(
      entity.mobileBackground,
      mediaContext,
      publicUrl,
    ),
    foregroundImage: normalizeMedia(
      entity.foregroundImage,
      mediaContext,
      publicUrl,
    ),
    cta,
    secondaryCta,
    commerceOfferKey: entity.commerceOfferKey ?? null,
    schedule: {
      startsAt: entity.startsAt ?? null,
      endsAt: entity.endsAt ?? null,
    },
    showCountdown: Boolean(entity.showCountdown),
    coupon: {
      code: entity.couponCode ?? null,
      instructions: [
        entity.instructionOne,
        entity.instructionTwo,
        entity.instructionThree,
      ].filter(Boolean),
    },
    targeting: {
      categorySlug: entity.targetCategorySlug ?? null,
      shopExternalId: entity.targetShopExternalId ?? null,
      brandSlug: entity.targetBrandSlug ?? null,
      campaignSlug: entity.targetCampaignSlug ?? null,
    },
    seo: {
      title: entity.seoTitle ?? null,
      description: entity.seoDescription ?? null,
      image: normalizeMedia(entity.seoImage, mediaContext, publicUrl),
    },
    productRefs: (entity.products || []).map(({ externalId, slug }: any) => ({
      externalId,
      slug,
    })),
    anchorProductRef: entity.anchorProduct
      ? {
          externalId: entity.anchorProduct.externalId,
          slug: entity.anchorProduct.slug,
        }
      : null,
    secondaryProductRefs: (entity.secondaryProducts || []).map(
      ({ externalId, slug }: any) => ({ externalId, slug }),
    ),
    shopRefs: (entity.shops || []).map(({ externalId, slug }: any) => ({
      externalId,
      slug,
    })),
  };
}
