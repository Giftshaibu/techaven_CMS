import { factories } from "@strapi/strapi";
import { usesRailProducts } from "../../../utils/promotion";

const UID = "api::promotion.promotion";
const POPULATE = {
  desktopBackground: { fields: ["url", "alternativeText"] },
  desktopStripArtwork: { fields: ["url", "alternativeText"] },
  mobileBackground: { fields: ["url", "alternativeText"] },
  foregroundImage: { fields: ["url", "alternativeText"] },
  seoImage: { fields: ["url", "alternativeText"] },
  products: { fields: ["externalId", "slug"] },
  anchorProduct: { fields: ["externalId", "slug"] },
  secondaryProducts: { fields: ["externalId", "slug"] },
  shops: { fields: ["externalId", "slug"] },
};

async function populateRailProducts(strapi: any, records: any[]) {
  const ids = [...new Set(records.flatMap((record) =>
    usesRailProducts(record.layout) && Array.isArray(record.railProducts)
      ? record.railProducts.slice(0, 12).filter((id: unknown) => typeof id === "string")
      : [],
  ))];
  const rows = ids.length ? await strapi.db.query("api::external-product.external-product").findMany({
    where: { externalId: { $in: ids } },
    select: ["externalId", "slug"],
  }) : [];
  const byId = new Map(rows.map((row: any) => [row.externalId, row]));
  return records.map((record) => usesRailProducts(record.layout) ? {
    ...record,
    products: (Array.isArray(record.railProducts) ? record.railProducts : []).slice(0, 12)
      .flatMap((id: string) => byId.has(id) ? [byId.get(id)] : []),
  } : record);
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  async findActive(placement?: string) {
    const bannerRails = placement === "home_promo_rails";
    const now = new Date().toISOString();
    const filters: Record<string, unknown> = {
      $and: [
        { $or: [{ startsAt: { $null: true } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $null: true } }, { endsAt: bannerRails ? { $gt: now } : { $gte: now } }] },
      ],
    };
    if (placement)
      (filters.$and as unknown[]).push({ placement: { $eq: placement } });

    const records = await strapi.documents(UID).findMany({
      status: "published",
      filters,
      sort: bannerRails ? ["displayOrder:asc", "documentId:asc"] : ["priority:desc", "createdAt:desc"],
      ...(bannerRails ? { limit: 8 } : {}),
      populate: POPULATE,
    } as any);
    return populateRailProducts(strapi, records);
  },

  async findActiveBySlug(slug: string) {
    const records = await this.findActive();
    return records.find((record: any) => record.slug === slug) ?? null;
  },

  async findPreviewByDocumentId(
    documentId: string,
    status: "draft" | "published",
  ) {
    const record = await strapi.documents(UID).findOne({
      documentId,
      status,
      populate: POPULATE,
    } as any);
    return record ? (await populateRailProducts(strapi, [record]))[0] : null;
  },
}));
