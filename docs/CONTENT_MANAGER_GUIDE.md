# Techaven Promotions CMS — Content Manager Guide

This is the day-to-day guide for the person publishing promotions in Strapi. It covers what to fill in, where each promotion appears, image sizes, campaign pages, previewing, publishing, and the fields that should normally be left alone.

CMS address: `http://localhost:1337/admin` for local work. Use the protected production admin address when the CMS is deployed.

## The four things to remember

1. **Placement decides where it appears.** A CTA decides where a click goes. These are different settings.
2. **Save does not make content public.** Use Preview, check the result, then Publish.
3. **Do not type prices, stock, ratings or discounts into promotion copy as live facts.** Product facts come from the commerce system.
4. **Use the named slots that exist.** If the required position is not in the Placement list, ask the frontend developer to add a slot instead of using the wrong one.

## The normal publishing workflow

1. Open **Content Manager → Promotion**.
2. Open an existing promotion or choose **Create new entry**.
3. Complete the required identity, placement, layout, theme and headline fields.
4. Add the correct desktop image and, when needed, a mobile image.
5. Add the CTA destination, schedule, targeting and product/shop references that apply.
6. Click **Save**.
7. Use **Preview** and check desktop and mobile crops, copy, links and product/shop content.
8. Correct any problems, save again, then click **Publish**.
9. Open the real storefront page once after publishing. Public results can take up to about two minutes to refresh because of caching.

To remove a promotion immediately, **Unpublish** it. Do not delete it unless the record is genuinely no longer needed.

## What to fill in every time

| Field              | What to enter                      | Guidance                                                                                                                       |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Internal Name      | A name only the team uses          | Use a searchable pattern such as `Christmas 2026 — Home hero`. Maximum 120 characters.                                         |
| Slug               | A unique URL-friendly name         | Use lowercase words and hyphens: `christmas-sale-2026`. Avoid changing it after links have been shared.                        |
| Placement          | The exact storefront position      | Use the placement map below.                                                                                                   |
| Layout             | The approved visual format         | Use only a layout allowed for the selected placement.                                                                          |
| Theme              | The controlled colour treatment    | Usually `light`, `neutral` or `brand_soft`; use `dark` or `brand` only when the artwork and contrast suit it.                  |
| Headline           | The main customer-facing message   | Aim for 30–70 characters and no more than two short lines. The CMS maximum is 180 characters, but that is not a design target. |
| Desktop Background | The main campaign artwork          | Use the dimensions in the image table below.                                                                                   |
| Alternative text   | A useful description of the visual | Describe information conveyed by the image, not decoration. Do not start with “Image of”.                                      |
| Priority           | Which record wins the slot         | `50` is normal. Higher numbers win when several active promotions use the same placement.                                      |

If you edit one of the starter records, change **Notes** from `starter-owned:v2` to `marketing-owned`. This prevents a future starter-content import from replacing your changes. Notes are never shown publicly.

## Copy guidance

| Field         | Recommended use                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| Headline      | One clear idea. Lead with the customer benefit, product family or occasion.              |
| Subheadline   | One supporting sentence, usually 70–140 characters. Maximum 240.                         |
| Body          | Optional detail. Keep cards to one or two short sentences. Heroes may use a little more. |
| Badge         | Optional short label such as `Christmas offer`, `New` or `Limited time`.                 |
| Fine Print    | Terms or eligibility only. Do not hide the main offer here.                              |
| CTA Label     | Two to four words: `Shop the sale`, `Explore laptops`, `View the campaign`.              |
| Secondary CTA | Optional. Use only when customers have a genuinely useful second action.                 |

Use direct, specific language. Prefer “Laptops for work and study” to “Unlock next-level possibilities”. Avoid all caps, repeated exclamation marks, invented urgency and unsupported claims such as “lowest price”.

The **Eyebrow** field is currently retained in the CMS contract but is not displayed by the promotion renderer. Leave it empty unless the frontend team confirms a future use.

## Image specifications

These are recommended source dimensions, not boxes that editors can resize. The frontend controls the final crop and layout.

