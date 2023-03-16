import { FetchTimeCategory } from "@prisma/client";
import prisma from "src/config/prisma";
import { Proxy } from "src/types";

interface createStatisticEntryArguments {
  category: FetchTimeCategory;
  startTime: Date;
  lastProxyDuration: number;
  proxy: Proxy;
}

export const createStatisticEntry = async (
  data: createStatisticEntryArguments
) => {
  await prisma.fetchTime.create({
    data: {
      duration: Date.now() - data.startTime.getTime(),
      lastProxyDuration: data.lastProxyDuration,
      proxyCountry: data.proxy.country,
      proxyIp: data.proxy.ip,
      proxyPort: data.proxy.port.toString(),
      category: data.category,
    },
  });
};
