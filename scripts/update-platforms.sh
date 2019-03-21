#!/bin/bash
cordova plugin save
shx rm -rf ./platforms/android
shx rm -rf ./platforms/ios
cordova platform rm android
cordova platform add android
cordova platform rm ios
cordova platform add ios
cordova platform update browser
