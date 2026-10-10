# Commerce contracts required by Promotions

This is an implementation handoff for the Techaven commerce backend. The promotions CMS and storefront do not own commerce truth. Until these endpoints are available, the storefront uses the current individual product and shop endpoints with bounded concurrency.

## Batch product lookup

`GET /api/products?ids=12,18,24`

- `ids` is a comma-separated list of 1–50 positive integer IDs.
- Trim whitespace, deduplicate IDs while preserving first-occurrence order, and reject malformed, empty, zero, negative, or oversized lists with HTTP 400.
- When `ids` is absent, preserve the existing paginated product-list behavior exactly.
- Return only public product DTOs. Omit missing or inactive products and report their IDs in `missing_ids`.

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [{ "id": 12, "name": "Example product" }],
    "missing_ids": ["18", "24"]
  }
}
```

## Batch shop lookup

`GET /api/shops?ids=3,7`

Apply the same parsing, limit, deduplication, ordering, missing-record, and compatibility rules. Return the existing public shop DTOs as `data.shops` plus `data.missing_ids`.

```json
{
  "success": true,
  "message": "Shops retrieved",
  "data": {
    "shops": [{ "id": 3, "name": "Example shop" }],
    "missing_ids": ["7"]
  }
}
```

## Errors and security

Validation errors use HTTP 400 and the existing API error envelope. Unexpected failures use HTTP 500 with no stack trace or database details in production. These endpoints must never return inventory internals, customer information, seller-private fields, orders, or payment data. They are public read-only catalog endpoints and must use the same visibility rules as the existing single-record endpoints.

## Backend acceptance tests

- One, many, duplicate, whitespace-padded, unordered, malformed, empty, and more-than-50 IDs.
- Requested order is preserved regardless of database order.
- Missing and inactive records appear only in `missing_ids`.
- Existing `/api/products?page=…` and `/api/shops` responses are unchanged when `ids` is absent.
- Response fields match the current public single-record DTOs and do not expose private data.

## Marketplace v2 incremental catalogue reconciliation

The CMS consumes these token-protected endpoints:

```text
GET /api/v2/integrations/promotions/devices?after=<cursor>&limit=<n>
GET /api/v2/integrations/promotions/shops?after=<cursor>&limit=<n>
```

Each standard response envelope contains `items`, `next_cursor`, and `has_more`. Device IDs use `device:<id>` and represent canonical devices with at least one eligible Marketplace offer. Inactive and deleted entities are retained as tombstones with `active=false`. The CMS advances a cursor only after every item in the response has been accepted.
