# Decision: catalog and model foundation

**Status:** Accepted (revised)
**Issue:** GitHub issue #2, “Decide the initial guitar-specification domain model”  
**Date:** 2026-08-29

## Context

GuitarS2 needs a shared foundation for manufacturer catalogs, private builder catalogs, personal idea catalogs, and future inventory. The initial decision described an abstract `GuitarSpecification`, but further discovery established that a specification is the structured technical content of a named business entity, not the primary entity itself.

Research input from [Electric Guitar Specifications](https://gitfrage.github.io/guitarspecs/) usefully identifies independently meaningful parts and compatibility concerns. It is a solid-body-electric checklist, however, so its categories, dimensions, and tone claims are not normative GuitarS2 constraints.

## Decision

GuitarS2 distinguishes four layers:

```text
Catalog
  └── Model
        └── structured technical specification

Future InventoryItem ──references──> GuitarModel
```

### Catalog

A `Catalog` is a namespace for named models. It can represent a global manufacturer catalog, a private shop or builder catalog, or a personal idea catalog. Catalog visibility, hierarchy, ownership, and permissions are deferred.

### Models and specifications

A model is the primary named business entity. Its specification is the structured technical content of that model. The external API expresses that content with JSON Schema; the future domain and persistence representations must preserve its meaning without determining its public shape.

The first model composition is:

```text
GuitarModel
  ├── BodyModel
  ├── NeckModel
  └── BridgeModel
```

`GuitarModel`, `BodyModel`, `NeckModel`, and `BridgeModel` are independently addressable entities. They have separate named external schemas and types, rather than one generic `Model` schema with a `kind` field. A `GuitarModel` references exactly one model of each initial part type. References may cross catalog boundaries so that, for example, a private custom model can compose known models from other catalogs; authorization rules for such use are deferred.

Each model has a stable generated ID exposed by the API and a name. The name is unique only within its catalog and model type, expressed conceptually as `catalogId + modelType + normalizedName`. It is a business constraint, not a permanent identity: a model may be renamed or revised without invalidating references. Descriptions and the content of a specification never determine model identity or uniqueness.

### Measurements

`Measurement` is an immutable value object with `value` and `unit`. Every physical dimension includes an explicit unit; no API, domain, or persistence representation may rely on a bare number. A canonical unit and conversion policy are not chosen here.

### Future physical inventory

An `InventoryItem` is a future physical instance. Serial number, condition, price, and ownership belong there rather than on a model or catalog. A future general party/actor concept may represent a player, shop, builder, manufacturer, or platform; catalog curation and inventory ownership are distinct relationships.

## Initial field classification

| Concept | Initial fields or role | Classification |
| --- | --- | --- |
| `Catalog` | stable `id`, name | Catalog identity and descriptive attribute |
| Any model | stable `id`, `catalogId`, name | Model identity, catalog relationship, and descriptive attribute constrained within its namespace |
| `GuitarModel` | `bodyModelId`, `neckModelId`, `bridgeModelId` | Composition relationships to part models |
| `BodyModel`, `NeckModel`, `BridgeModel` | stable `id`, `catalogId`, name | Part-model identity, catalog relationship, and descriptive attribute |
| `Measurement` | `value`, `unit` | Immutable value object |

## Deferred decisions

- **Guitar classification:** decide later whether electric, acoustic, bass, hollow, or solid body are labels, capabilities, or other concepts. Do not introduce a `guitarType` enum now.
- **Model revisions:** decide how technical changes, generations, and historical catalog entries are versioned rather than silently mutating a model.
- **Detailed part attributes:** decide concrete body, neck, and bridge fields from real API use cases; do not import a fixed terminology list from the research source.
- **Compatibility validation:** defer automatic neck-to-body and bridge-to-body compatibility rules until manufacturer data and semantics are agreed.
- **Other component models:** pickups, electronics, tuners, strings, and hardware are future named model types with separate schemas.
- **Catalog governance:** catalog hierarchy, curation, ownership, visibility, sharing, and authorization are future concerns.
- **Inventory and parties:** physical instances, serial numbers, prices, owners, and the party/actor model are future concerns.

## Consequences

The first create/retrieve API can create and retrieve named, catalogued models with a small generic composition while preserving room for private custom work and cross-catalog reuse. The model does not claim all guitar families share the same detailed attributes, and it avoids speculative compatibility, inventory, ownership, catalog-governance, and classification rules.
