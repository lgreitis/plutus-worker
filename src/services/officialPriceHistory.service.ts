import { Item, Prisma } from "@prisma/client";
import prisma from "src/config/prisma";
import { Proxy, SteamHistoryResult } from "src/types";
import { makeProxyRequest } from "src/utils/proxyRequest";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";

export const fetchItemHistory = async (
  marketHashName: string,
  proxyRotationHandler?: ProxyRotationHandler
): Promise<
  | {
      result: SteamHistoryResult[];
      proxy?: Proxy;
      lastProxyDuration: number;
    }
  | undefined
> => {
  const encoded = encodeURIComponent(marketHashName);
  let proxy = proxyRotationHandler
    ? await proxyRotationHandler.getCurrentProxy()
    : undefined;

  while (true) {
    let lastProxyDuration = Date.now();
    const response = await makeProxyRequest(
      {
        path: `/market/listings/730/${encoded}`,
        referer: "https://steamcommunity.com/market/",
      },
      proxy
    ).catch(() => {
      // general api error throw, just skip because it's probably something wrong with proxy
    });

    lastProxyDuration = Date.now() - lastProxyDuration;

    if (!response) {
      // no result so just skip
      proxy =
        proxyRotationHandler && (await proxyRotationHandler.getNewProxy());
      continue;
    }

    const { data: result, statusCode } = response;

    if (statusCode === 429 || statusCode === 503 || statusCode === 502) {
      proxy =
        proxyRotationHandler && (await proxyRotationHandler.getNewProxy());
      continue;
    }

    const startIndex = result.indexOf("var line1=");
    const endIndex = result.indexOf(";", startIndex);
    if (startIndex === -1 || endIndex === -1) {
      // Some items don't have history so just return [] for it
      if (
        result.includes(
          "There is no price history available for this item yet."
        ) ||
        result.includes("Waiting for new activity...") ||
        result.includes("There are no listings for this item.")
      ) {
        return { result: [], proxy, lastProxyDuration };
      }
      // this happens if rate limited proxy, or just returns gibberish, so skip.
      proxy =
        proxyRotationHandler && (await proxyRotationHandler.getNewProxy());
      continue;
    }

    const extracted: SteamHistoryResult[] = JSON.parse(
      result.slice(startIndex + 10, endIndex)
    );

    return { result: extracted, proxy, lastProxyDuration };
  }
};

export const officialPriceHistoryToDatabase = async (
  data: SteamHistoryResult[],
  item: Item
) => {
  if (data.length === 0) {
    return;
  }

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

  return await prisma.item.update({
    where: { id: item.id },
    data: {
      officialPricingHistoryUpdateTime: new Date(),
      lastPrice: data[data.length - 1][1],
    },
  });
};
