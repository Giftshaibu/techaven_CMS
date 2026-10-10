import { writeFile, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

const UID = "api::promotion.promotion";
const STARTER_MARKER = "starter-owned:v2";
const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=84&w=1600`;

const defaults: Array<Record<string, any> & { imageUrl?: string }> = [
  {
    internalName: "Starter — Home marketplace hero",
    slug: "starter-home-marketplace-hero",
    headline: "Every electronics shop in one place.",
    subheadline:
      "Phones, laptops, audio and home electronics from verified Malawian shops, with comparison, trade-in and buyer protection built in.",
    placement: "home_hero",
    layout: "hero",
    presentation: "product_led",
    imagePosition: "right",
    theme: "brand_soft",
    ctaLabel: "View all products",
    targetType: "internal_path",
    targetValue: "/products",
    secondaryCtaLabel: "Shop the deals",
    secondaryTargetType: "deals",
    secondaryTargetValue: "/deals",
    priority: 80,
    imageUrl: image("photo-1498049794561-7780e7231661"),
  },
  {
    internalName: "Starter — Compare page hero",
    slug: "starter-compare-devices",
    headline: "Compare the details that matter.",
    subheadline:
      "Put two to four phones side by side and see exactly what changes.",
    placement: "compare_hero",
    layout: "hero",
    presentation: "dark_editorial",
    slotGroup: null,
    groupOrder: 0,
    theme: "dark",
    ctaLabel: "Compare phones",
    targetType: "compare",
    targetValue: "/compare",
    priority: 60,
    imageUrl: image("photo-1523206489230-c012c64b2b48"),
  },
  {
    internalName: "Starter — Work and study setup",
    slug: "starter-trade-in",
    headline: "Build a setup that works as hard as you do.",
    subheadline:
      "Find laptops, audio and accessories for study, work and everything between.",
    placement: "home_banner_1",
    layout: "split",
    presentation: "image_top",
    slotGroup: "home-upgrade-pair",
    groupOrder: 2,
    theme: "neutral",
    ctaLabel: "Browse all products",
    targetType: "internal_path",
    targetValue: "/products",
    priority: 69,
    imageUrl: image("photo-1601784551446-20c9e07cdbdb"),
  },
  {
    internalName: "Starter — Student savings",
    slug: "starter-student-savings",
    headline: "Set up for the new term.",
    subheadline:
      "Browse practical tech for study, work and everything between.",
    placement: "home_banner_2",
    layout: "card_rail",
    presentation: "image_top",
    slotGroup: "home-ways-to-save",
    groupOrder: 1,
    theme: "brand_soft",
    ctaLabel: "Browse laptops",
    targetType: "category",
    targetValue: "laptops",
    priority: 55,
    imageUrl: image("photo-1496181133206-80ce9b88a853"),
  },
  {
    internalName: "Starter — Audio offers",
    slug: "starter-audio-offers",
    headline: "Better sound for less.",
    subheadline: "Headphones and speakers from shops across Techaven.",
    placement: "home_banner_2",
    layout: "card_rail",
    presentation: "image_top",
    slotGroup: "home-ways-to-save",
    groupOrder: 2,
    theme: "neutral",
    ctaLabel: "Browse audio",
    targetType: "category",
    targetValue: "audio",
    priority: 54,
    imageUrl: image("photo-1505740420928-5e560c06d30e"),
  },
  {
    internalName: "Starter — Shop the mall",
    slug: "starter-shop-the-mall",
    headline: "Find a shop that knows your tech.",
    subheadline: "Browse specialist storefronts and their live listings.",
    placement: "home_banner_2",
    layout: "card_rail",
    presentation: "image_top",
    slotGroup: "home-ways-to-save",
    groupOrder: 3,
    theme: "light",
    ctaLabel: "Browse shops",
    targetType: "internal_path",
    targetValue: "/shops",
    priority: 53,
    imageUrl: image("photo-1550009158-9ebf69173e03"),
  },
  {
    internalName: "Starter — Shopping support",
    slug: "starter-service-trade-in",
    headline: "Get help before and after you buy.",
    subheadline:
      "Understand delivery, warranties and buyer protection in one place.",
    placement: "home_inline_1",
    layout: "service_grid",
    presentation: "image_top",
    slotGroup: "home-services",
    groupOrder: 1,
    theme: "brand_soft",
    ctaLabel: "Visit help centre",
    targetType: "internal_path",
    targetValue: "/help",
    priority: 50,
    imageUrl: image("photo-1601784551446-20c9e07cdbdb"),
  },
  {
    internalName: "Starter — Buyer protection",
    slug: "starter-service-protection",
    headline: "Shop with buyer protection.",
    subheadline: "Clear shop information and a checkout designed around trust.",
    placement: "home_inline_1",
    layout: "service_grid",
    presentation: "image_top",
    slotGroup: "home-services",
    groupOrder: 2,
    theme: "neutral",
    ctaLabel: "How Techaven works",
    targetType: "internal_path",
    targetValue: "/help",
    priority: 49,
    imageUrl: image("photo-1563013544-824ae1b704d3"),
  },
  {
    internalName: "Starter — Delivery",
    slug: "starter-service-delivery",
    headline: "Delivery that fits the shop.",
    subheadline:
      "See delivery and collection choices before you complete checkout.",
    placement: "home_inline_1",
    layout: "service_grid",
    presentation: "image_top",
    slotGroup: "home-services",
    groupOrder: 3,
    theme: "light",
    ctaLabel: "Browse products",
    targetType: "internal_path",
    targetValue: "/products",
    priority: 48,
    imageUrl: image("photo-1580674285054-bed31e145f59"),
  },
  {
    internalName: "Starter — Category discovery",
    slug: "starter-category-trade-in",
    headline: "More choice from specialist shops",
    subheadline:
      "Explore live listings and find the model that fits how you use it.",
    placement: "category_inline_2",
    layout: "banner",
    presentation: "image_right",
    theme: "brand_soft",
    ctaLabel: "Browse products",
    targetType: "internal_path",
    targetValue: "/products",
    priority: 50,
    imageUrl: image("photo-1601784551446-20c9e07cdbdb"),
  },
  {
    internalName: "Starter — Deals hero",
    slug: "starter-deals-hero",
    headline: "Hot sales & special offers",
    subheadline: "Current offers from live Techaven shop listings.",
    placement: "deals_hero",
    layout: "lifestyle_banner",
    presentation: "background_image",
    imagePosition: "background",
    theme: "dark",
    targetType: "none",
    priority: 50,
    imageUrl: image("photo-1607083206968-13611e3d76db"),
  },
  {
    internalName: "Starter — Header delivery notice",
    slug: "starter-header-delivery",
    headline: "Free delivery on orders over MWK 900,000",
    placement: "site_announcement",
    layout: "announcement",
    presentation: "compact",
    theme: "dark",
    ctaLabel: "See this week's deals",
    targetType: "deals",
    targetValue: "/deals",
    priority: 50,
  },
  {
    internalName: "Starter — Mega menu discovery",
    slug: "starter-mega-menu-compare",
    headline: "Fresh technology from shops across Techaven",
    subheadline: "Browse live listings from specialist electronics stores.",
    placement: "header_mega_menu",
    layout: "announcement",
    presentation: "compact",
    theme: "brand_soft",
    ctaLabel: "Explore products",
    targetType: "internal_path",
    targetValue: "/products",
    priority: 50,
    imageUrl: image("photo-1523206489230-c012c64b2b48"),
  },
  {
    internalName: "Starter — Shop local specialists",
    slug: "starter-shop-local-specialists",
    headline: "Shop with people who know their tech.",
    subheadline:
      "Discover specialist storefronts, live listings and clear shop information.",
    placement: "home_banner_1",
    layout: "split",
    presentation: "image_top",
    slotGroup: "home-upgrade-pair",
    groupOrder: 1,
    theme: "brand_soft",
    ctaLabel: "Browse shops",
    targetType: "internal_path",
    targetValue: "/shops",
    priority: 70,
    imageUrl: image("photo-1550009158-9ebf69173e03"),
  },
  {
    internalName: "Starter — Categories hero",
    slug: "starter-categories-hero",
    headline: "Find technology for every part of your day.",
    subheadline:
      "Browse phones, laptops, gaming, audio, wearables and home electronics from Techaven shops.",
    placement: "categories_hero",
    layout: "hero",
    presentation: "lifestyle",
    imagePosition: "right",
    theme: "neutral",
    ctaLabel: "See all categories",
    targetType: "internal_path",
    targetValue: "/categories",
    priority: 60,
    imageUrl: image("photo-1498049794561-7780e7231661"),
  },
  {
    internalName: "Starter — Products hero",
    slug: "starter-products-hero",
    headline: "One marketplace. More ways to find the right device.",
    subheadline: "Browse live electronics listings from shops across Techaven.",
    placement: "products_hero",
    layout: "hero",
    presentation: "product_led",
    imagePosition: "right",
    theme: "brand_soft",
    ctaLabel: "See current deals",
    targetType: "deals",
    targetValue: "/deals",
    priority: 60,
    imageUrl: image("photo-1517336714731-489689fd1ca8"),
  },
  {
    internalName: "Starter — Shops hero",
    slug: "starter-shops-hero",
    headline: "Meet the shops behind the technology.",
    subheadline:
      "Browse specialist storefronts, compare their live listings and choose how you want to shop.",
    placement: "shops_hero",
    layout: "hero",
    presentation: "lifestyle",
    imagePosition: "right",
    theme: "brand_soft",
    ctaLabel: "Browse all shops",
    targetType: "internal_path",
    targetValue: "/shops",
    priority: 60,
    imageUrl: image("photo-1550009158-9ebf69173e03"),
  },
  {
    internalName: "Starter — Catalogs hero",
    slug: "starter-catalogs-hero",
    headline: "Collections built around how you live.",
    subheadline:
      "Explore practical combinations for study, work, entertainment and everyday upgrades.",
    placement: "catalogs_hero",
    layout: "hero",
    presentation: "dark_editorial",
    imagePosition: "right",
    theme: "dark",
    ctaLabel: "Browse collections",
    targetType: "internal_path",
    targetValue: "/catalogs",
    priority: 60,
    imageUrl: image("photo-1496181133206-80ce9b88a853"),
  },
  {
    internalName: "Starter — Trade-in hero",
    slug: "starter-trade-in-hero",
    headline: "Give your old device another life.",
    subheadline:
      "See the trade-in path offered by participating Techaven shops before your next upgrade.",
    placement: "trade_in_hero",
    layout: "hero",
    presentation: "lifestyle",
    imagePosition: "right",
    theme: "brand_soft",
    ctaLabel: "Browse upgrade options",
    targetType: "deals",
    targetValue: "/deals",
    priority: 60,
    imageUrl: image("photo-1601784551446-20c9e07cdbdb"),
  },
  {
    internalName: "Starter — Help hero",
    slug: "starter-help-hero",
    headline: "Clear answers for a more confident purchase.",
    subheadline:
      "Learn about delivery, collection, warranties, buyer protection and shopping across Techaven.",
    placement: "help_hero",
    layout: "hero",
    presentation: "lifestyle",
    imagePosition: "right",
    theme: "neutral",
    ctaLabel: "Browse shops",
    targetType: "internal_path",
    targetValue: "/shops",
    priority: 60,
    imageUrl: image("photo-1563013544-824ae1b704d3"),
  },
  {
    internalName: "Starter — Search hero",
    slug: "starter-search-hero",
    headline: "Search every Techaven shop at once.",
    subheadline:
      "Find products across live listings without visiting each storefront separately.",
    placement: "search_hero",
    layout: "hero",
    presentation: "product_led",
    imagePosition: "right",
    theme: "neutral",
    ctaLabel: "Browse all products",
    targetType: "internal_path",
    targetValue: "/products",
    priority: 60,
    imageUrl: image("photo-1523275335684-37898b6baf30"),
  },
];

async function uploadImage(strapi: any, slug: string, url: string) {
  const existing = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { caption: `starter:${slug}` } });
  if (existing) return existing.id;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Image download failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const path = join("/tmp", `${slug}.jpg`);
  await writeFile(path, bytes);
  const info = await stat(path);
  try {
    const uploaded = await strapi
      .plugin("upload")
      .service("upload")
      .upload({
        data: {
          fileInfo: {
            name: `${slug}.jpg`,
            alternativeText: slug.replace(/-/g, " "),
            caption: `starter:${slug}`,
          },
        },
        files: {
          filepath: path,
          originalFilename: `${slug}.jpg`,
          mimetype: "image/jpeg",
          size: info.size,
        },
      });
    return uploaded[0].id;
  } finally {
    await unlink(path).catch(() => undefined);
  }
}

export async function seedDefaultPromotions(strapi: any) {
  let created = 0,
    updated = 0,
    skipped = 0,
    failed = 0;
  for (const source of defaults) {
    try {
      const { imageUrl, ...data } = source;
      const existing = await strapi
        .documents(UID)
        .findFirst({ filters: { slug: data.slug }, status: "draft" });
      if (existing?.notes && existing.notes !== STARTER_MARKER) {
        skipped++;
        continue;
      }
      data.notes = STARTER_MARKER;
      if (imageUrl)
        data.desktopBackground = await uploadImage(strapi, data.slug, imageUrl);
      if (existing) {
        await strapi.documents(UID).update({
          documentId: existing.documentId,
          status: "published",
          data,
        });
        updated++;
      } else {
        await strapi.documents(UID).create({ status: "published", data });
        created++;
      }
    } catch (error) {
      failed++;
      strapi.log.error(
        JSON.stringify({
          event: "starter_promotion_import_failed",
          slug: source.slug,
          message: (error as Error).message,
        }),
      );
    }
  }
  strapi.log.info(
    JSON.stringify({
      event: "default_promotions_seeded",
      created,
      updated,
      skipped,
      failed,
      total: defaults.length,
    }),
  );
}
