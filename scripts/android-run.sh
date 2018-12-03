#!/bin/bash
./scripts/bundle-js.sh
cordova run android -- --gradleArg=-PcdvMinSdkVersion=22