import { render } from "@react-email/components";
import sgMail from "@sendgrid/mail";
import { Worker } from "bullmq";
import { add, endOfMonth, format, startOfMonth } from "date-fns";
import prisma from "src/config/prisma";
import { SENDGRID_API_KEY } from "src/constants";
import MonthlyMail from "src/emails/monthly-mail";

const main = async () => {
  new Worker("mailSender", async () => {
    sgMail.setApiKey(SENDGRID_API_KEY);

    const monthDate = add(new Date(), { months: -1 });
    const month = format(monthDate, "LLLL");

    const users = await prisma.user.findMany({ where: { sendEmails: true } });

    for (const user of users) {
      if (!user.email) {
        continue;
      }

      const inventory = await prisma.inventory.findUnique({
        where: { userId: user.id },
      });

      const currencyFormatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: user.currency || "USD",
      });

      const exchangeRate = await prisma.exchangeRate.findFirst({
        orderBy: { timestamp: "desc" },
        where: { conversionCurrency: user.currency },
      });

      if (!inventory) {
        continue;
      }

      const userItems = await prisma.userItem.findMany({
        where: { inventoryId: inventory.id },
        include: {
          Item: {
            include: {
              OfficialPricingHistoryOptimized: {
                orderBy: { date: "asc" },
                where: {
                  date: {
                    gte: startOfMonth(monthDate),
                    lte: endOfMonth(monthDate),
                  },
                },
              },
            },
          },
        },
      });

      let startValue = 0;
      let endValue = 0;

      for (const item of userItems) {
        const start = item.Item.OfficialPricingHistoryOptimized[0];
        const end =
          item.Item.OfficialPricingHistoryOptimized[
            item.Item.OfficialPricingHistoryOptimized.length - 1
          ];

        startValue += start.price * item.quantity;
        endValue += end.price * item.quantity;
      }

      const emailHtml = render(
        MonthlyMail({
          month: month,
          percentage: ((endValue - startValue) / startValue) * 100,
          value: currencyFormatter.format(endValue * (exchangeRate?.rate ?? 1)),
          difference: currencyFormatter.format(
            (endValue - startValue) * (exchangeRate?.rate ?? 1)
          ),
        })
      );

      const message = {
        to: user.email,
        from: "plutus@lukasgreicius.com",
        subject: `Your Plutus inventory report for ${month}`,
        html: emailHtml,
      };

      try {
        await sgMail.send(message);
      } catch (error) {
        console.error(error);
      }
    }
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