| Use                                     | Desktop artwork                        | Mobile artwork                | Crop and file guidance                                                                                                      |
| --------------------------------------- | -------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Page-top background hero                | **2000 × 900 px or larger**            | **1200 × 1400 px** (portrait) | Keep important content inside the central safe area. Leave quiet space on the copy side and expect controlled edge cropping. |
| Lifestyle/background banner             | **2000 × 900 px** (about 20:9)         | **1200 × 1400 px** (portrait) | Leave quiet space behind the text. Expect heavy cropping on different screens.                                              |
| Standard banner                         | **1600 × 900 px** (16:9)               | **1200 × 675 px** (16:9)      | Best for a copy panel beside the image.                                                                                     |
| Split cards                             | **1200 × 675 px** (16:9) for each card | Same file normally works      | Both cards must use the same dimensions and visual weight.                                                                  |
| Service and small promo cards           | **1200 × 675 px** (16:9)               | Same file normally works      | Keep the subject large; card images are displayed at roughly 190–210 px high.                                               |
| Mega-menu promotion                     | **1600 × 700 px** (16:7)               | Not normally required         | Shallow artwork only. Avoid text baked into the image.                                                                      |
| SEO/social image                        | **1200 × 630 px**                      | Not applicable                | Used for campaign sharing metadata, not as visible page artwork.                                                            |
| Product cutout supplied as campaign art | **1200 × 1200 px**                     | **1000 × 1000 px**            | WebP or transparent PNG, with comfortable empty space around the device. Live product-card images still come from commerce. |

### File rules

- Prefer **WebP** for most artwork, **JPG** for photography and **PNG** only when transparency is required.
- Aim for less than **1 MB** for a hero and less than **500 KB** for a card. The technical upload limit is 10 MB, but files that large should not be used on the storefront.
- Use RGB colour. Do not upload print-ready CMYK artwork.
- Do not put headlines, prices, buttons or legal copy inside the image. They will crop badly and are not accessible.
- Keep important faces, products and logos away from the outer 15% of the image.
- For page-top heroes, keep the central area usable on both wide and narrow crops. Place the main subject deliberately to the left or right and leave the opposite side quiet for CMS copy and buttons.
- Upload a separate Mobile Background when a desktop image cannot crop cleanly on a narrow screen.
- **Desktop Background wins over Foreground Image.** Foreground Image is currently a fallback, not a second image layer. Do not upload both expecting them to appear together.
- SEO Image is only for campaign search/social metadata.

For alternative text, first set it in the Media Library. Use **Alt Text Override** only when the same image needs different wording for this promotion. The override applies ahead of Media Library alternative text; the headline is the final fallback.

## Where each placement appears

### Page heroes

These are single-promotion slots at the top of a page.

| Placement             | Appears on                | Allowed layouts                                                |
| --------------------- | ------------------------- | -------------------------------------------------------------- |
| `home_hero`           | Homepage main hero        | `hero`, `hero_product`, `lifestyle_banner`                     |
| `categories_hero`     | All-categories page       | `hero`, `hero_product`, `lifestyle_banner`                     |
| `category_hero`       | Individual category page  | `hero`, `hero_product`, `banner`                               |
| `products_hero`       | All-products page         | `hero`, `hero_product`, `lifestyle_banner`                     |
| `shops_hero`          | Shops directory           | `hero`, `lifestyle_banner`                                     |
| `shop_hero`           | Individual shop page      | `hero`, `lifestyle_banner`; normally target a Shop External ID |
| `catalogs_hero`       | Catalogs/collections page | `hero`, `hero_product`, `lifestyle_banner`                     |
| `deals_hero`          | Deals page                | `hero`, `hero_product`, `lifestyle_banner`                     |
| `compare_hero`        | Compare page              | `hero`, `hero_product`, `lifestyle_banner`                     |
| `trade_in_hero`       | Trade-in page             | `hero`, `lifestyle_banner`                                     |
| `help_hero`           | Help page                 | `hero`, `lifestyle_banner`                                     |
| `search_hero`         | Search page               | `hero`, `lifestyle_banner`                                     |
| `promotion_page_hero` | Dynamic campaign page     | `hero`, `hero_product`, `lifestyle_banner`                     |

When a CMS hero is missing, invalid, unpublished or outside its schedule, the storefront uses its built-in fallback header where one exists.

### Homepage slots

| Placement             | Position                          | Allowed layouts                                                                  |
| --------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `home_hero`           | Top of homepage                   | `hero`, `hero_product`, `lifestyle_banner`                                       |
| `home_banner_1`       | After categories and hot products | `split`, `banner`, `lifestyle_banner`; normally a two-card split pair            |
| `home_product_rail_1` | After category and shop browsing  | `product_rail`, `product_grid`, `flash_deals`                                    |
| `home_inline_1`       | Before recommended products       | `service_grid`, `card_rail`, `banner`, `editorial`, `coupon`                     |
| `home_banner_2`       | After recommended products        | `card_rail`, `split`, `banner`, `lifestyle_banner`; normally three or four cards |
| `home_shop_rail`      | Reserved curated-shop slot        | `shop_rail`; not currently mounted on the homepage, so do not use it yet         |

