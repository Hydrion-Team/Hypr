import { HyprEvents, HyprSelfbot } from "../../dist/index.js";
import config from "../config.json"  with { type: 'json' };
import { dirname } from "path";
const client = new HyprSelfbot({ loadPlugins: true, baseDir: dirname(import.meta.url) });
client.on("ready", () => console.log("OwO"))
client.on(HyprEvents.PluginFailed, (error) => console.log(error))
client.on(HyprEvents.PluginLoaded, (plugin) => console.log(plugin.name, plugin.options))
client.on("PluginRegisterError", (error) => console.log(error))
client.login(config.TOKEN)