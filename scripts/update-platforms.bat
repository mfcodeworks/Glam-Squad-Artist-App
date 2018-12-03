CALL cordova plugin save
rmdir node_modules\cordova-android /s /q
rmdir node_modules\cordova-ios /s /q
del node_modules\.bin\cordova-browser /q
CALL cordova platform rm android
CALL cordova platform add android
CALL cordova platform rm ios
CALL cordova platform add ios
CALL cordova platform update browser