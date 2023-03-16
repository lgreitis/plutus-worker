import { Job, Worker } from "bullmq";
import { Item, Prisma } from "@prisma/client";
import { formatDuration, intervalToDuration } from "date-fns";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import { OfficialPricePoolData, SteamHistoryResult } from "src/types";
import {
  fetchItemHistory,
  officialPriceHistoryToDatabase,
} from "src/service/officialPriceHistoryService";
import prisma from "src/config/prisma";
import { createStatisticEntry } from "src/utils/statistics";

const proxyRotationHandler = new ProxyRotationHandler();

const main = async () => {
  new Worker("officialPrices", async (job: Job<OfficialPricePoolData>) => {
    const { data } = job;
    const startTime = new Date();

    const result = await fetchItemHistory(
      data.marketHashName,
      proxyRotationHandler
    ).catch(() => {
      throw new Error("Generic error, more info TODO");
    });

    const item = await prisma.item.findUnique({
      where: { marketHashName: data.marketHashName },
    });

    if (!item) {
      return;
    }

    await officialPriceHistoryToDatabase(result.result, item);
    const duration = intervalToDuration({ start: startTime, end: new Date() });

    await createStatisticEntry({
      category: "OfficialPricingHistory",
      proxy: result.proxy,
      lastProxyDuration: result.lastProxyDuration,
      startTime: startTime,
    });

    console.log(
      `Success: ${item.marketHashName}, took: ${formatDuration(
        duration
      )}, with: ${JSON.stringify(result.proxy)}`
    );
  });
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
