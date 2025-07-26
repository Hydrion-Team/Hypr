import { Client } from "discord.js-selfbot-v13";

export type Command = {
  name: string;
  description?: string;
  execute: (message: any, args: string[], client: Client) => void;
};

export type Plugin = {
  name: string;
  commands?: Command[];
  onLoad?: (client: Client) => void;
  onUnload?: () => void;
};

export type Config = {
  token: string;
  prefix: string;
  pluginPaths: string[];
};
