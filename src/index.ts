import inventoryFetchController from "src/api/controllers/inventoryFetch.controller";
import searchController from "src/api/controllers/search.controller";
import bullmqConfig from "src/config/bullmq";
import fastifyConfig from "src/config/fastify";
import prisma from "src/config/prisma";
import "src/constants";

const main = async () => {
  const serverAdapter = await bullmqConfig();
  const fastify = await fastifyConfig();
  fastify.register(serverAdapter.registerPlugin(), {
    basePath: "/",
    prefix: "/bull",
  });
  fastify.register(inventoryFetchController);
  fastify.register(searchController);
  fastify.listen({ port: 3000 });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
