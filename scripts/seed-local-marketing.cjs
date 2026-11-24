const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");

const container = "techaven_cms-strapi-1";
const asset = (source, width, height, alt, trimTop = 0) => ({ source, width, height, alt, trimTop });
const tile = (source, alt) => asset(source, 800, 800, alt);
const landscape = (source, alt) => asset(source, 1200, 675, alt);
const desktop = (source, alt) => asset(source, 1600, 900, alt);
const hero = (source, alt, trimTop) => asset(source, 2000, 900, alt, trimTop);
const portrait = (source, alt) => asset(source, 1200, 1400, alt);
const assets = {
  refurbished: tile("p9e62up9e62up9e6", "Smartphone on a jade backdrop"),
  apple: tile("1rrlcp1rrlcp1rrl", "Silver smartphone on a lavender backdrop"),
  gaming: tile("xmitaoxmitaoxmit", "Game controller lit in blue"),
  flagship: tile("cauokycauokycauo", "Graphite smartphone on a copper backdrop"),
  releases: asset("nkjdusnkjdusnkjd", 900, 1200, "Smartphone on a cobalt plinth"),
  releasesMobile: landscape("njg7nanjg7nanjg7", "Smartphone on a cobalt plinth"),
  blackStrip: asset("ko94rmko94rmko94", 1920, 320, "Gold shopping bag on charcoal"),
  black: desktop("xgvp48xgvp48xgvp", "Gold shopping bag and tag"),
  blackMobile: landscape("ht5hg4ht5hg4ht5h", "Gold shopping bag and tag"),
  payments: landscape("f19g2of19g2of19g", "Illustrated phone, parcel and padlock"),
  support: landscape("kky0x1kky0x1kky0", "Illustrated headset and speech bubbles"),
  verification: landscape("h9b8zgh9b8zgh9b8", "Illustrated shop and shield"),
  sell: desktop("5stfla5stfla5stf", "Illustration of a shop owner packing electronics"),
  sellMobile: landscape("h0u8ydh0u8ydh0u8", "Illustration of a shop owner packing electronics"),
  shops: hero("rd2ajjrd2ajjrd2a", "Illustration of an electronics shop counter"),
  shopsMobile: portrait("qrcsnqrcsnqrcsnq", "Illustration of an electronics shop counter"),
  products: hero("40xtyw40xtyw40xt", "Laptop, smartphone, controller and headphones"),
  productsMobile: portrait("i2gzpfi2gzpfi2gz", "Laptop, smartphone, controller and headphones"),
  catalogs: hero("dxcbindxcbindxcb", "Electronics arranged on display stands"),
  catalogsMobile: portrait("ydyii0ydyii0ydyi", "Electronics arranged on display stands"),
  compare: hero("nx0r1mnx0r1mnx0r", "Two smartphones side by side"),
  compareMobile: portrait("dkakszdkakszdkak", "Two smartphones side by side"),
  trade: hero("uqinacuqinacuqin", "Hand placing a phone on a counter", 110),
  tradeMobile: portrait("4zgbyf4zgbyf4zgb", "Hand placing a phone on a counter"),
  categories: hero("dxxnqfdxxnqfdxxn", "Phone, tablet, earbuds and controller"),
  categoriesMobile: portrait("fcd7npfcd7npfcd7", "Phone, tablet, earbuds and controller"),
  deals: hero("qoju0fqoju0fqoju", "Electronics beside a blank shopping tag"),
  dealsMobile: portrait("g9thovg9thovg9th", "Electronics beside a blank shopping tag"),
};

