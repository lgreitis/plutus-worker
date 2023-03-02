import {
  BullMQAdapter,
  createBullBoard,
  FastifyAdapter,
} from "@bull-board/fastify";
import { Queue } from "bullmq";
import fastifyConfig from "./config/fastify";
import prisma from "./config/prisma";

const itemQueue = new Queue("prices");

const main = async () => {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(itemQueue)],
    serverAdapter,
  });
  serverAdapter.setBasePath("/bull");
  const server = await fastifyConfig();
  server.register(serverAdapter.registerPlugin(), {
    basePath: "/",
    prefix: "/bull",
  });
  server.listen({ port: 3000 });
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
