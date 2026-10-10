import { factories } from "@strapi/strapi";

const UID = "api::promotion.promotion";
const POPULATE = {
  desktopBackground: { fields: ["url", "alternativeText"] },
  mobileBackground: { fields: ["url", "alternativeText"] },
  foregroundImage: { fields: ["url", "alternativeText"] },
  seoImage: { fields: ["url", "alternativeText"] },
  products: { fields: ["externalId", "slug"] },
  anchorProduct: { fields: ["externalId", "slug"] },
  secondaryProducts: { fields: ["externalId", "slug"] },
  shops: { fields: ["externalId", "slug"] },
};

export default factories.createCoreService(UID, ({ strapi }) => ({
  async findActive(placement?: string) {
    const now = new Date().toISOString();
    const filters: Record<string, unknown> = {
      $and: [
        { $or: [{ startsAt: { $null: true } }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $null: true } }, { endsAt: { $gte: now } }] },
      ],
    };
    if (placement)
      (filters.$and as unknown[]).push({ placement: { $eq: placement } });

    return strapi.documents(UID).findMany({
      status: "published",
      filters,
      sort: ["priority:desc", "createdAt:desc"],
      populate: POPULATE,
    } as any);
  },

  async findActiveBySlug(slug: string) {
    const records = await this.findActive();
    return records.find((record: any) => record.slug === slug) ?? null;
  },

  async findPreviewByDocumentId(
    documentId: string,
    status: "draft" | "published",
  ) {
    return strapi.documents(UID).findOne({
      documentId,
      status,
      populate: POPULATE,
    } as any);
  },
}));
