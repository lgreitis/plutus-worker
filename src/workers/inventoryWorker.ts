import { Prisma } from "@prisma/client";
import { Job, Worker } from "bullmq";
import prisma from "src/config/prisma";
import { INVENTORY_PROXY_STRING } from "src/constants";
import { fetchInventory } from "src/service/inventoryFetchService";
import { InventoryFetchPoolData } from "src/types";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import { createStatisticEntry } from "src/utils/statistics";

const proxyRotationHandler = new ProxyRotationHandler(INVENTORY_PROXY_STRING);

const main = async () => {
  new Worker("inventoryFetch", async (job: Job<InventoryFetchPoolData>) => {
    const { data: jobData } = job;
    const { userId, steamId } = jobData;
    const startTime = new Date();

    const result = await fetchInventory(steamId, proxyRotationHandler);
    job.updateProgress(50);
    const map = new Map<string, number>();

    for (const asset of result.result.assets) {
      const data = result.result.descriptions.find(
        (element) => element.classid === asset.classid
      );

      if (data) {
        map.set(
          data.market_hash_name,
          (map.get(data.market_hash_name) || 0) + 1
        );
      }
    }

    job.updateProgress(70);

    prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      const allItems = await tx.item.findMany();
      const items = await tx.userItem.findMany({
        where: { inventoryId: inventory.id },
      });

      const createUserItemBatch: Prisma.UserItemCreateManyInput[] = [];

      for await (const item of map) {
        const itemExistsInDatabase = allItems.find(
          (element) => element.marketHashName === item[0]
        );
        if (!itemExistsInDatabase) {
          continue;
        }

        const foundItem = items.find(
          (element) => element.marketHashName === item[0]
        );

        createUserItemBatch.push({
          inventoryId: inventory.id,
          marketHashName: item[0],
          quantity: item[1] || foundItem?.quantity || 1,
          notes: foundItem?.notes,
          buyPrice: foundItem?.buyPrice,
          dateAdded: foundItem?.dateAdded,
        });
      }

      await tx.userItem.deleteMany({ where: { inventoryId: inventory.id } });
      await tx.userItem.createMany({ data: createUserItemBatch });
    });

    job.updateProgress(99);

    await createStatisticEntry({
      proxy: result.proxy,
      category: "Inventory",
      startTime: startTime,
      lastProxyDuration: result.lastProxyDuration,
    });

    await job.updateProgress(100);

    proxyRotationHandler.clearProxies();
    return;
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
