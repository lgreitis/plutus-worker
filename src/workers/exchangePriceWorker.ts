import axios from "axios";
import { Worker } from "bullmq";
import prisma from "src/config/prisma";
import { OPEN_EXCHANGE_RATES_APP_ID } from "src/constants";

interface ResultData {
  timestamp: number;
  base: string;
  rates: { [key: string]: number };
}

const main = async () => {
  new Worker("exchangeRateFetch", async () => {
    const result = await axios.get<ResultData>(
      "https://openexchangerates.org/api/latest.json",
      {
        params: {
          app_id: OPEN_EXCHANGE_RATES_APP_ID,
          base: "USD",
        },
      }
    );

    const batch = Object.entries(result.data.rates).map(([currency, rate]) => {
      return {
        baseCurrency: "USD",
        timestamp: result.data.timestamp,
        conversionCurrency: currency,
        rate,
      };
    });

    await prisma.exchangeRate.createMany({ data: batch, skipDuplicates: true });
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
