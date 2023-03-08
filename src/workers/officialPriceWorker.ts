import { Job, Worker } from "bullmq";
import { fetchItemHistory } from "../service/officialPriceHistoryService";
import prisma from "../config/prisma";
import { OfficialPricePoolData, SteamHistoryResult } from "../types";
import ProxyRotationHandler from "../utils/proxyRotationHandler";
import { Item, Prisma } from "@prisma/client";

const proxyRotationHandler = new ProxyRotationHandler();

const main = async () => {
  new Worker("officialPrices", async (job: Job<OfficialPricePoolData>) => {
    const { data } = job;
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
