import {
  BullMQAdapter,
  createBullBoard,
  FastifyAdapter,
} from "@bull-board/fastify";
import { Queue } from "bullmq";
import prisma from "src/config/prisma";
import fastifyConfig from "src/config/fastify";

const officialPricePool = new Queue("officialPrices");

const main = async () => {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(officialPricePool)],
    serverAdapter,
  });
  serverAdapter.setBasePath("/bull");
  const server = await fastifyConfig();
  server.register(serverAdapter.registerPlugin(), {
    basePath: "/",
    prefix: "/bull",
  });
  server.listen({ port: 3000 });

  emptyOfficialPricePoolChecker();
};

const emptyOfficialPricePoolChecker = () => {
  setInterval(async () => {
    const counts = await officialPricePool.getJobCounts();
    if (counts.active === 0) {
      const items = await prisma.item.findMany({
        orderBy: {
          officialPricingHistoryUpdateTime: {
            sort: "asc",
            nulls: "first",
          },
        },
      });
      for await (const item of items) {
        await officialPricePool.add(
          `Get official price history: ${item.marketHashName}`,
          { marketHashName: item.marketHashName },
          { attempts: 10, removeOnComplete: { count: 1000 } }
        );
      }
    }
  }, 10_000);
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
