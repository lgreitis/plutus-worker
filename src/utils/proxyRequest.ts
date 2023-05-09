import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";
import { timeout } from "promise-timeout";
import randomUseragent from "random-useragent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpResult, Proxy } from "src/types";

interface RequestParameters {
  path: string;
  referer: string;
}

export const makeProxyRequest = (
  requestParameters: RequestParameters,
  proxy?: Proxy
) => {
  return requestWithTimeout(requestParameters, proxy);
};

const requestWithTimeout = (
  requestParameters: RequestParameters,
  proxy?: Proxy
): Promise<HttpResult> => {
  return new Promise((resolve, reject) => [
    timeout(makeRequestWithProxy(requestParameters, proxy), 10_000)
      .then((result) => resolve(result))
      .catch((error) => {
        reject(error);
      }),
  ]);
};

async function makeRequestWithProxy(
  requestParameters: RequestParameters,
  proxy?: Proxy
): Promise<HttpResult> {
  let agent: SocksProxyAgent | HttpsProxyAgent | undefined;

  if (proxy) {
    agent =
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
  }

  const userAgent = randomUseragent.getRandom();

  const options = {
    hostname: "steamcommunity.com",
    path: requestParameters.path,
    method: "GET",
    agent: agent,
    headers: {
      Host: "steamcommunity.com",
      Referer: requestParameters.referer,
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
