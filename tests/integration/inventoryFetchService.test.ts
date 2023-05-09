import { rest } from "msw";
import { setupServer } from "msw/node";
import { fetchInventory } from "src/services/inventoryFetch.service";
import { databaseWipe } from "tests/setup/databaseWipe";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import inventoryRespnse from "../data/inventoryResponse.json";

export const restHandlers = [
  rest.get(
    "https://steamcommunity.com/inventory/111111/730/2",
    (request, response, context) => {
      return response(
        context.delay(10),
        context.status(200),
        context.json(inventoryRespnse)
      );
    }
  ),
];

const server = setupServer(...restHandlers);

describe("Inventory fetch service", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  test("can fetch and parse inventory", async () => {
    const response = await fetchInventory("111111");

    expect(response.result.assets.length).toBeGreaterThan(0);
  });
});
