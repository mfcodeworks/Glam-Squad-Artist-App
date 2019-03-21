CALL cordova plugin save
CALL shx rm -rf ./platforms/android
CALL shx rm -rf ./platforms/ios
CALL cordova platform rm android
CALL cordova platform add android
CALL cordova platform rm ios
CALL cordova platform add ios
CALL cordova platform update browser