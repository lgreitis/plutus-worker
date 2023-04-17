import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";
import prisma from "src/config/prisma";
import { SlashCommand } from "src/discordTypes";

export const inventoryValue: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("value")
    .setDescription("Shows your inventory value"),
  execute: async (interaction) => {
    const user = await prisma.user.findFirst({
      where: {
        accounts: {
          some: { provider: "discord", providerAccountId: interaction.user.id },
        },
      },
      include: {
        Inventory: { include: { UserItem: { include: { Item: true } } } },
      },
    });

    if (!user || !user.Inventory) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Plutus" })
            .setDescription(
              `We can't seem to find you on plutus.lukasgreicius.com, make sure that you're registered before using this command.`
            ),
        ],
      });

      return;
    }

    let worth = 0;
    let invested = 0;

    for (const item of user.Inventory.UserItem) {
      invested += (item.buyPrice || 0) * item.quantity;
      worth += (item.Item.lastPrice || 0) * item.quantity;
    }

    const currencyFormatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: user.currency || "USD",
    });

    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { timestamp: "desc" },
      where: { conversionCurrency: user.currency },
    });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: "Plutus" })
          .setTitle(`${interaction.user.username} inventory value:`)
          .setFields([
            {
              name: "Invested",
              value: currencyFormatter.format(invested),
              inline: true,
            },
            {
              name: "Worth",
              value: currencyFormatter.format(
                worth * (exchangeRate?.rate || 1)
              ),
              inline: true,
            },
            {
              name: "Difference",
              value: currencyFormatter.format(
                worth * (exchangeRate?.rate || 1) - invested
              ),
              inline: true,
            },
          ]),
      ],
    });
  },
  cooldown: 10,
};
