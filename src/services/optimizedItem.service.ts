import { OfficialPricingHistory } from "@prisma/client";
import { startOfDay, subYears } from "date-fns";
import prisma from "src/config/prisma";

export const createOptimizedTableEntries = async (itemId: string) => {
  await prisma.$transaction(async (tx) => {
    const promises = [
      tx.officialPricingHistoryOptimized.deleteMany({
        where: { itemId: itemId },
      }),
      tx.officialPricingHistory.findMany({
        where: { date: { gt: subYears(new Date(), 1) }, itemId: itemId },
      }),
    ] as const;

    const [, stats] = await Promise.all(promises);

    const data = normalizeData(stats);

    await tx.officialPricingHistoryOptimized.createMany({
      data: data,
    });
  });
};

interface DataGroup {
  volume: number;
  itemCount: number;
  sumPrice: number;
  price: number;
  itemId: string;
}

export const normalizeData = (items: OfficialPricingHistory[]) => {
  const groupedData = new Map<number, DataGroup>();

  for (const item of items) {
    const start = startOfDay(item.date).getTime();
    const dataGroup = groupedData.get(start);
    if (dataGroup) {
      const combinedItemCount = dataGroup.itemCount + 1;
      const combinedPrice = dataGroup.sumPrice + item.price;
      groupedData.set(start, {
        itemCount: combinedItemCount,
        sumPrice: combinedPrice,
        volume: dataGroup.volume + item.volume,
        price: combinedPrice / combinedItemCount,
        itemId: item.itemId,
      });
    } else {
      groupedData.set(start, {
        itemCount: 1,
        price: item.price,
        sumPrice: item.price,
        volume: item.volume,
        itemId: item.itemId,
      });
    }
  }

  const result: {
    price: number;
    date: Date;
    volume: number;
    itemId: string;
  }[] = [];

  for (const [key, value] of groupedData.entries()) {
    result.push({
      price: value.price,
      date: new Date(key),
      volume: value.volume,
      itemId: value.itemId,
    });
  }

  return result;
};
