const { GatewayIntentBits } = require("discord.js");
const { HyprClient, HyprEvents } = require("../../dist/cjs/index");
const config = require("../config.json")
const client = new HyprClient({ intents: [GatewayIntentBits.Guilds] });
client.on("ready", () => console.log("OwO"))
client.on(HyprEvents.PluginFailed, (error)=>console.log(error))
client.login(config.TOKEN)