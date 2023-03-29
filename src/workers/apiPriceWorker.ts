import axios from "axios";
import { Worker } from "bullmq";
import prisma from "src/config/prisma";
import { APIS_KEY } from "src/constants";
import { SteamApisResponse } from "src/types";

const main = async () => {
  new Worker("apiPrices", async () => {
    const result = await axios.get<SteamApisResponse>(
      "https://api.steamapis.com/market/items/730",
      { params: { api_key: APIS_KEY } }
    );

    if (!result.data) {
      throw new Error("Apis request failed, no data");
    }

    for await (const apiItem of result.data.data) {
      const item = await prisma.item.findUnique({
        where: { marketHashName: apiItem.market_hash_name },
      });

      if (!item) {
        // TODO: need to add the item if missing
        // await prisma.item.create({
        //   data: {
        //     icon: trimSteamImageUrl(apiItem.image),
        //     icon_small: trimSteamImageUrl(apiItem.image),
        //     marketHashName: apiItem.market_hash_name,
        //     marketName: apiItem.market_name,
        //     rarity: "BaseGrade",
        //     type: "Skin",
        //   },
        // });
        continue;
      }

      const lastItemHistory = await prisma.apiPricingHistory.findFirst({
        where: { itemId: item.id },
        orderBy: { updateTime: "desc" },
      });

      if (lastItemHistory?.updateTime.getTime() === apiItem.updated_at) {
        continue;
      }

      if (!item.icon || !item.borderColor) {
        await prisma.item.update({
          where: { marketHashName: item.marketHashName },
          data: {
            icon: trimSteamImageUrl(apiItem.image),
            borderColor: apiItem.border_color.replace("#", "").toUpperCase(),
          },
        });
      }

      await prisma.apiPricingHistory.create({
        data: {
          itemId: item.id,
          avg: apiItem.prices.avg,
          current: apiItem.prices.latest,
          max: apiItem.prices.max,
          min: apiItem.prices.min,
          median: apiItem.prices.median,
          safe: apiItem.prices.safe,
          soldLast24h: apiItem.prices.sold.last_24h,
          soldLast7d: apiItem.prices.sold.last_7d,
          soldLast30d: apiItem.prices.sold.last_30d,
          soldLast90d: apiItem.prices.sold.last_90d,
          avgDailyVolume: apiItem.prices.sold.avg_daily_volume,
          unstable: apiItem.prices.unstable,
          unstableReason: apiItem.prices.unstable_reason || undefined,
          updateTime: new Date(apiItem.updated_at),
        },
      });
    }
  });
};

const trimSteamImageUrl = (url: string) =>
  url
    .replace("https://community.cloudflare.steamstatic.com/economy/image/", "")
    .replace("https://steamcommunity-a.akamaihd.net/economy/image/", "");

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
