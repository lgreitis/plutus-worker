import { Job, Worker } from "bullmq";
import { formatDuration, intervalToDuration } from "date-fns";
import prisma from "src/config/prisma";
import { FETCH_PROXY_STRING } from "src/constants";
import { createItemStatistics } from "src/services/itemStatistics.service";
import {
  fetchItemHistory,
  officialPriceHistoryToDatabase,
} from "src/services/officialPriceHistory.service";
import { createOptimizedTableEntries } from "src/services/optimizedItem.service";
import { OfficialPricePoolData } from "src/types";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import { createStatisticEntry } from "src/utils/statistics";

const proxyRotationHandler = new ProxyRotationHandler(FETCH_PROXY_STRING);

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

    if (!item || !result) {
      return;
    }

    const updatedItem = await officialPriceHistoryToDatabase(
      result.result,
      item
    );
    await createOptimizedTableEntries(item.id);
    updatedItem && (await createItemStatistics(updatedItem.id));

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
