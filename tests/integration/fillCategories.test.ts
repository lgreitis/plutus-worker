import prisma from "src/config/prisma";
import { fillItemCategories } from "src/utils/fillCategories";
import { databaseWipe } from "tests/setup/databaseWipe";
import { createBasicItem } from "tests/setup/items";
import { beforeEach, describe, expect, test } from "vitest";

describe("Fill categories util", async () => {
  beforeEach(async () => {
    await databaseWipe();
  });

  test("Can fill various categories", async () => {
    const items = [
      {
        name: "Antwerp 2022 Dust II Souvenir Package",
        shouldBe: "Container",
      },
      { name: "Revolution Case", shouldBe: "Container" },
      {
        name: "Sticker | Virtus.Pro (Holo) | Stockholm 2021",
        shouldBe: "Sticker",
      },
      {
        name: "Sir Bloody Miami Darryl | The Professionals",
        shouldBe: "Agent",
      },
      { name: "Howl Pin", shouldBe: "Collectible" },
      { name: "Patch | Lambda", shouldBe: "Patch" },
      {
        name: "StatTrak™ Music Kit | Mord Fustang, Diamonds",
        shouldBe: "MusicKit",
      },
      { name: "Sealed Graffiti | Dizzy (Cash Green)", shouldBe: "Graffiti" },
      { name: "M4A1-S | Printstream (Field-Tested)", shouldBe: "Skin" },
      {
        name: "StatTrak™ AK-47 | Nightwish (Minimal Wear)",
        shouldBe: "Skin",
      },
      {
        name: "This is a random item",
        shouldBe: "Other",
      },
    ];

    for await (const item of items) {
      await createBasicItem(item.name);
    }

    await fillItemCategories();

    for await (const item of items) {
      const databaseItem = await prisma.item.findUnique({
        where: { marketHashName: item.name },
      });

      if (!databaseItem) {
        throw new Error("Item should exist");
      }

      expect(databaseItem.type).toBe(item.shouldBe);
    }
  });
});
