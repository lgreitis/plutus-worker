import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "src/discordTypes";

export const pingCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's ping"),
  execute: (interaction) => {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: "Plutus" })
          .setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`),
      ],
    });
  },
  cooldown: 10,
};
