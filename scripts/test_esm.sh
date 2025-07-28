#!/bin/bash

rm -rf dist
npm run build:esm
node test/esm/client.mjs
