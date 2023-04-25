import { ItemType } from "@prisma/client";
import axios from "axios";
import prisma from "src/config/prisma";

type GeneralizedResponse = { name: string; weapon: string }[];

// This is used to manually fill item types of items
const main = async () => {
  const items = await prisma.item.findMany();

  const skins = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/skins.json"
  );
  const stickers = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/stickers.json"
  );
  const containers = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/crates.json"
  );
  const collectibles = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/collectibles.json"
  );
  const agents = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/agents.json"
  );
  const patches = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/patches.json"
  );
  const musicKits = await axios.get<GeneralizedResponse>(
    "https://bymykel.github.io/CSGO-API/api/en/music_kits.json"
  );

  for (const [index, item] of items.entries()) {
    let type: ItemType = "Other";

    if (
      skins.data.findIndex(
        (element) =>
          element.name === trimName(item.marketName) ||
          element.weapon === trimName(item.marketName)
      ) >= 0
    ) {
      type = "Skin";
    } else if (
      stickers.data.findIndex(
        (element) => element.name === item.marketHashName
      ) >= 0
    ) {
      type = "Sticker";
    } else if (
      containers.data.findIndex(
        (element) => element.name === item.marketHashName
      ) >= 0
    ) {
      type = "Container";
    } else if (
      collectibles.data.findIndex(
        (element) => element.name === item.marketHashName
      ) >= 0
    ) {
      type = "Collectible";
    } else if (
      agents.data.findIndex(
        (element) => element.name === item.marketHashName
      ) >= 0
    ) {
      type = "Agent";
    } else if (
      patches.data.findIndex(
        (element) => element.name === item.marketHashName
      ) >= 0
    ) {
      type = "Patch";
    } else if (
      musicKits.data.findIndex(
        (element) => element.name === trimName(item.marketHashName)
      ) >= 0
    ) {
      type = "MusicKit";
    } else if (item.marketHashName.includes("Sealed Graffiti | ")) {
      type = "Graffiti";
    } else {
      type = "Other";
      //   console.log(item.marketHashName, "not found");
    }

    await prisma.item.update({
      where: { marketHashName: item.marketHashName },
      data: { type: type },
    });
    console.log(`${item.marketHashName}: ${type}, ${index}/${items.length}`);
  }

  console.log("done");
};

const trimName = (name: string) => {
  return name
    .replace("★", "")
    .replace("(Factory New)", "")
    .replace("(Minimal Wear)", "")
    .replace("(Field-Tested)", "")
    .replace("(Well-Worn)", "")
    .replace("(Battle-Scarred)", "")
    .replace("StatTrak™", "")
    .replace("M4A1-S", "M4A4")
    .replace("Souvenir", "")
    .trim();
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
