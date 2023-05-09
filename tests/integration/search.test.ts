import searchController from "src/api/controllers/search.controller";
import fastifyConfig from "src/config/fastify";
import { SECRET_KEY } from "src/constants";
import { databaseWipe } from "tests/setup/databaseWipe";
import { createBasicItem } from "tests/setup/items";
import { beforeEach, describe, expect, test } from "vitest";

describe("Search controller", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  test("no auth header", async () => {
    const fastify = await fastifyConfig();
    await fastify.register(searchController);

    const response = await fastify.inject({
      method: "GET",
      url: "/search",
      query: {
        searchString: "test",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  test("basic search", async () => {
    const fastify = await fastifyConfig();
    await fastify.register(searchController);

    await createBasicItem("fuzzy search should find this");
    await createBasicItem("fuzzy search should find this too");
    await createBasicItem("random item");

    const response = await fastify.inject({
      method: "GET",
      url: "/search",
      query: {
        searchString: "fuzzy search",
      },
      headers: {
        authorization: SECRET_KEY,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).result.length).toBe(2);
  });

  test("should return nothing", async () => {
    const fastify = await fastifyConfig();
    await fastify.register(searchController);

    await createBasicItem("random item 1");
    await createBasicItem("random item 2");
    await createBasicItem("random item 3");
    await createBasicItem("random item 4");

    const response = await fastify.inject({
      method: "GET",
      url: "/search",
      query: {
        searchString: "fuzzy search",
      },
      headers: {
        authorization: SECRET_KEY,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).result.length).toBe(0);
  });
});
