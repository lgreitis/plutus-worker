import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { inventoryValue } from "src/bot/commands/inventoryValue";
import { itemValue } from "src/bot/commands/itemValue";
import { pingCommand } from "src/bot/commands/ping";
import { DISCORD_APPLICATION_ID, DISCORD_TOKEN } from "src/constants";
import { SlashCommand } from "src/discordTypes";

export const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const discordConfig = async () => {
  const commands = [pingCommand, inventoryValue, itemValue];
  discordClient.slashCommands = new Collection<string, SlashCommand>();

  for (const command of commands) {
    discordClient.slashCommands.set(command.command.name, command);
  }

  const rest = new REST().setToken(DISCORD_TOKEN);

  await rest.put(Routes.applicationCommands(DISCORD_APPLICATION_ID), {
    body: commands.map((command) => command.command.toJSON()),
  });

  await discordClient.login(DISCORD_TOKEN);
};

export default discordConfig;

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.slashCommands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await (interaction.replied || interaction.deferred
      ? interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        })
      : interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        }));
  }
});

discordClient.on("ready", () => {
  console.log("Discord bot running.");
});
