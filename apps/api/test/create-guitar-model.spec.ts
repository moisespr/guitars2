import { describe, expect, it } from "vitest";

import { createApplication } from "../src/application/create-application.js";
import { CatalogNotFoundError } from "../src/domain/catalog/catalog-not-found-error.js";
import { InvalidReferenceError } from "../src/domain/shared/invalid-reference-error.js";
import { normalizeModelName } from "../src/domain/shared/model-name.js";
import { fixedClock, fixedIds } from "./support/fixed-dependencies.js";
import { InMemoryCatalogAndModelStore } from "./support/in-memory-store.js";

const catalogId = "00000000-0000-4000-8000-000000000001";

describe("creating a guitar model", () => {
  it("creates its three named part models and guitar model as one observable composition", async () => {
    const store = new InMemoryCatalogAndModelStore();
    const application = createApplication({
      clock: fixedClock(),
      ids: fixedIds(
        catalogId,
        "00000000-0000-4000-8000-000000000002",
        "00000000-0000-4000-8000-000000000003",
        "00000000-0000-4000-8000-000000000004",
        "00000000-0000-4000-8000-000000000005",
      ),
      store,
    });
    await application.createCatalog.execute({ name: "Dream Builds" });

    const guitarModel = await application.createGuitarModel.execute({
      body: { material: "alder", name: "Alder ST body" },
      bridge: { bridgeType: "two-point tremolo", name: "Two-point tremolo" },
      catalogId,
      name: "Saturday ST",
      neck: { name: "Maple C neck", profile: "C" },
    });

    expect(guitarModel).toMatchObject({
      body: { id: "00000000-0000-4000-8000-000000000002", material: "alder" },
      bridge: {
        id: "00000000-0000-4000-8000-000000000004",
        bridgeType: "two-point tremolo",
      },
      id: "00000000-0000-4000-8000-000000000005",
      neck: { id: "00000000-0000-4000-8000-000000000003", profile: "C" },
    });
    expect(store.counts()).toEqual({
      bodyModels: 1,
      bridgeModels: 1,
      catalogs: 1,
      guitarModels: 1,
      neckModels: 1,
    });
  });

  it("does not create nested models when the catalog is missing", async () => {
    const store = new InMemoryCatalogAndModelStore();
    const application = createApplication({
      clock: fixedClock(),
      ids: fixedIds("00000000-0000-4000-8000-000000000002"),
      store,
    });

    await expect(
      application.createGuitarModel.execute({
        body: { name: "Body" },
        bridge: { name: "Bridge" },
        catalogId,
        name: "Guitar",
        neck: { name: "Neck" },
      }),
    ).rejects.toBeInstanceOf(CatalogNotFoundError);
    expect(store.counts()).toEqual({
      bodyModels: 0,
      bridgeModels: 0,
      catalogs: 0,
      guitarModels: 0,
      neckModels: 0,
    });
  });

  it("does not create new nested models when a referenced part does not exist", async () => {
    const store = new InMemoryCatalogAndModelStore();
    const application = createApplication({
      clock: fixedClock(),
      ids: fixedIds(catalogId, "00000000-0000-4000-8000-000000000002"),
      store,
    });
    await application.createCatalog.execute({ name: "Dream Builds" });

    await expect(
      application.createGuitarModel.execute({
        body: { id: "00000000-0000-4000-8000-000000000099" },
        bridge: { name: "Bridge" },
        catalogId,
        name: "Guitar",
        neck: { name: "Neck" },
      }),
    ).rejects.toBeInstanceOf(InvalidReferenceError);
    expect(store.counts()).toEqual({
      bodyModels: 0,
      bridgeModels: 0,
      catalogs: 1,
      guitarModels: 0,
      neckModels: 0,
    });
  });

  it("normalizes names with Unicode compatibility, whitespace trimming, and stable casing", () => {
    expect(normalizeModelName("  ＳＴ Body  ")).toBe("st body");
  });
});
