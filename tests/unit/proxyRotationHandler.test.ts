import { FETCH_PROXY_STRING } from "src/constants";
import { Proxy } from "src/types";
import ProxyRotationHandler from "src/utils/proxyRotationHandler";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const proxyList1: Proxy[] = [
  {
    protocol: "http",
    ip: "34.145.209.244",
    port: 8585,
    country: "United States",
    anonymity: "anonymous",
  },
  {
    protocol: "http",
    ip: "34.174.126.144",
    port: 8585,
    country: "United States",
    anonymity: "transparent",
  },
];

const proxyList2: Proxy[] = [
  {
    protocol: "https",
    ip: "34.118.79.47",
    port: 8585,
    country: "Poland",
    anonymity: "anonymous",
  },
  {
    protocol: "http",
    ip: "34.174.176.187",
    port: 8585,
    country: "United States",
    anonymity: "anonymous",
  },
];

describe("Proxy rotation handler", () => {
  let proxyRotationHandler: ProxyRotationHandler;

  beforeEach(() => {
    proxyRotationHandler = new ProxyRotationHandler(FETCH_PROXY_STRING);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn<any, any>(
      proxyRotationHandler,
      "fetchProxyList"
    ).mockImplementationOnce(() => {
      return proxyList1;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn<any, any>(
      proxyRotationHandler,
      "fetchProxyList"
    ).mockImplementationOnce(() => {
      return proxyList2;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("gets a proxy", async () => {
    const proxy = await proxyRotationHandler.getCurrentProxy();

    expect(proxy.ip).toBeDefined();
    expect(proxy.port).toBeDefined();
  });

  test("gets a new different proxy", async () => {
    const proxy1 = await proxyRotationHandler.getCurrentProxy();
    const proxy2 = await proxyRotationHandler.getNewProxy();

    expect(proxy1.ip !== proxy2.ip || proxy1.port !== proxy2.port).toBeTruthy();
  });

  test("fetches new proxies after running out", async () => {
    await proxyRotationHandler.getCurrentProxy();
    const proxy2 = await proxyRotationHandler.getNewProxy();
    const proxy3 = await proxyRotationHandler.getNewProxy();
    const proxy4 = await proxyRotationHandler.getNewProxy();

    expect(proxy2.ip !== proxy3.ip || proxy2.port !== proxy3.port).toBeTruthy();
    expect(proxy2.ip !== proxy4.ip || proxy2.port !== proxy4.port).toBeTruthy();
  });

  test("gets proxy then clears it and gets it again", async () => {
    await proxyRotationHandler.getCurrentProxy();
    proxyRotationHandler.clearProxies();
    const proxy = await proxyRotationHandler.getNewProxy();

    expect(proxy.ip).toBeDefined();
    expect(proxy.port).toBeDefined();
  });
});
