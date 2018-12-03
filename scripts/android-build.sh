#!/bin/bash
./scripts/bundle-js.sh
cordova build android -- --gradleArg=-PcdvMinSdkVersion=22