import {
  BullMQAdapter,
  createBullBoard,
  FastifyAdapter,
} from "@bull-board/fastify";
import { Queue } from "bullmq";
import prisma from "./prisma";

export const officialPricePool = new Queue("officialPrices");
export const inventoryFetchPool = new Queue("inventoryFetch");

const bullmqConfig = async () => {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [
      new BullMQAdapter(officialPricePool),
      new BullMQAdapter(inventoryFetchPool),
    ],
    serverAdapter,
  });
  serverAdapter.setBasePath("/bull");

  emptyOfficialPricePoolChecker();

  return serverAdapter;
};

export default bullmqConfig;

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
