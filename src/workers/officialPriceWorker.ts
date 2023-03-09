import { Job, Worker } from "bullmq";
import { Item, Prisma } from "@prisma/client";
import { formatDuration, intervalToDuration } from "date-fns";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import { OfficialPricePoolData, SteamHistoryResult } from "src/types";
import { fetchItemHistory } from "src/service/officialPriceHistoryService";
import prisma from "src/config/prisma";

const proxyRotationHandler = new ProxyRotationHandler();

const main = async () => {
  new Worker("officialPrices", async (job: Job<OfficialPricePoolData>) => {
    const { data } = job;
    const timeStart = new Date();

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

    await toDatabase(result.result, item);
    const duration = intervalToDuration({ start: timeStart, end: new Date() });

    await prisma.officialPricingFetchTime.create({
      data: {
        duration: timeStart.getTime() - Date.now(),
        proxyCountry: result.proxy.country,
        proxyIp: result.proxy.ip,
        proxyPort: result.proxy.port.toString(),
        itemId: item.id,
      },
    });

    console.log(
      `Success: ${item.marketHashName}, took: ${formatDuration(
        duration
      )}, with: ${JSON.stringify(result.proxy)}`
    );
  });
};

const toDatabase = async (data: SteamHistoryResult[], item: Item) => {
  const batch: Prisma.OfficialPricingHistoryCreateManyInput[] = [];

  for (const itemHistory of data) {
    batch.push({
      itemId: item.id,
      date: new Date(itemHistory[0]),
      price: itemHistory[1],
      volume: Number.parseInt(itemHistory[2]),
    });
  }

  await prisma.officialPricingHistory
    .createMany({ data: batch, skipDuplicates: true })
    .catch((error) => {
      console.log(error);
    });

  await prisma.item.update({
    where: { id: item.id },
    data: { officialPricingHistoryUpdateTime: new Date() },
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
