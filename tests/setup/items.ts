import prisma from "src/config/prisma";

export const createBasicItem = (name: string) => {
  return prisma.item.create({
    data: {
      marketHashName: name,
      marketName: name,
      icon: "",
      icon_small: "",
      rarity: "BaseGrade",
      type: "Other",
    },
  });
};

export const createItemHistory = (data: {
  itemId: string;
  date: Date;
  price: number;
  volume: number;
}) => {
  return prisma.officialPricingHistory.create({
    data,
  });
};
