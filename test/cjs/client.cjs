const { GatewayIntentBits } = require("discord.js");
const { HyprClient, HyprEvents, Plugins,version,Logger } = require("../../dist");
const config = require("../config.json");
//Plugins.search(__dirname)
const client = new HyprClient({ intents: [GatewayIntentBits.Guilds], loadPlugins: true, baseDir: __dirname });
client.on("ready", () => console.log("OwO"))
client.on(HyprEvents.PluginFailed, (error) => console.log(error))
client.on(HyprEvents.PluginLoaded, (plugin) => console.log(plugin.name, plugin.options))
client.on("PluginRegisterError", (error) => console.log(error))
client.login(config.TOKEN)