#!/bin/bash

rm -rf dist
rm -rf tsconfig.tsbuildinfo
tsc
npm uni  discord.js-selfbot-v13
node test/esm/client.mjs
npm i --save-dev discord.js-selfbot-v13
