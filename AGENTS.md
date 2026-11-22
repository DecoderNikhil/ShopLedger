# ShopLedger contributor notes

## Stack

- Node.js application using CommonJS modules.
- Express 4 serves the static browser UI from `public/` and mounts API routers under `/api`.
- `body-parser` parses JSON request bodies.
- Browser UI uses HTML, CSS, and plain JavaScript.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map

### routes/
- `routes/customers.js` — lists customer balances and settlements; records Khata settlements.
- `routes/orders.js` — lists, retrieves, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard and GST reports, pricing preview, and admin export.

### lib/
- `lib/coupons.js` — normalizes, validates, and calculates coupon discounts.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — product lookup, sellable stock checks, stock updates, and inventory summaries.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlement records.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — calculates order subtotal, discount, tax, and total.
- `lib/reports.js` — dashboard summaries and comparisons of stored order and invoice figures.
- `lib/store.js` — reads and writes the JSON database and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app: `npm start`
- Run tests with Node’s built-in test runner: `node --test`

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
