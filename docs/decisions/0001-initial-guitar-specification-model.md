# Decision: initial guitar-specification model

**Status:** Accepted  
**Issue:** GitHub issue #2, “Decide the initial guitar-specification domain model”  
**Date:** 2026-08-29

## Context

GuitarS2 needs a small model that can grow into a shared foundation for different guitar-related products. The model must represent an abstract guitar configuration, not an owned physical instrument, and it must avoid treating solid-body electric guitar terminology as universal.

Research input from [Electric Guitar Specifications](https://gitfrage.github.io/guitarspecs/) usefully identifies independently meaningful parts and compatibility concerns. It is a solid-body-electric checklist, however, so its categories, dimensions, and tone claims are not normative GuitarS2 constraints.

## Decision

The initial aggregate is an abstract `GuitarSpecification`: a reusable configuration composed of independently addressable part specifications.

```text
GuitarSpecification
  ├── BodySpecification
  ├── NeckSpecification
  └── BridgeSpecification
```

The first valid `GuitarSpecification` references exactly one body, neck, and bridge specification. Each referenced part is an entity with a stable ID and an independent lifecycle, so the same part specification may be composed into more than one guitar specification.

`GuitarSpecification` represents neither a physical owned instrument nor its inventory, serial number, condition, or price. Those are future concepts that may reference a specification.

The model will not yet contain a `guitarType` enum or separate electric/acoustic/bass inheritance trees. A future classification may be useful, but it must follow actual domain requirements rather than prematurely determine the shape of the model.

## Initial field classification

This decision deliberately fixes structure rather than exhaustive part attributes.

| Concept | Initial fields or role | Classification |
| --- | --- | --- |
| `GuitarSpecification` | stable `id` | Guitar-specification identity |
| `GuitarSpecification` | `bodySpecificationId`, `neckSpecificationId`, `bridgeSpecificationId` | Relationships between the specification and its composed parts |
| `BodySpecification` | stable `id` | Part identity |
| `NeckSpecification` | stable `id` | Part identity |
| `BridgeSpecification` | stable `id` | Part identity |
| `Measurement` | `value`, `unit` | Immutable value object for any physical dimension |

Part descriptive attributes, including manufacturer/model and provenance when known, belong to the relevant part specification. Their exact fields remain open until they are required by a concrete use case.

`Measurement` values always carry an explicit unit. The model must never rely on a bare number for a physical dimension. No canonical unit or conversion policy is chosen in this decision.

## Deferred decisions

- **Guitar type/classification:** decide later whether classifications such as electric, acoustic, bass, hollow, or solid body are labels, capabilities, or separate concepts.
- **Part attributes:** decide concrete body, neck, and bridge attributes from the first API contract and real examples; do not import a fixed terminology list from the research source.
- **Compatibility validation:** defer automatic validation of neck-to-body and bridge-to-body interfaces. Future part specifications may describe those interfaces, but the first model will not assert compatibility rules without manufacturer data and agreed semantics.
- **Other parts:** pickups, electronics, tuners, strings, hardware, and their configurations are future independently addressable specifications or relationships.
- **Physical instruments:** ownership, serial numbers, condition, price, inventory, and order workflows belong to future concepts that reference a `GuitarSpecification`.

## Consequences

The first create/retrieve API can work with a small, generic composition while preserving room for future products. It does not claim that all guitar families share the same detailed attributes, and it avoids validating compatibility or terminology that has not been agreed.
