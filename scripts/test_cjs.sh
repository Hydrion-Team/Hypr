#!/bin/bash

rm -rf dist
npm run build:cjs
node test/cjs/client.cjs