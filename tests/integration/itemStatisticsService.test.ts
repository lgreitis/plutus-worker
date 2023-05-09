import { sub } from "date-fns";
import prisma from "src/config/prisma";
import { createItemStatistics } from "src/services/itemStatistics.service";
import { databaseWipe } from "tests/setup/databaseWipe";
import { createBasicItem, createItemHistory } from "tests/setup/items";
import { beforeEach, describe, expect, test } from "vitest";

describe("Create item statistics", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  test("Empty statistics", async () => {
    const item = await createBasicItem("test item 1");
    await createItemStatistics(item.id);

    const [statistic] = await prisma.itemStatistics.findMany();

    expect(await prisma.itemStatistics.count()).toBe(1);

    expect(statistic.change24h).toBe(0);
    expect(statistic.change7d).toBe(0);
    expect(statistic.change30d).toBe(0);
    expect(statistic.median24h).toBe(0);
    expect(statistic.median7d).toBe(0);
    expect(statistic.median30d).toBe(0);
    expect(statistic.sales24h).toBe(0);
    expect(statistic.sales7d).toBe(0);
    expect(statistic.sales30d).toBe(0);
    expect(statistic.volume24h).toBe(0);
    expect(statistic.volume7d).toBe(0);
    expect(statistic.volume30d).toBe(0);
  });

  test("two item sales within 24h", async () => {
    const item = await createBasicItem("test item 2");
    await createItemHistory({
      itemId: item.id,
      date: new Date(),
      price: 1,
      volume: 1,
    });

    await createItemHistory({
      itemId: item.id,
      date: sub(new Date(), { hours: 1 }),
      price: 2,
      volume: 1,
    });

    await createItemStatistics(item.id);

    const [statistic] = await prisma.itemStatistics.findMany();

    expect(statistic.change24h).toBeCloseTo(-50);
    expect(statistic.sales24h).toBe(2);
    expect(statistic.median24h).toBeCloseTo(1.5);
  });

  test("three item sales within 24h", async () => {
    const item = await createBasicItem("test item 2");
    await createItemHistory({
      itemId: item.id,
      date: new Date(),
      price: 1,
      volume: 1,
    });

    await createItemHistory({
      itemId: item.id,
      date: sub(new Date(), { hours: 1 }),
      price: 2,
      volume: 1,
    });

    await createItemHistory({
      itemId: item.id,
      date: sub(new Date(), { hours: 2 }),
      price: 3,
      volume: 1,
    });

    await createItemStatistics(item.id);

    const [statistic] = await prisma.itemStatistics.findMany();

    expect(statistic.change24h).toBeCloseTo(-66.666);
    expect(statistic.sales24h).toBe(3);
    expect(statistic.median24h).toBe(2);
  });

  test("two item sales within 7d", async () => {
    const item = await createBasicItem("test item 2");
    await createItemHistory({
      itemId: item.id,
      date: new Date(),
      price: 1,
      volume: 1,
    });

    await createItemHistory({
      itemId: item.id,
      date: sub(new Date(), { days: 2 }),
      price: 2,
      volume: 1,
    });

    await createItemStatistics(item.id);

    const [statistic] = await prisma.itemStatistics.findMany();

    expect(statistic.change24h).toBeCloseTo(0);
    expect(statistic.change7d).toBeCloseTo(-50);
    expect(statistic.sales24h).toBe(1);
    expect(statistic.sales7d).toBe(2);
    expect(statistic.median24h).toBe(1);
    expect(statistic.median7d).toBeCloseTo(1.5);
  });
});
