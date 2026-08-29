# GuitarS2

GuitarS2 ("guitar spec spec") is a monorepo for software that models, stores, and retrieves detailed guitar specifications.

The project treats a guitar as a composition of parts. Each part has its own specification model, and a concrete record represents either a real-world part configuration or, eventually, an imagined one. A complete guitar specification combines those parts into an accurate description of a particular guitar.

## Product vision

GuitarS2 aims to become a trustworthy software backbone for the guitar industry: a shared, precise model of guitars, parts, specifications, and their provenance that can support different products without each one rebuilding the underlying instrument data from scratch.

Potential products built on this foundation include:

- a player-facing app to catalogue owned guitars and collections;
- a custom-guitar design experience for exploring and recording dream specifications;
- a path for sharing a custom specification with guitar shops, builders, or luthiers as the basis for an order request;
- a wishlist and market-viewing experience for existing guitars, including local or global price information when reliable sources are available;
- operational software for shops and builders to manage inventory, build ideas, specifications, and orders.

This is a product possibility, not a committed business plan or current roadmap. The first API milestone validates the shared model foundation only. Marketplace operations, pricing data, commerce, ordering workflows, identity, and integrations are later decisions and must not distort the early domain model.

### Foundation model

The shared foundation distinguishes four layers. A **catalog** is a namespace for named entries, such as a public manufacturer catalog, a shop's private catalog, or a player's idea catalog. A **model** is a named guitar or part entry in that catalog. Its **specification** is the structured technical content, expressed externally through JSON Schema. A future **inventory item** is a physical owned instance—serial number, condition, price, and owner—that may reference a model but is not a catalog entry.

The first composition is a `GuitarModel` that references a `BodyModel`, `NeckModel`, and `BridgeModel`. These are separate model types and separate external schemas, not variants of a generic `Model` object. A model name is unique within its catalog and model type, while a stable identifier preserves references across renames and revisions.

### Product principles

- Model the instrument and its parts faithfully enough to serve players, collectors, shops, and builders.
- Preserve provenance and distinguish a manufacturer model, a concrete real-world configuration, and an imagined custom specification.
- Make specifications portable and composable so one representation can serve multiple applications and workflows.
- Treat externally sourced prices, availability, and shop data as time-bound, attributable information rather than permanent guitar facts.
- Earn trust through explicit units, stable identities, clear data ownership, and evolvable contracts.

## First iteration: weekend API

The first milestone is deliberately small: build an API that persists and retrieves guitar specifications.

This iteration will establish:

- a production-oriented TypeScript API service;
- a PostgreSQL-backed persistence layer;
- an initial, collaboratively defined domain model for guitar parts and full guitar specs;
- operations to create and retrieve specs;
- a local development workflow suitable for a weekend project.

The exact guitar model is not fixed yet. For example, a neck model should be able to express a specific configuration such as a C profile, with its supporting measurements and attributes to be decided as the domain model takes shape. Models should avoid pretending that unknown detail has already been decided.

## Technology

- Node.js and TypeScript
- Fastify for the HTTP API
- TypeBox and JSON Schema for request/response contracts and runtime validation
- OpenAPI generated from the API contracts
- PostgreSQL
- Kysely and `pg` for PostgreSQL access, isolated in persistence adapters
- SQL migrations checked into the repository
- Vitest for behavior-driven unit, API-contract, and integration tests
- OpenTelemetry-compatible observability as the API gains operational concerns
- React (planned client application)
- Terraform (infrastructure definitions; deployment planning comes later)

## API architecture direction

The API will use Ports & Adapters architecture. The domain model and application use cases remain independent of Fastify, PostgreSQL, Kysely, and operational integrations. HTTP and PostgreSQL are adapters composed at application startup.

The initial API will use REST and JSON contracts. JSON Schema is the source of truth for every external request, response, and error model; TypeScript types are derived from those schemas, and OpenAPI will reference the same definitions. Request input is validated at the HTTP boundary, domain invariants are enforced by the domain model, and response and error shapes are explicit API contracts.

PostgreSQL queries and row-to-domain mapping belong in persistence adapters. Database migrations are explicit, reviewed SQL files, so schema changes remain visible and independently deployable. Tests describe observable behavior and cover the domain and application core without infrastructure, then verify HTTP and PostgreSQL adapters through their public contracts.

## Local development

GuitarS2 uses pnpm workspaces and Node.js 24 or newer. Enable pnpm through Corepack if it is not already available:

```powershell
corepack enable
corepack pnpm install
```

The current API application is under `apps/api`. The root commands delegate to it:

```powershell
corepack pnpm dev          # start the API at http://127.0.0.1:3000
corepack pnpm test         # run BDD-style tests
corepack pnpm typecheck    # check TypeScript without emitting files
corepack pnpm format       # check formatting
corepack pnpm build        # compile the API
corepack pnpm start        # run the compiled API
```

The API exposes `GET /health`, which returns `{"status":"ok"}` when it is available. Optional configuration uses `HOST` (default `127.0.0.1`), `PORT` (default `3000`), and `LOG_LEVEL` (default `info`). Configuration is validated before the server starts; `.env` files are intentionally ignored by Git.

## Monorepo direction

All project code lives in this repository. It is intended to host multiple applications and shared packages as the project grows. Likely top-level areas include:

```text
apps/       Deployable applications, such as the API and future React client
packages/   Shared domain models, database code, and reusable libraries
infra/      Terraform and infrastructure configuration
docs/       Domain decisions and architecture notes
```

These directories are a target structure, not a requirement to create empty scaffolding before it is useful.

## Scope boundaries

### This weekend

- Agree on the initial part and guitar-spec models.
- Implement the API and database support needed for storing and retrieving them locally.
- Keep the design simple, testable, and easy to evolve.

### Later

- Build the React application.
- Decide authentication, public/private ownership, validation depth, search, and versioning.
- Plan and implement deployment.
- Define Terraform-backed environments and operational practices.

## Guiding principles

- Model the real instrument first; implementation convenience should not distort the domain.
- Prefer explicit, composable part specifications over a single unstructured guitar blob.
- Use stable identifiers and preserve enough detail to distinguish materially different real-world configurations.
- Evolve the schema deliberately as the domain is learned.
- Keep early choices reversible.

## Status

Project inception. The initial domain model and API contract are the next decisions to make.
