# GuitarS2

GuitarS2 ("guitar spec spec") is a monorepo for software that models, stores, and retrieves detailed guitar specifications.

The project treats a guitar as a composition of parts. Each part has its own specification model, and a concrete record represents either a real-world part configuration or, eventually, an imagined one. A complete guitar specification combines those parts into an accurate description of a particular guitar.

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

The initial API will use REST and JSON contracts. Request input is validated at the HTTP boundary, domain invariants are enforced by the domain model, and response and error shapes are explicit API contracts. JSON Schema will provide the foundation for validation and OpenAPI documentation.

PostgreSQL queries and row-to-domain mapping belong in persistence adapters. Database migrations are explicit, reviewed SQL files, so schema changes remain visible and independently deployable. Tests describe observable behavior and cover the domain and application core without infrastructure, then verify HTTP and PostgreSQL adapters through their public contracts.

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