Commerce sections remain between these promotion slots. Do not fill every slot for the same campaign.

### Inline slots on other pages

| Placement           | Position and purpose                                                              | Allowed layouts                                                             |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `category_inline_1` | Inside an individual category’s product results, after the first group            | `banner`, `lifestyle_banner`, `product_rail`, `product_grid`                |
| `category_inline_2` | Near the bottom of an individual category page                                    | `banner`, `split`, `card_rail`, `product_rail`, `product_grid`              |
| `search_inline_1`   | After search results                                                              | `banner`, `editorial`                                                       |
| `deals_inline_1`    | After the main deals product grid                                                 | `flash_deals`, `banner`, `lifestyle_banner`, `product_rail`, `product_grid` |
| `shops_inline_1`    | Near the bottom of the shops directory                                            | `banner`, `editorial`, `shop_rail`                                          |
| `shop_inline_1`     | After an individual shop’s products                                               | `banner`, `product_rail`, `product_grid`                                    |
| `product_inline_1`  | After related products on a product-detail page                                   | `banner`, `editorial`, `coupon`                                             |
| `catalog_inline_1`  | After catalog content; also currently used at the bottom of the all-products page | `banner`, `product_rail`, `product_grid`, `card_rail`                       |

The Compare page currently has `compare_hero` only. There is no Compare bottom slot yet. Ask for a new named placement such as `compare_bottom` if marketing needs one.

### Header slots

| Placement           | Purpose                                                  | Allowed layouts          |
| ------------------- | -------------------------------------------------------- | ------------------------ |
| `site_announcement` | One short announcement in the global header              | `announcement`           |
| `header_mega_menu`  | One compact image promotion inside the desktop mega-menu | `announcement`, `banner` |

Header content should be brief. Never use a large hero image in the mega-menu.

### Campaign-page slots

| Placement/content           | Position                                            | Allowed layouts                                                           |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| `promotion_page_hero`       | Campaign identity and main hero                     | `hero`, `hero_product`, `lifestyle_banner`                                |
| Campaign Product relations  | “Campaign picks” immediately after the introduction | Live product rail                                                         |
| `promotion_page_inline_1`   | After the first campaign product section            | `banner`, `lifestyle_banner`, `product_rail`, `product_grid`, `shop_rail` |
| Campaign Shop relations     | Participating shops                                 | Live shop rail                                                            |
| `promotion_page_inline_2`   | After participating shops                           | `split`, `banner`, `service_grid`, `shop_rail`                            |
| Secondary Product relations | “More from this campaign”                           | Live product grid                                                         |
| `promotion_page_inline_3`   | Final promotional section                           | `card_rail`, `banner`, `editorial`, `coupon`                              |

Every campaign inline record must set **Target Campaign Slug** to the main campaign slug. Otherwise it may be globally eligible for every campaign page using that placement.

## Choosing the right layout

| Layout             | Use it for                                      | Requirements                                                       |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------ |
| `hero`             | A main campaign message with copy and artwork   | One record and hero-compatible placement                           |
| `hero_product`     | A hero featuring one live product card          | Select one active Anchor Product                                   |
| `lifestyle_banner` | A photographic hero or wide campaign background | Artwork must leave readable space for copy                         |
| `banner`           | One inline story with copy and image            | One record                                                         |
| `split`            | Two related cards side by side                  | Create two records with the same Slot Group and orders `1` and `2` |
| `product_rail`     | A horizontal set of live products               | Select at least two active Products                                |
| `product_grid`     | A grid of live products                         | Select at least two active Products                                |
| `shop_rail`        | Participating or featured shops                 | Select at least two active Shops                                   |
| `service_grid`     | Three service/utility stories                   | Normally three records with the same Slot Group                    |
| `card_rail`        | Three or four smaller campaign links            | Records share one Slot Group and use sequential Group Order values |
| `flash_deals`      | Timed products with a countdown                 | At least two Products, Starts At, Ends At and Show Countdown       |
| `coupon`           | A code or short redemption instructions         | A Coupon Code or at least two instruction fields                   |
| `editorial`        | A text-led inline story                         | Use only in an allowed inline slot                                 |
| `announcement`     | Header announcement or compact mega-menu story  | Very short copy                                                    |

