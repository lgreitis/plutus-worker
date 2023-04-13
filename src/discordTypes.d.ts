import {
  AutocompleteInteraction,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export interface SlashCommand {
  command: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => void;
  autocomplete?: (interaction: AutocompleteInteraction) => void;
  cooldown?: number; // in seconds
}

declare module "discord.js" {
  export interface Client {
    slashCommands: Collection<string, SlashCommand>;
  }
}
