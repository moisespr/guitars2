# Working in GuitarS2

This file defines repository workflow for people and coding agents. Product intent, scope, and technology choices belong in the README.

## Repository conventions

- Treat this repository as a monorepo. Keep deployable applications in `apps/`, reusable code in `packages/`, and infrastructure in `infra/` once those areas are introduced.
- Do not create empty folders or premature tooling solely to match the target layout.
- Keep code TypeScript-first. Prefer shared types and domain logic in packages rather than duplicating them across applications.
- PostgreSQL is the persistence target. Avoid database-specific assumptions that would prevent normal PostgreSQL migrations or local development.
- Terraform is reserved for infrastructure work; do not imply that deployment infrastructure is part of the weekend API milestone unless explicitly requested.

## Domain-model workflow

- The guitar data model is intentionally unfinished. Before adding or changing fields, identify whether the field describes a guitar, a part, a measurement, or a relationship between parts.
- Model concrete part specifications as independently addressable records when they can be reused across guitars. A full guitar spec should compose part specifications rather than duplicate their detail.
- Separate a part's identity from its descriptive attributes. Use stable IDs and retain provenance or manufacturer/model information when the model supports it.
- Do not invent exhaustive guitar terminology, constraints, units, or enum values without agreement. Capture an open question in `docs/` or the relevant issue/PR context instead.
- Prefer additive, backwards-compatible schema changes while the API evolves. Pair persistent schema changes with a migration.

## API and data practices

- Define request/response contracts explicitly and validate untrusted input at API boundaries.
- Keep database access behind a small, testable boundary; handlers should not contain raw persistence logic.
- Store measurements with explicit units or a documented canonical unit. Never rely on an ambiguous bare number for physical dimensions.
- Use UTC timestamps and clear naming for identifiers.
- Return predictable errors; do not leak database internals to API consumers.

## Changes and verification

- Make the smallest coherent change that satisfies the task. Avoid unrelated refactors.
- Preserve existing user changes in a dirty working tree.
- Add or update tests whenever behavior changes, especially around domain validation, API contracts, and migrations.
- Run the most relevant formatter, typecheck, tests, and build commands that the repository provides. Report what was run and any limitation.
- Update the README only for product-facing setup, architecture, scope, or usage changes. Update this file when working conventions change.

## Documentation decisions

- README: what GuitarS2 is, its scope, architecture direction, and how to use it.
- `AGENTS.md`: how contributors and agents should make changes safely and consistently.
- `docs/`: durable domain decisions, API design notes, and unresolved modeling questions once those become substantial.

