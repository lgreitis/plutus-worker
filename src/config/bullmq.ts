import {
  BullMQAdapter,
  createBullBoard,
  FastifyAdapter,
} from "@bull-board/fastify";
import { Queue } from "bullmq";
import prisma from "./prisma";

export const officialPricePool = new Queue("officialPrices");
export const apiPriceFetchPool = new Queue("apiPrices");
export const inventoryFetchPool = new Queue("inventoryFetch");
export const officialPriceTrimmerPool = new Queue("officialPriceTrimmer");
export const exchangeRateFetchPool = new Queue("exchangeRateFetch");
export const itemStatisticsPool = new Queue("itemStatistics");

const bullmqConfig = async () => {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [
      new BullMQAdapter(officialPricePool),
      new BullMQAdapter(apiPriceFetchPool),
      new BullMQAdapter(inventoryFetchPool),
      new BullMQAdapter(officialPriceTrimmerPool),
      new BullMQAdapter(exchangeRateFetchPool),
      new BullMQAdapter(itemStatisticsPool),
    ],
    serverAdapter,
  });
  serverAdapter.setBasePath("/bull");

  emptyOfficialPricePoolChecker();
  await apiPriceFetchPoolCronJob();
  await officialPriceTrimmerPoolCronJob();
  await exchangeRateFetchPoolCronJob();
  await itemStatisticsPoolCronJob();

  return serverAdapter;
};

export default bullmqConfig;

const apiPriceFetchPoolCronJob = async () => {
  await apiPriceFetchPool.add(
    "Fetch info from SteamApis",
    {},
    { repeat: { pattern: "0 * * * *" } }
  );
};

const officialPriceTrimmerPoolCronJob = async () => {
  await officialPriceTrimmerPool.add(
    "Trim official price history",
    {},
    { repeat: { pattern: "0 * * * *" } }
  );
};

const exchangeRateFetchPoolCronJob = async () => {
  await exchangeRateFetchPool.add(
    "Grab newest exchange rates",
    {},
    { repeat: { pattern: "0 */2 * * *" } }
  );
};

const itemStatisticsPoolCronJob = async () => {
  await itemStatisticsPool.add(
    "Calculate item statistics",
    {},
    { repeat: { pattern: "30 */1 * * *" } }
  );
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
