import { Plugin, HyprClient } from "../../../../dist/index.js"

const name = "Test Plugin"
new Plugin(name, (client) => {
    if (client.isSelfbotInstance()) {
      console.log("OwO")

    } else {
        console.log("Oha")
    }
})