#!/bin/bash
cordova plugin save
cordova platform rm android
cordova platform add android
cordova platform rm ios
cordova platform add ios
cordova platform update browser
