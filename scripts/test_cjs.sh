#!/bin/bash

rm -rf dist
rm -rf tsconfig.tsbuildinfo
npm run build
node test/cjs/client.cjs