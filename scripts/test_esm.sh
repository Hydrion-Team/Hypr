#!/bin/bash

rm -rf dist
rm -rf tsconfig.tsbuildinfo
tsc

node test/esm/client.mjs
