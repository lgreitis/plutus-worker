import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";
import prisma from "src/config/prisma";
import { SlashCommand } from "src/discordTypes";

export const inventoryValue: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("value")
    .addMentionableOption((option) => {
      return option
        .setName("user")
        .setDescription("User that you want to check inventory of")
        .setRequired(false);
    })
    .setDescription("Shows your inventory value"),
  execute: async (interaction) => {
    const invokingUser = await prisma.user.findFirst({
      where: {
        accounts: {
          some: { provider: "discord", providerAccountId: interaction.user.id },
        },
      },
    });

    if (!invokingUser) {
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

    await interaction.deferReply();

    const mentionedUserUsername =
      interaction.options.get("user")?.user?.username;

    const mentionedUser = interaction.options.get("user")?.value?.toString();

    const user = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: "discord",
            providerAccountId: mentionedUser ?? interaction.user.id,
          },
        },
      },
      include: {
        Inventory: { include: { UserItem: { include: { Item: true } } } },
      },
    });

    if ((mentionedUser && !user) || (mentionedUser && !user?.public)) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: "Plutus" })
            .setDescription(
              `User not found or has set inventory visibility to private.`
            ),
        ],
      });

      return;
    }

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

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: "Plutus" })
          .setTitle(
            `${
              mentionedUserUsername ?? interaction.user.username
            } inventory value:`
          )
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
