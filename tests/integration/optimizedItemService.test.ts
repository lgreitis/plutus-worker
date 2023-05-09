import prisma from "src/config/prisma";
import { createOptimizedTableEntries } from "src/services/optimizedItem.service";
import { databaseWipe } from "tests/setup/databaseWipe";
import { createBasicItem, createItemHistory } from "tests/setup/items";
import { beforeEach, describe, expect, test } from "vitest";

describe("Create optimized table entries", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  test("Empty history", async () => {
    const item = await createBasicItem("test item 1");
    await createOptimizedTableEntries(item.id);

    expect(await prisma.officialPricingHistoryOptimized.count()).toBe(0);
  });

  test("One history", async () => {
    const item = await createBasicItem("test item 1");
    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 0),
      price: 0,
      volume: 0,
    });

    await createOptimizedTableEntries(item.id);

    expect(await prisma.officialPricingHistoryOptimized.count()).toBe(1);
  });

  test("Two of same day should be groupded together", async () => {
    const item = await createBasicItem("test item 1");
    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 0),
      price: 0,
      volume: 0,
    });

    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 1),
      price: 0,
      volume: 0,
    });

    await createOptimizedTableEntries(item.id);

    expect(await prisma.officialPricingHistoryOptimized.count()).toBe(1);
  });

  test("Two of different day should have individuals", async () => {
    const item = await createBasicItem("test item 1");
    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 0),
      price: 0,
      volume: 0,
    });

    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 1, 0),
      price: 0,
      volume: 0,
    });

    await createOptimizedTableEntries(item.id);

    expect(await prisma.officialPricingHistoryOptimized.count()).toBe(2);
  });

  test("Two volumes should be combined and price average", async () => {
    const item = await createBasicItem("test item 1");
    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 0),
      price: 1,
      volume: 1,
    });

    await createItemHistory({
      itemId: item.id,
      date: new Date(2023, 0, 0, 1),
      price: 2,
      volume: 1,
    });

    await createOptimizedTableEntries(item.id);

    const history = await prisma.officialPricingHistoryOptimized.findMany();

    expect(history[0].volume).toBe(2);
    expect(history[0].price).toBeCloseTo(1.5);
  });
});
