import { rest } from "msw";
import { setupServer } from "msw/node";
import { readFileSync } from "node:fs";
import path from "node:path";
import prisma from "src/config/prisma";
import {
  fetchItemHistory,
  officialPriceHistoryToDatabase,
} from "src/services/officialPriceHistory.service";
import { databaseWipe } from "tests/setup/databaseWipe";
import { createBasicItem } from "tests/setup/items";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

const successResponse = readFileSync(
  path.join(__dirname, "../data/successResponse.html"),
  { encoding: "utf8" }
).toString();

const emptyResponse = readFileSync(
  path.join(__dirname, "../data/emptyResponse.html"),
  { encoding: "utf8" }
).toString();

export const restHandlers = [
  rest.get(
    "https://steamcommunity.com/market/listings/730/item",
    (request, response, context) => {
      return response(
        context.delay(10),
        context.status(200),
        context.set("Content-Type", "text/html"),
        context.body(successResponse)
      );
    }
  ),
  rest.get(
    "https://steamcommunity.com/market/listings/730/itemEmpty",
    (request, response, context) => {
      return response(
        context.delay(10),
        context.status(200),
        context.set("Content-Type", "text/html"),
        context.body(emptyResponse)
      );
    }
  ),
];

const server = setupServer(...restHandlers);

describe("Official price history fetch service", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  test("fetch item statistics", async () => {
    const response = await fetchItemHistory("item");

    expect(response?.result.length).toBeGreaterThan(0);
  });

  test("fetch item statistics empty", async () => {
    const response = await fetchItemHistory("itemEmpty");

    expect(response?.result.length).toBe(0);
  });

  test("fetch item statistics and put to db", async () => {
    const item = await createBasicItem("item");
    const response = await fetchItemHistory("item");

    if (!response) {
      throw new Error("this should be full of data");
    }

    await officialPriceHistoryToDatabase(response.result, item);

    const priceHistory = await prisma.officialPricingHistory.findMany({
      orderBy: { date: "asc" },
    });

    expect(priceHistory.length).toBe(response.result.length);
    expect(priceHistory[0].date).toStrictEqual(new Date(response.result[0][0]));
    expect(priceHistory[0].price).toBeCloseTo(response.result[0][1]);
    expect(priceHistory[0].volume).toBe(Number.parseInt(response.result[0][2]));

    const priceHistoryLast = priceHistory[priceHistory.length - 1];
    const responseLast = response.result[response.result.length - 1];

    expect(priceHistoryLast.date).toStrictEqual(new Date(responseLast[0]));
    expect(priceHistoryLast.price).toBeCloseTo(responseLast[1]);
    expect(priceHistoryLast.volume).toBe(Number.parseInt(responseLast[2]));
  });
});
