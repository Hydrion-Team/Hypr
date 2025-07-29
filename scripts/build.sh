#!/bin/bash
rm -rf dist
rm -rf tsconfig.tsbuildinfo
tsc
node scripts/patch.mjs "$1"