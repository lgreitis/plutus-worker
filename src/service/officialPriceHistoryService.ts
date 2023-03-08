import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";
import { timeout } from "promise-timeout";
import ProxyRotationHandler from "../utils/proxyRotationHandler";
import { Proxy, SteamHistoryResult } from "../types";
import { SocksProxyAgent } from "socks-proxy-agent";

export const fetchItemHistory = async (
  marketHashName: string,
  proxyRotationHandler: ProxyRotationHandler
): Promise<{ result: SteamHistoryResult[]; proxy: Proxy }> => {
  const encoded = encodeURIComponent(marketHashName);
  let proxy = await proxyRotationHandler.getCurrentProxy();

  while (true) {
    const result = await requestWithTimeout(proxy, encoded).catch(() => {
      // general api error throw, just skip because it's probably something wrong with proxy
    });

    if (!result) {
      // no result so just skip
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
        return { result: [], proxy };
      }
      // this happens if rate limited proxy, or just returns gibberish, so skip.
      proxy = await proxyRotationHandler.getNewProxy();
      continue;
    }

    const extracted: SteamHistoryResult[] = JSON.parse(
      result.slice(startIndex + 10, endIndex)
    );

    return { result: extracted, proxy };
  }
};

const requestWithTimeout = (
  proxy: Proxy,
  parameter: string
): Promise<string> => {
  return new Promise((resolve, reject) => [
    timeout(makeRequestWithProxy(proxy, parameter), 11_000)
      .then((result) => resolve(result))
      .catch((error) => {
        reject(error);
      }),
  ]);
};

async function makeRequestWithProxy(
  proxy: Proxy,
  parameter: string
): Promise<string> {
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

  const options = {
    hostname: "steamcommunity.com",
    path: `/market/listings/730/${parameter}`,
    method: "GET",
    agent: agent,
  };

  return new Promise((resolve, reject) => {
    const request = https.get(options, (result) => {
      let data = "";
      result.on("data", (chunk) => {
        data += chunk;
      });
      result.on("end", () => {
        resolve(data);
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