The storefront caps a promotional product/shop lookup at 12 references. Curate the strongest items instead of attaching dozens.

## Presentation and image position

Leave **Presentation** as `standard` unless one of these recipes applies:

- `dark_editorial`: editorial headline styling.
- `image_side`: side-by-side image and copy on split cards.
- `background_image`: copy over a darkened background image.

Other presentation values are reserved or have little visible effect in the current storefront.

For **Image Position**, use `left` or `right` to control the balance between artwork and copy in a full-background hero. `left` means the visual subject is expected on the left and the copy is placed on the right; `right` does the reverse. The storefront adds a matching directional contrast layer. `top` and `background` are mainly layout-specific; do not use them to repair a badly cropped source image.

## Buttons and destinations

If a promotion does not need a button, leave CTA Label empty and Target Type as `none`.

| Target Type      | Target value to enter                               |
| ---------------- | --------------------------------------------------- |
| `product`        | Product slug, for example `iphone-15-128gb`         |
| `shop`           | Shop slug                                           |
| `category`       | Category slug, for example `laptops`                |
| `search`         | Search phrase                                       |
| `promotion_page` | Campaign slug, for example `christmas-sale-2026`    |
| `internal_path`  | A safe path beginning with `/`, for example `/help` |
| `external_url`   | Put the complete `https://` address in External URL |
| `catalog`        | Enter `catalogs` as Target Value                    |
| `compare`        | Enter `compare` as Target Value                     |
| `trade_in`       | Enter `trade-in` as Target Value                    |
| `deals`          | Enter `deals` as Target Value                       |

Test every CTA in Preview. External URLs must use HTTPS. Do not paste JavaScript, tracking scripts or shortened links.

## Scheduling, priority and targeting

### Scheduling

- Leave Starts At empty when the promotion may appear immediately after publishing.
- Leave Ends At empty for an evergreen promotion.
- When both are present, Ends At must be later than Starts At.
- The system stores and evaluates time in UTC. Check the displayed timezone before scheduling a midnight launch.
- Scheduling does not publish a draft. The record must still be published.

### Priority

For single slots, the highest-priority eligible promotion appears.

- `80–100`: short takeover or major launch
- `50`: normal campaign
- `20–30`: evergreen fallback

Avoid using `100` for everything. If priorities tie, the newer record wins.

### Targeting

Leave all targeting fields empty for a promotion that should be eligible everywhere its Placement occurs.

- **Target Category Slug:** only that category page.
- **Target Shop External ID:** only that shop page. This is the numeric commerce ID stored as text, not the shop slug.
- **Target Brand Slug:** only matching brand context where supplied by the page.
- **Target Campaign Slug:** only that dynamic campaign page.

Targeting controls **who can see a promotion in its chosen slot**. It does not move the promotion to another physical position.

## Adding products and shops

Products and shops in Strapi are lightweight references. Their current names, images, prices, ratings and availability come from the commerce backend at page load.

- Use **Products** for product rails, grids and campaign picks.
- Use **Anchor Product** only for `hero_product`.
- Use **Secondary Products** only for the second product section on a campaign page.
- Use **Shops** for shop rails and participating shops on campaign pages.
- Keep at least two valid references for any rail or grid. A section with fewer than two resolved records is hidden.
- Do not edit, create or delete External Product or External Shop records unless the integration owner instructs you to do so.
- Never enter prices, inventory, payment details, seller-private information or customer information in the CMS.

If the commerce backend is unavailable, campaign copy and artwork may still appear, but live product and shop sections are hidden until commerce recovers.

## Creating a campaign landing page

Example: Christmas Sale 2026.

### Main campaign record

1. Create a Promotion named `Christmas 2026 — Campaign page`.
2. Set Slug to `christmas-sale-2026`.
3. Set Placement to `promotion_page_hero`.
4. Choose `hero`, `hero_product` or `lifestyle_banner`.
5. Add the hero copy, desktop/mobile artwork and campaign introduction.
6. Add campaign Products, Secondary Products and Shops as needed.
7. Add SEO Title, SEO Description and a 1200 × 630 SEO Image.
8. Set the schedule, save, preview and publish.

The page will be available at `/promotions/christmas-sale-2026`.

### Banner that links to the campaign

Create a separate homepage or page banner:

- Placement: for example `home_banner_1`
- Target Type: `promotion_page`
- Target Value: `christmas-sale-2026`
- CTA Label: for example `Shop Christmas deals`

