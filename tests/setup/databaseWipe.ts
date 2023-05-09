import prisma from "src/config/prisma";

export const databaseWipe = async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("databaseWipe can only be used in test environment");
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.deleteMany();
    await tx.apiPricingHistory.deleteMany();
    await tx.exchangeRate.deleteMany();
    await tx.fetchTime.deleteMany();
    await tx.inventory.deleteMany();
    await tx.itemStatistics.deleteMany();
    await tx.officialPricingHistory.deleteMany();
    await tx.officialPricingHistoryOptimized.deleteMany();
    await tx.item.deleteMany();
    await tx.session.deleteMany();
    await tx.user.deleteMany();
    await tx.userFavouriteItem.deleteMany();
    await tx.userItem.deleteMany();
  });

  // console.log("Database wiped successfully");
};