async function getCatalog() {
  const root = "http://127.0.0.1:4874/api/v2/marketplace/devices";
  const read = async (query) => {
    const response = await fetch(root + query, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Commerce returned ${response.status} for ${query}`);
    return (await response.json()).data;
  };
  const first = await read("?limit=50");
  const pages = await Promise.all(Array.from({ length: first.pagination.total_pages - 1 }, (_, index) =>
    read(`?limit=50&page=${index + 2}`)));
  const devices = [...new Map([first, ...pages].flatMap((page) =>
    page.devices.map((device) => [device.id, device]))).values()];
  const refurbished = await read("?limit=50&condition=refurbished");
  return { devices, refurbished: refurbished.devices };
}

async function stageLocally(sourceDir) {
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), "techaven-promo-seed-"));
  const destination = execFileSync("docker", ["exec", container, "mktemp", "-d", "/tmp/techaven-promo-seed.XXXXXX"], { encoding: "utf8" }).trim();
  try {
    for (const [key, spec] of Object.entries(assets)) {
      await fs.copyFile(path.join(sourceDir, `Gemini_Generated_Image_${spec.source}.jpg`), path.join(staging, `${key}.jpg`));
    }
    await fs.writeFile(path.join(staging, "catalog.json"), JSON.stringify(await getCatalog()));
    await fs.copyFile(__filename, path.join(staging, "seed.cjs"));
    execFileSync("docker", ["cp", staging + "/.", `${container}:${destination}/`], { stdio: "inherit" });
    execFileSync("docker", ["exec", container, "node", `${destination}/seed.cjs`, "--container"], { stdio: "inherit" });
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
    execFileSync("docker", ["exec", "-u", "root", container, "rm", "-rf", "--", destination], { stdio: "inherit" });
  }
}

function records({ devices, refurbished }) {
  const byRelease = [...devices].sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
  const picks = (items) => items.slice(0, 6).map(({ id }) => `device:${id}`);
  const apple = byRelease.filter((d) => /apple/i.test(d.brand?.name ?? ""));
  const gaming = devices.filter((d) => /gaming|playstation|xbox|nintendo|rog|legion|alienware/i.test(d.name) || /gaming/i.test(d.category?.name ?? ""));
  const flagship = byRelease.filter((d) => /iPhone 16|Galaxy S25|Pixel 9/.test(d.name));
  const newest = byRelease.filter((d) => /smartphones/i.test(d.category?.name ?? "") && d.release_date);
  const refurbishedOnly = new Set(devices.filter((device) => device.offers.length &&
    device.offers.every((offer) => offer.condition === "refurbished")).map(({ id }) => id));
  const groups = [
    ["refurbished", "Shop refurbished devices", picks(refurbished.filter(({ id }) => refurbishedOnly.has(id))), "Browse phones", "category", "smartphones"],
    ["apple", "Shop Apple devices", picks(apple), "See Apple", "search", "apple"],
    ["gaming", "Gaming gear and gaming-ready laptops", picks(gaming), "Browse gaming", "category", "gaming"],
    ["flagship", "Flagship phones from previous generations", picks(flagship), "See the catalog", "catalog", "catalogs"],
  ];
  const output = groups.map(([key, headline, railProducts, ctaLabel, targetType, targetValue], index) => ({
    key: `tile-${key}`, headline, desktop: key, placement: "home_square_tiles", layout: "square_tile",
    slotGroup: "home-tiles", groupOrder: index + 1,
    railProducts: railProducts.length >= 2 ? railProducts : [], ctaLabel, targetType, targetValue,
  }));
  output.push(
    { key: "releases", headline: "Explore recent phone releases", subheadline: "Browse available models and compare offers from TecHaven shops.",
      desktop: "releases", mobile: "releasesMobile", placement: "home_promo_rails", layout: "side_banner_with_rail",
      displayOrder: 10, railProducts: picks(newest), ctaLabel: "See the catalog", targetType: "catalog", targetValue: "catalogs" },
    { key: "black", headline: "Black TecHaven", subheadline: "Check back for Black Friday offers from TecHaven shops.",
      desktop: "black", mobile: "blackMobile", strip: "blackStrip", placement: "home_promo_rails", layout: "banner_with_rail",
      displayOrder: 20, theme: "dark", showCountdown: true, badge: "Black Friday", finePrint: "Offers and availability vary by shop.",
      railProducts: [], ctaLabel: "See the deals", targetType: "deals", targetValue: "deals", draftOnly: true },
    ...[
      ["payments", "Payments on TecHaven", "Review the payment options available at checkout."],
      ["support", "Help with your order", "Find help with ordering, delivery and returns."],
      ["verification", "Know which shop is selling", "Open a shop profile to learn who is behind a listing."],
    ].map(([key, headline, subheadline], index) => ({
      key, headline, subheadline, desktop: key, placement: "home_inline_1", layout: "service_grid",
      slotGroup: "home-trust", groupOrder: index + 1, ctaLabel: index === 1 ? "Visit Help" : undefined,
      targetType: index === 1 ? "internal_path" : undefined, targetValue: index === 1 ? "/help" : undefined,
    })),
    { key: "sell", headline: "Sell on TecHaven", subheadline: "Bring your electronics shop to buyers across Malawi.",
      desktop: "sell", mobile: "sellMobile", placement: "home_banner_2", layout: "banner" },
    ...[
      ["shops", "shops", "Meet the shops on TecHaven", "Browse Malawian shops and see who is behind each listing."],
      ["products", "products", "All products, with the shop behind every listing", "Browse phones, laptops, consoles and accessories from TecHaven shops."],
      ["catalogs", "catalogs", "Browse the TecHaven catalog", "Explore devices and compare what shops have available."],
      ["compare", "compare", "Compare specs side by side before you pay", "See where devices differ before choosing one."],
      ["trade", "trade_in", "Trade in your old device toward your next one", "Ask a participating shop whether your device qualifies."],
      ["categories", "categories", "Shop by category, from phones to gaming", "Browse phones, laptops, tablets, gaming gear and accessories."],
      ["deals", "deals", "Tech deals from TecHaven shops", "Browse available offers and see the shop behind each listing."],
    ].map(([key, slot, headline, subheadline]) => ({
      key: `hero-${key}`, headline, subheadline, desktop: key, mobile: `${key}Mobile`, placement: `${slot}_hero`,
      layout: "hero", theme: "brand_soft", ...(key === "trade" ? {
        ctaLabel: "Ask about trade-ins", targetType: "internal_path", targetValue: "/help",
      } : {}),
    })),
  );
  return output;
}

async function seed() {
  const resolveApp = (name) => require(require.resolve(name, { paths: [process.cwd()] }));
  const { createStrapi } = resolveApp("@strapi/core");
  const sharp = resolveApp("sharp");
  const catalog = JSON.parse(await fs.readFile(path.join(__dirname, "catalog.json"), "utf8"));
  const entries = records(catalog);
  const app = await createStrapi({ appDir: process.cwd(), distDir: process.cwd(), autoReload: false }).load();
  try {
    const docs = app.documents("api::promotion.promotion");
    const uploads = app.plugin("upload").service("upload");
    const files = app.db.query("plugin::upload.file");
    const upload = async (key) => {
      if (!key) return null;
      const { width, height, alt, trimTop } = assets[key];
      const source = await fs.readFile(path.join(__dirname, `${key}.jpg`));
      const hash = createHash("sha256").update(source).update(`${width}x${height}:${trimTop}:v1`).digest("hex").slice(0, 12);
      const name = `techaven-local-${key}-${hash}`;
      const existing = await files.findOne({ where: { name } });
      if (existing) return existing.id;
      let image = sharp(source);
      if (trimTop) {
        const meta = await image.metadata();
        image = image.extract({ left: 0, top: trimTop, width: meta.width, height: meta.height - trimTop });
      }
      const filepath = path.join(__dirname, `${name}.webp`);
      const { size } = await image.resize(width, height, { fit: "cover" }).toColourspace("srgb").webp({ quality: 84 }).toFile(filepath);
      const [saved] = await uploads.upload({
        data: { fileInfo: { name, alternativeText: alt } },
        files: { filepath, originalFilename: `${name}.webp`, mimetype: "image/webp", size },
      });
      return saved.id;
    };

    const byId = new Map([...catalog.devices, ...catalog.refurbished].map((device) => [`device:${device.id}`, device]));
    const selected = new Set(entries.flatMap((entry) => entry.railProducts ?? []));
    for (const externalId of selected) {
      const device = byId.get(externalId);
      const shops = new Map(device.offers.filter((offer) => offer.shop?.id).map(({ shop }) => [String(shop.id), shop.name]));
      await app.service("api::catalog-sync.catalog-sync").upsert("product", {
        externalId, slug: device.slug, name: device.name, brand: device.brand?.name,
        category: device.category?.name, thumbnailUrl: device.primary_image_url, active: true,
        shopIds: [...shops.keys()], shopNames: [...new Set(shops.values())].join(", "),
      });
    }

    async function writePromotion(event, slug, write) {
      let unsubscribe;
      let timer;
      const emitted = new Promise((resolve) => {
        unsubscribe = app.eventHub.on(event, ({ entry }) => {
          if (entry?.slug === slug) resolve(true);
        });
      });
      try {
        const result = await write();
        const completed = await Promise.race([
          emitted,
          new Promise((resolve) => { timer = setTimeout(() => resolve(false), 15_000); }),
        ]);
        if (!completed) throw new Error(`Timed out waiting for ${event} on ${slug}`);
        return result;
      } finally {
        clearTimeout(timer);
        unsubscribe();
      }
    }

    for (const { key, desktop: desktopKey, mobile, strip, draftOnly, ...entry } of entries) {
      const slug = `local-marketing-${key}`;
      const existing = await docs.findFirst({ status: "draft", filters: { slug } });
      if (existing && existing.notes !== "marketing-owned") throw new Error(`Seed slug collision: ${slug}`);
      const data = {
        internalName: entry.headline, slug, notes: "marketing-owned", theme: "neutral", imagePosition: "right",
        priority: 150, ...entry, desktopBackground: await upload(desktopKey),
        mobileBackground: await upload(mobile), desktopStripArtwork: await upload(strip),
      };
      const saved = await writePromotion(existing ? "entry.update" : "entry.create", slug, () =>
        existing
          ? docs.update({ documentId: existing.documentId, status: "draft", data })
          : docs.create({ status: "draft", data }),
      );
      if (!draftOnly) {
        await writePromotion("entry.publish", slug, () => docs.publish({ documentId: saved.documentId }));
      }
      console.log(JSON.stringify({ slug, placement: entry.placement, status: draftOnly ? "draft" : "published", products: entry.railProducts?.length }));
    }
  } finally {
    await app.destroy();
  }
}

const source = process.argv[2];
(source === "--container" ? seed() : source ? stageLocally(source) : Promise.reject(new Error("Pass the directory containing the supplied Gemini JPG files.")))
  .catch((error) => { console.error(error.message, error.details ?? ""); process.exitCode = 1; });
