import { Item, Prisma } from "@prisma/client";
import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";
import { timeout } from "promise-timeout";
import { SocksProxyAgent } from "socks-proxy-agent";
import prisma from "src/config/prisma";
import { HttpResult, Proxy, SteamHistoryResult } from "src/types";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import randomUseragent from "random-useragent";

export const fetchItemHistory = async (
  marketHashName: string,
  proxyRotationHandler: ProxyRotationHandler
): Promise<{
  result: SteamHistoryResult[];
  proxy: Proxy;
  lastProxyDuration: number;
}> => {
  const encoded = encodeURIComponent(marketHashName);
  let proxy = await proxyRotationHandler.getCurrentProxy();

  while (true) {
    let lastProxyDuration = Date.now();
    const response = await requestWithTimeout(proxy, encoded).catch(() => {
      // general api error throw, just skip because it's probably something wrong with proxy
    });

    lastProxyDuration = Date.now() - lastProxyDuration;

    if (!response) {
      // no result so just skip
      proxy = await proxyRotationHandler.getNewProxy();
      continue;
    }

    const { data: result, statusCode } = response;

    if (statusCode === 429 || statusCode === 503 || statusCode === 502) {
      proxy = await proxyRotationHandler.getNewProxy();
      continue;
    }

    const startIndex = result.indexOf("var line1=");
    const endIndex = result.indexOf(";", startIndex);
    if (startIndex === -1 || endIndex === -1) {
      // Some items don't have history so just return [] for it
      if (
        result.includes(
          "There is no price history available for this item yet."
        )
      ) {
        return { result: [], proxy, lastProxyDuration };
      }
      // this happens if rate limited proxy, or just returns gibberish, so skip.
      proxy = await proxyRotationHandler.getNewProxy();
      continue;
    }

    const extracted: SteamHistoryResult[] = JSON.parse(
      result.slice(startIndex + 10, endIndex)
    );

    return { result: extracted, proxy, lastProxyDuration };
  }
};

const requestWithTimeout = (
  proxy: Proxy,
  parameter: string
): Promise<HttpResult> => {
  return new Promise((resolve, reject) => [
    timeout(makeRequestWithProxy(proxy, parameter), 10_000)
      .then((result) => resolve(result))
      .catch((error) => {
        reject(error);
      }),
  ]);
};

async function makeRequestWithProxy(
  proxy: Proxy,
  parameter: string
): Promise<HttpResult> {
  const agent =
    proxy.protocol === "socks4"
      ? new SocksProxyAgent({
          hostname: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocol,
        })
      : new HttpsProxyAgent({
          host: proxy.ip,
          port: proxy.port,
          protocol: "http",
        });

  const userAgent = randomUseragent.getRandom();

  const options = {
    hostname: "steamcommunity.com",
    path: `/market/listings/730/${parameter}`,
    method: "GET",
    agent: agent,
    headers: {
      Host: "steamcommunity.com",
      Referer: "https://steamcommunity.com/market/",
      "User-Agent": userAgent,
    },
  };

  return new Promise<HttpResult>((resolve, reject) => {
    const request = https.get(options, (result) => {
      let data = "";
      result.on("data", (chunk) => {
        data += chunk;
      });
      result.on("end", () => {
        resolve({ data, statusCode: result.statusCode });
      });
      result.on("error", (error) => {
        reject(error);
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

export const officialPriceHistoryToDatabase = async (
  data: SteamHistoryResult[],
  item: Item
) => {
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