Adding products to a campaign does not automatically make another banner link to it. The banner CTA must point to the campaign slug.

### Optional campaign sections

Create additional records using `promotion_page_inline_1`, `_2` or `_3`, and set Target Campaign Slug to `christmas-sale-2026`. Keep the campaign page curated; it should not become a stream of advertisements.

## Preview and publishing checklist

Before publishing, confirm:

- [ ] The correct page and Placement were selected.
- [ ] The Layout is allowed for that Placement.
- [ ] The headline is short and has no spelling mistakes.
- [ ] Desktop and mobile images crop correctly.
- [ ] The image contains no baked-in button, price or paragraph text.
- [ ] Alternative text is useful.
- [ ] Every CTA opens the intended destination.
- [ ] Product/shop references resolve and appear in the intended order.
- [ ] Targeting is either intentionally blank or uses the exact required slug/ID.
- [ ] Start/end dates and timezone are correct.
- [ ] Priority is appropriate for other campaigns in the same slot.
- [ ] Campaign SEO is complete when this is a landing page.
- [ ] Notes no longer says `starter-owned:v2` after marketing takes ownership.
- [ ] The record is Published, not only Saved.

Preview links are private, signed and expire after ten minutes. If Preview is blank or says unavailable:

1. Save the record and reopen Preview.
2. Confirm the storefront is running at the configured preview address.
3. Confirm Strapi is running.
4. Ask a developer to check `PREVIEW_FRONTEND_URL` and the storefront’s `VITE_PROMOTIONS_API_URL`.

## Fields that are usually not important

| Field                         | When to use it                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Eyebrow                       | Currently not displayed; leave empty.                                                        |
| Commerce Offer Key            | Reserved for a future commerce integration; leave empty unless a developer provides a value. |
| Slot Group                    | Only for `split`, `service_grid` and `card_rail` groups.                                     |
| Group Order                   | Only for grouped records; use `1`, `2`, `3`, `4`.                                            |
| Foreground Image              | Fallback when Desktop Background is empty; it is not an additional layer.                    |
| Secondary CTA fields          | Only when a second action is truly helpful.                                                  |
| Campaign Introduction         | Only for a `promotion_page_hero` campaign page.                                              |
| Show Countdown                | Only for a timed/flash-deal promotion.                                                       |
| Coupon and instruction fields | Only for `coupon`.                                                                           |
| Anchor Product                | Only for `hero_product`.                                                                     |
| Secondary Products            | Only for the second product section on a campaign page.                                      |
| SEO fields                    | Most important for a campaign landing page; they do not change ordinary banner copy.         |
| Notes                         | Internal ownership/context only; never shown publicly.                                       |

## What content managers cannot control

The frontend intentionally owns fonts, font sizes, spacing, card dimensions, responsive grids, button styling and brand colours. Content managers should not add HTML, CSS, JavaScript, tracking snippets or custom colour values.

Do not use the CMS to manage:

- product price, stock, condition or ratings;
- shop verification or seller-private information;
- orders, customers, payments or inventory;
- arbitrary page sections that have no registered Placement;
- scratch games, testimonials or dense category mosaics;
- more promotional blocks simply because empty slots exist.

Recommended promotion density is 3–5 placements on the homepage, 1–2 on category/deals pages, 0–1 on search/shop/product pages, and 2–4 supporting placements on a dedicated campaign page.

## Suggested 30-minute training session

- **First 5 minutes:** explain Placement versus CTA, Save versus Publish, and why commerce owns prices and stock.
- **Next 8 minutes:** demonstrate editing an existing hero, replacing its desktop/mobile artwork, previewing it and leaving it as a draft.
- **Next 7 minutes:** build a grouped two-card homepage promotion and explain Slot Group, Group Order and priority.
- **Next 7 minutes:** build a campaign page, attach products and connect a separate banner to its slug.
- **Final 3 minutes:** use the publishing checklist and demonstrate Unpublish.

### Hands-on exercises

Use these three demonstrations when onboarding a content manager:

1. **Edit an existing hero:** change the headline and artwork, save, preview, then cancel without publishing.
2. **Create a two-card homepage promotion:** create two `split` records in `home_banner_1`, give both the same Slot Group, set Group Order to `1` and `2`, preview and publish them together.
3. **Create a campaign page:** create `promotion_page_hero`, attach products, then create a homepage banner whose `promotion_page` CTA points to the campaign slug.

If the trainee can complete those three exercises, they can manage the complete promotion system safely.
