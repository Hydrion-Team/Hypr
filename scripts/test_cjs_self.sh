#!/bin/bash

rm -rf dist
rm -rf tsconfig.tsbuildinfo
tsc
npm uni discord.js
node test/cjs/selfbot.cjs
npm i --save-dev discord.js
