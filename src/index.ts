import prisma from "src/config/prisma";
import fastifyConfig from "src/config/fastify";
import bullmqConfig from "./config/bullmq";
import inventoryFetchController from "./api/controllers/inventoryFetch.controller";

const main = async () => {
  const serverAdapter = await bullmqConfig();
  const fastify = await fastifyConfig();
  fastify.register(serverAdapter.registerPlugin(), {
    basePath: "/",
    prefix: "/bull",
  });
  fastify.register(inventoryFetchController);
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
