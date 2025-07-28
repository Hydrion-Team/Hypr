import { GatewayIntentBits } from "discord.js";
import { HyprClient, HyprEvents } from "../../dist/esm/index.js";
import config from "../config.json"  with { type: 'json' };;
const client = new HyprClient({ intents: [GatewayIntentBits.Guilds] });
client.on("ready", () => console.log("OwO"));
client.on(HyprEvents.PluginFailed, (error) => console.log(error))

client.login(config.TOKEN)