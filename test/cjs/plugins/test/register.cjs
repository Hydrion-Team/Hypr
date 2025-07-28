const { Plugin, HyprClient } = require("../../../../dist")

const name = "Test Plugin"
new Plugin(name, (client) => {
    if (client.isSelfbotInstance()) {

    } else {
        console.log("Oha")
    }
})