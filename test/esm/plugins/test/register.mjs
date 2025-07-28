import { Plugin, HyprClient } from "../../../../dist/index.js"

const name = "Test Plugin"
new Plugin(name, (client) => {
    if (client.isSelfbotInstance()) {

    } else {
        console.log("Oha")
    }
})