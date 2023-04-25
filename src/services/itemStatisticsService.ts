import { iqr, median } from "@basementuniverse/stats";
import { isAfter, subDays, subMonths } from "date-fns";
import prisma from "src/config/prisma";

export const createItemStatistics = async (
  itemId: string,
  lastPrice: number | null
) => {
  const dayCutoff = subDays(new Date(), 1);
  const weekCutoff = subDays(new Date(), 7);

  const monthsData = await prisma.officialPricingHistory.findMany({
    orderBy: { date: "desc" },
    where: { itemId: itemId, date: { gte: subMonths(new Date(), 1) } },
    select: { price: true, volume: true, date: true },
  });

  const weeksData = monthsData.filter((element) =>
    isAfter(element.date, weekCutoff)
  );
  const daysData = weeksData.filter((element) =>
    isAfter(element.date, dayCutoff)
  );

  const volume24h = calculateVolume(daysData);
  const volume7d = calculateVolume(weeksData);
  let change24h = 0;
  let change7d = 0;
  let change30d = 0;

  if (lastPrice) {
    const monthsDataWithoutOutliers = detectOutliers(
      monthsData.map((element) => element.price)
    );
    const weeksDataWithoutOutliers = detectOutliers(
      weeksData.map((element) => element.price)
    );
    const daysDataWithoutOutliers = detectOutliers(
      daysData.map((element) => element.price)
    );

    const last = monthsDataWithoutOutliers[0];

    if (monthsDataWithoutOutliers[monthsDataWithoutOutliers.length - 1]) {
      change30d = calculateChange(
        last,
        monthsDataWithoutOutliers[monthsDataWithoutOutliers.length - 1]
      );
    }
    if (weeksDataWithoutOutliers[weeksDataWithoutOutliers.length - 1]) {
      change7d = calculateChange(
        last,
        weeksDataWithoutOutliers[weeksDataWithoutOutliers.length - 1]
      );
    }
    if (daysDataWithoutOutliers[daysDataWithoutOutliers.length - 1]) {
      change24h = calculateChange(
        last,
        daysDataWithoutOutliers[daysDataWithoutOutliers.length - 1]
      );
    }
  }

  await prisma.itemStatistics.upsert({
    where: { itemId: itemId },
    update: {
      change24h,
      change7d,
      change30d,
      volume24h,
      volume7d,
    },
    create: {
      change24h,
      change7d,
      change30d,
      volume24h,
      volume7d,
      itemId: itemId,
    },
  });
};

const detectOutliers = (data: number[]) => {
  const iqrData = iqr(data);
  const q3 = iqrData.q3 || 0;
  const q1 = iqrData.q1 || 0;
  const iqrr = Math.abs(q3 - median(data)) + Math.abs(q1 - median(data));

  const maxValue = q3 + iqrr * 1.5;
  const minValue = q1 - iqrr * 1.5;

  const dataWithoutOutliers = data.filter(
    (element) => element <= maxValue && element >= minValue
  );

  return dataWithoutOutliers;
};

const calculateChange = (latest: number, oldest: number) => {
  return ((latest - oldest) / oldest) * 100;
};

const calculateVolume = (
  data: {
    date: Date;
    price: number;
    volume: number;
  }[]
) => {
  let volume = 0;
  for (const point of data) {
    volume += point.price * point.volume;
  }
  return volume;
};
