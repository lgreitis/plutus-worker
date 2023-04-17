import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { search } from "fast-fuzzy";
import prisma from "src/config/prisma";
import { SlashCommand } from "src/discordTypes";

export const itemValue: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("item")
    .addStringOption((option) => {
      return option
        .setName("name")
        .setDescription(
          "Enter the name of the item, it doesn't have to be exact"
        )
        .setRequired(true);
    })
    .setDescription("Shows information about an item"),
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

    const currency = user ? user.currency : "USD";

    const itemName = interaction.options.get("name")?.value?.toString();

    if (!itemName) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Plutus" })
            .setDescription(`Please provide an item name.`),
        ],
      });

      return;
    }

    await interaction.deferReply();

    const items = await prisma.item.findMany();
    const result = search(itemName, items, {
      keySelector: (item) => item.marketHashName,
      threshold: 0.7,
    });

    const item = result[0];

    if (!item) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Plutus" })
            .setDescription(`Sorry, couldn't find anything by that name.`),
        ],
      });

      return;
    }

    const populatedItem = await prisma.item.findUnique({
      where: { id: item.id },
      include: { ItemStatistics: true },
    });

    if (!populatedItem) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Plutus" })
            .setDescription(`Sorry, an error occured, please try again.`),
        ],
      });

      return;
    }

    const currencyFormatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
    });

    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { timestamp: "desc" },
      where: { conversionCurrency: currency },
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: "Plutus" })
          .setImage(
            `https://community.akamai.steamstatic.com/economy/image/${item.icon}/360fx360f`
          )
          .setTitle(populatedItem.marketHashName)
          .setFields([
            {
              name: "Latest Price",
              value: currencyFormatter.format(populatedItem.lastPrice || 0),
              inline: true,
            },
            {
              name: "Volume 24h",
              value: currencyFormatter.format(
                (populatedItem.ItemStatistics?.volume24h || 0) *
                  (exchangeRate?.rate || 1)
              ),
              inline: true,
            },
            {
              name: "Volume 7d",
              value: currencyFormatter.format(
                (populatedItem.ItemStatistics?.volume7d || 0) *
                  (exchangeRate?.rate || 1)
              ),
              inline: true,
            },
            {
              name: "Trend 24h",
              value: `${
                populatedItem.ItemStatistics?.change24h.toFixed(2) || 0
              }%`,
              inline: true,
            },
            {
              name: "Trend 7d",
              value: `${
                populatedItem.ItemStatistics?.change7d.toFixed(2) || 0
              }%`,
              inline: true,
            },
            {
              name: "Trend 30d",
              value: `${
                populatedItem.ItemStatistics?.change30d.toFixed(2) || 0
              }%`,
              inline: true,
            },
          ]),
      ],
    });
  },
  cooldown: 10,
};
