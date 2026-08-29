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

## Domain-driven design

- Treat guitar specifications and their parts as the core domain. Keep business rules, invariants, and measurement semantics close to the domain model, not embedded in HTTP handlers, ORM schemas, or UI components.
- Use the language agreed with guitar-domain collaborators consistently in code, tests, API contracts, and documentation. When terminology is unclear or overloaded, record the open question before establishing a new abstraction.
- Distinguish entities (objects with stable identity), value objects (immutable descriptive values such as a measurement and unit), and aggregates (consistency boundaries). Do not introduce aggregate boundaries or lifecycle rules without a concrete invariant they protect.
- Enforce invariants at the aggregate or value-object boundary. Validate external input at adapters as well, but do not rely on transport validation as the only protection for domain rules.
- Model relationships explicitly when they carry their own meaning, lifecycle, provenance, or constraints. Avoid hiding domain decisions in join-table names or persistence-only fields.
- Keep bounded contexts explicit as the system grows. Avoid importing API, persistence, or future client concerns into the domain merely for convenience.

## Ports and adapters

- Organize code so the domain and application use cases depend on abstractions, while HTTP, PostgreSQL, queues, clocks, IDs, and other integrations implement those abstractions at the edge.
- Define ports in the application/domain-owned code for capabilities the use case needs, such as repositories, transactions, clocks, or ID generation. Adapters must not determine the shape of core business logic.
- Keep HTTP routes/controllers thin: translate requests to commands or queries, invoke a use case, and map known outcomes to response contracts.
- Keep persistence adapters responsible for mapping between domain objects and database records. Do not let ORM models or SQL row shapes leak across the port boundary.
- Make transactions explicit at the application boundary when a use case requires atomic changes across repositories. Do not place transaction orchestration in route handlers.
- Prefer composition at application startup: wire concrete adapters to ports there, keeping the core independently testable.

## Test-driven development and testing

- For behavior changes, start by expressing the intended observable behavior in a focused failing test when practical; implement the smallest change that makes it pass, then refactor with the suite green.
- Write tests in BDD style: describe observable domain or API behavior in business language, and avoid testing implementation details unless they are themselves a required observable contract.
- Unit-test domain rules and application use cases without HTTP servers or databases. Use fakes or in-memory adapters when they accurately exercise a port's required behavior.
- Add adapter integration tests for PostgreSQL mappings, migrations, constraints, and transaction behavior. Run these against a real PostgreSQL-compatible environment rather than asserting ORM calls.
- Test API adapters through their public request/response contract, including validation failures and predictable error mappings. Avoid tests tied to internal handler implementation.
- Keep tests deterministic: control time, ID generation, randomness, and external boundaries through ports. Test meaningful outcomes rather than incidental call order unless call order is itself a requirement.
- Every bug fix should include a regression test at the lowest layer that can demonstrate the defect.

## Clean Code and module design

- Give modules one clear responsibility and use names that reflect the guitar domain and the operation performed. Prefer small, cohesive functions over broad utility modules.
- Keep dependencies pointing inward: adapters may depend on application and domain code; application code may depend on domain code and ports; domain code must not depend on adapters or frameworks.
- Prefer explicit types and domain value objects over primitive-heavy parameter lists or vague boolean flags. Represent units with the value they qualify.
- Make invalid states difficult to construct. Use constructors, factories, or parsers where they clarify and enforce an invariant; return structured, expected failures rather than throwing for ordinary invalid input.
- Avoid speculative abstraction, generic repositories, hidden global state, and comments that repeat code. Write comments for non-obvious decisions, constraints, and trade-offs.
- Refactor only with behavior protected by tests, and keep a change set focused on the requested outcome.

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

## Instruction shortcuts

- A standalone lowercase `cp` means: commit and push the verified changes made for the current task. Recognize it when it appears as its own token, delimited by whitespace, a comma, a period, or the start/end of the message.
- Before acting on `cp`, inspect the working tree and commit only task-scoped files. Do not include unrelated user changes; report any overlap that prevents a safe scoped commit.

## Issue tracking and agent-readiness

- Use GitHub Issues as the durable project work queue. Create small, outcome-oriented issues that can be completed and verified independently.
- State the context, observable behavior or outcome, acceptance criteria, constraints, and required validation evidence in every implementation issue.
- Classify issues with one `type:` label (`feature`, `bug`, `chore`, or `decision`) and applicable `area:` labels (`domain`, `api`, `database`, or `platform`).
- Apply `agent-ready` only when the scope is bounded, relevant product decisions are resolved, acceptance criteria are explicit, and deterministic verification commands are known.
- Link commits and pull requests to their issue. Keep issue discussions as the record of material scope or decision changes.
- Agents may detect, summarize, and propose work autonomously. They must not create external changes, open pull requests, or modify issue state without explicit authorization until automated validation, security checks, and repository policies provide sufficient guardrails.
- Prefer improving the deterministic feedback loop—tests, linting, type checks, security scanning, and policy checks—before expanding autonomous agent authority.

### Issue-driven commands

- `issues` and `list issues` list open repository issues with their number, title, labels, and a compact status summary. `list closed issues` and `list all issues` explicitly broaden that default view.
- `show <number>`, `show #<number>`, `show GH-<number>`, and `show issue <number>` are read-only commands that display an issue's actionable context: description, labels, state, comments, linked work, and relevant dependencies.
- `work on <number>`, `work on #<number>`, and `work on GH-<number>` start work on that GitHub Issue. First read its full context and treat it as the authoritative scope; flag unresolved decisions, dependencies, or unbounded acceptance criteria before implementation.
- Working on an issue does not implicitly commit, push, close the issue, change labels/state, or open a pull request. Use `cp` for a task-scoped commit and push; require an explicit instruction for other external issue or pull-request changes.

## Documentation decisions

- README: what GuitarS2 is, its scope, architecture direction, and how to use it.
- `AGENTS.md`: how contributors and agents should make changes safely and consistently.
- `docs/`: durable domain decisions, API design notes, and unresolved modeling questions once those become substantial.
