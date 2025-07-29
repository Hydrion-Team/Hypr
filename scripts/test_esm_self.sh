#!/bin/bash

rm -rf dist
rm -rf tsconfig.tsbuildinfo
tsc
npm uni discord.js

node test/esm/selfbot.mjs
npm i --save-dev discord.js
