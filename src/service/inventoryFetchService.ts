import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpResult, Proxy, SteamInventoryResult } from "src/types";
import https from "node:https";
import { timeout } from "promise-timeout";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import fs from "node:fs";
import randomUseragent from "random-useragent";

export const fetchInventory = async (
  steamID64: string,
  proxyRotationHandler: ProxyRotationHandler
): Promise<{
  result: SteamInventoryResult;
  lastProxyDuration: number;
  proxy: Proxy;
}> => {
  let proxy = await proxyRotationHandler.getCurrentProxy();

  while (true) {
    try {
      let lastProxyDuration = Date.now();
      const response = await requestWithTimeout(proxy, steamID64);
      lastProxyDuration = Date.now() - lastProxyDuration;

      if (
        response.statusCode === 429 ||
        response.statusCode === 503 ||
        response.statusCode === 502
      ) {
        proxy = await proxyRotationHandler.getNewProxy();
        continue;
      }

      const parsed: SteamInventoryResult = JSON.parse(response.data);

      // TODO: Shallow json test
      // fs.writeFileSync("out.json", response.data);

      return { result: parsed, lastProxyDuration, proxy };
    } catch (error) {
      proxy = await proxyRotationHandler.getNewProxy();
      console.log(error);
      continue;
    }
  }
};

const requestWithTimeout = (
  proxy: Proxy,
  steamID64: string
): Promise<HttpResult> => {
  return new Promise((resolve, reject) => [
    timeout(makeRequestWithProxy(proxy, steamID64), 7000)
      .then((result) => resolve(result))
      .catch((error) => {
        reject(error);
      }),
  ]);
};

function makeRequestWithProxy(
  proxy: Proxy,
  steamID64: string
): Promise<HttpResult> {
  const appID = "730";
  const contextID = "2";

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
    path: `/inventory/${steamID64}/${appID}/${contextID}?l=english&count=2000`,
    method: "GET",
    agent: agent,
    headers: {
      Host: "steamcommunity.com",
      Referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
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
