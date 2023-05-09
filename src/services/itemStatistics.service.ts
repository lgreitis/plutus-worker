import { iqr, median } from "@basementuniverse/stats";
import { isAfter, subDays, subMonths } from "date-fns";
import prisma from "src/config/prisma";

export const createItemStatistics = async (itemId: string) => {
  const dayCutoff = subDays(new Date(), 1);
  const weekCutoff = subDays(new Date(), 7);

  const monthsData = await prisma.officialPricingHistory.findMany({
    where: { itemId: itemId, date: { gte: subMonths(new Date(), 1) } },
    select: { price: true, volume: true, date: true },
    orderBy: { date: "desc" },
  });

  const weeksData = monthsData.filter((element) =>
    isAfter(element.date, weekCutoff)
  );
  const daysData = weeksData.filter((element) =>
    isAfter(element.date, dayCutoff)
  );

  const { volume: volume24h, sales: sales24h } =
    calculateVolumeAndSales(daysData);
  const { volume: volume7d, sales: sales7d } =
    calculateVolumeAndSales(weeksData);
  const { volume: volume30d, sales: sales30d } =
    calculateVolumeAndSales(monthsData);

  let change24h = 0;
  let change7d = 0;
  let change30d = 0;

  const median24h = calculateMedian(daysData);
  const median7d = calculateMedian(weeksData);
  const median30d = calculateMedian(monthsData);

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

  await prisma.itemStatistics.upsert({
    where: { itemId: itemId },
    update: {
      change24h,
      change7d,
      change30d,
      volume24h,
      volume7d,
      volume30d,
      sales24h,
      sales7d,
      sales30d,
      median24h,
      median7d,
      median30d,
    },
    create: {
      change24h,
      change7d,
      change30d,
      volume24h,
      volume7d,
      volume30d,
      sales24h,
      sales7d,
      sales30d,
      median24h,
      median7d,
      median30d,
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

const calculateVolumeAndSales = (
  data: {
    date: Date;
    price: number;
    volume: number;
  }[]
) => {
  let volume = 0;
  let sales = 0;
  for (const point of data) {
    volume += point.price * point.volume;
    sales += point.volume;
  }
  return { volume, sales };
};

const calculateMedian = (data: { price: number }[]) => {
  if (data.length === 0) {
    return 0;
  }

  const sorted = [...data].sort((a, b) => a.price - b.price);

  const half = Math.floor(sorted.length / 2);

  if (sorted.length % 2) return sorted[half].price;

  return (sorted[half - 1].price + sorted[half].price) / 2;
};
