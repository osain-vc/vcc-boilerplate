# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

see @AGENTS.md

The rest of this file covers the Adobe Commerce layer, which AGENTS.md does not.

## Commands

- `npm install` then **`npm run install:dropins`**. `.npmrc` sets `ignore-scripts=true`, so `postinstall` never runs on its own. Run `install:dropins` again after any `@dropins/*` or `@adobe/*` version change. It runs `build.mjs` (GraphQL overrides) and `postinstall.js`, which copies `node_modules` into `scripts/__dropins__/`.
- `npm start`: the `aem up` dev server on :3000.
- `npm run lint` / `npm run lint:fix`: ESLint (airbnb-base) and Stylelint.
- E2E tests are a separate package in `cypress/`. Run `npm install` there first. They expect the dev server on 127.0.0.1:3000.
  - `npm run cypress:run` (PaaS), `cypress:saas:run`, `cypress:aco:run`. Each one uses `cypress.base.config.js` plus its environment config.
  - To run a single spec: `npx cypress run --config-file cypress.paas.config.js --spec src/tests/<path>`.
  - Use tags such as `@skipSaas`, `@skipPaas` and `@skipAco` to exclude tests that are expected to fail in one environment.
- Husky pre-commit:
  - A commit that changes `blocks/<name>/*.{js,css,html}` is **blocked** unless `blocks/<name>/README.md` exists. Use `block-readme-template.md`.
  - A commit that touches `package.json` or the lockfile re-runs `npm install` and blocks if the lockfile changes.

## Architecture

- **Drop-ins** are prebuilt Preact UI packages (cart, checkout, pdp, auth, account, order, wishlist, and others). They are committed under `scripts/__dropins__/`, which is generated: never edit it by hand. The import map in `head.html` maps `@dropins/<name>/` to `/scripts/__dropins__/<name>/`, so blocks import bare specifiers like `@dropins/storefront-cart/api.js` with no bundler. A new drop-in package needs an import-map entry.
- **GraphQL customization**: to extend or skip drop-in fragments, edit `build.mjs` (`overrideGQLOperations`), then rerun `install:dropins`.
- **Boot sequence**:
  1. `scripts/scripts.js` `loadEager` calls `initializeCommerce()` in `scripts/commerce.js`.
  2. That fetches `/config.json` (site config from tools.aem.live), cached in `sessionStorage` for 2 hours.
  3. It then configures two `FetchGraphQL` clients: `CORE_FETCH_GRAPHQL` (Commerce core, carrying auth, cart and order data) and `CS_FETCH_GRAPHQL` (Catalog Service, carrying `cs` headers).
  4. Finally it runs `scripts/initializers/index.js`.
- **Initializers** (`scripts/initializers/<dropin>.js`) each wrap one drop-in's `initialize()` in `initializeDropin(...)`. They set the right GraphQL client and load labels from `placeholders/<dropin>.json` through `fetchPlaceholders`. Blocks import the initializer as a side effect, for example `import '../../scripts/initializers/cart.js'`, rather than initializing drop-ins themselves.
- **Commerce blocks** (`blocks/commerce-*`, `product-details`, `product-list-page`, etc.) mostly mount drop-in containers with `provider.render(Container, {...})(el)` and customize them through slots. They talk to each other over `events` from `@dropins/tools/event-bus.js`, not through direct calls.
- **Shared helpers** live in `scripts/commerce.js`: route constants (`CUSTOMER_*_PATH`, etc.), `rootLink()` for multistore/locale-prefixed links, `getProductLink`, `getProductSku`, `fetchPlaceholders`, and consent helpers. Reuse these instead of hardcoding paths.
- **Config values** come from `getConfigValue('<key>')` in `@dropins/tools/lib/aem/configs.js`, backed by the site config. `default-site.json` and `demo-config*.json` show the expected keys, such as `commerce-core-endpoint` and `commerce-endpoint`.
- **Analytics / consent**: the event SDK and collector in `scripts/consented.js` load only after a `consent.update` event. `scripts/consent-check.js` is a placeholder gate (`?consent=accept`). See the README "Analytics loading" section.
- `scripts/components/` holds reusable non-block UI, for example `commerce-mini-pdp`, which the cart imports.

## Lint scope

`.eslintignore` excludes `scripts/__dropins__`, `scripts/acdl`, the commerce events SDK/collector files, `cypress/`, and `tools/pdp-metadata`.
