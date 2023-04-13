import discordConfig from "src/config/discord";
import prisma from "src/config/prisma";
import "src/constants";

const main = async () => {
  await discordConfig();
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
