import { Static, Type } from "@sinclair/typebox";
import { search } from "fast-fuzzy";
import { FastifyPluginCallback } from "fastify";
import prisma from "src/config/prisma";
import { sharedSecretHeaderHook } from "src/utils/sharedSecretHook";

const searchQueryString = Type.Object({
  searchString: Type.String(),
  returnMatchData: Type.Boolean({ default: false }),
});

type searchQueryStringType = Static<typeof searchQueryString>;

const searchResult = Type.Object({
  result: Type.Any(),
  success: Type.Boolean(),
});

type searchResultType = Static<typeof searchResult>;

let itemCache: { marketHashName: string; icon: string }[] = [];

const searchController: FastifyPluginCallback = (fastify, options, done) => {
  fastify.route<{
    Querystring: searchQueryStringType;
    Reply: searchResultType;
  }>({
    method: "GET",
    url: "/search",
    schema: {
      description: "Fuzzy search items",
      querystring: searchQueryString,
      response: {
        200: searchResult,
      },
    },
    preHandler: sharedSecretHeaderHook,
    handler: async (request, reply) => {
      try {
        // TODO: doesn't slow down too much but still need a better cache solution
        const itemLength = await prisma.item.count();
        if (itemCache.length === 0 || itemLength !== itemCache.length) {
          itemCache = await prisma.item.findMany({
            select: {
              marketHashName: true,
              icon: true,
              id: true,
            },
          });
        }
        const result = search(request.query.searchString, itemCache, {
          keySelector: (item) => item.marketHashName,
          returnMatchData: request.query.returnMatchData,
          threshold: 0.7,
        });

        reply.status(200).send({ success: true, result });
      } catch {
        reply.status(500).send({ success: false, result: [] });
      }
    },
  });

  done();
};

export default searchController;
