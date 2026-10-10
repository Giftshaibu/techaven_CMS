"use strict";

const { compileStrapi, createStrapi } = require("@strapi/core");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const hostBuild = resolve(__dirname, "../dist/src/seed/default-promotions.js");
const containerBuild = resolve(__dirname, "../src/seed/default-promotions.js");
const { seedDefaultPromotions } = require(
  existsSync(hostBuild) ? hostBuild : containerBuild,
);

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  await seedDefaultPromotions(app);
  process.exit(0);
}

main().catch((error) => {
  console.error(
    "Starter promotion import failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
