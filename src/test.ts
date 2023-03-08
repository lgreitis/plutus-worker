import axios from "axios";
import prisma from "./config/prisma";

interface Result {
  data: { market_hash_name: string; market_name: string }[];
}

const main = async () => {
  const result = await axios.get<Result>(
    "https://api.steamapis.com/market/items/730?api_key=Ax9MtbcLSctFpVOCZov8hmn9Tew"
  );

  for await (const item of result.data.data) {
    console.time(item.market_hash_name);
    if (
      await prisma.item.findUnique({
        where: { marketHashName: item.market_hash_name },
      })
    ) {
      continue;
    }
    await prisma.item.create({
      data: {
        marketHashName: item.market_hash_name,
        marketName: item.market_name,
        icon: "",
        icon_small: "",
        rarity: "BaseGrade",
        type: "Agent",
      },
    });
    console.timeEnd(item.market_hash_name);
  }

  console.log("done");
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
