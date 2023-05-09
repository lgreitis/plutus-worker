import { Proxy, SteamInventoryResult } from "src/types";
import { makeProxyRequest } from "src/utils/proxyRequest";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";

const appID = "730";
const contextID = "2";

export const fetchInventory = async (
  steamID64: string,
  proxyRotationHandler?: ProxyRotationHandler
): Promise<{
  result: SteamInventoryResult;
  lastProxyDuration: number;
  proxy?: Proxy;
}> => {
  let proxy;

  while (true) {
    try {
      let lastProxyDuration = Date.now();
      const response = await makeProxyRequest(
        {
          path: `/inventory/${steamID64}/${appID}/${contextID}?l=english&count=2000`,
          referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
        },
        proxy
      );
      lastProxyDuration = Date.now() - lastProxyDuration;

      if (
        response.statusCode === 429 ||
        response.statusCode === 503 ||
        response.statusCode === 502
      ) {
        proxy =
          proxyRotationHandler && (await proxyRotationHandler.getNewProxy());

        continue;
      }

      const parsed: SteamInventoryResult = JSON.parse(response.data);

      // TODO: Shallow json test

      return { result: parsed, lastProxyDuration, proxy };
    } catch {
      proxy =
        proxyRotationHandler && (await proxyRotationHandler.getNewProxy());
      continue;
    }
  }
};
