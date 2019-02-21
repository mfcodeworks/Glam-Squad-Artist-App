/* eslint-disable no-alert */
import * as storage from './storage';

// Change Cordova URL
export function load(url) {
    window.location.assign(url);
}

// Logout user
export function handleLogout() {
    return new Promise(function(resolve) {
        $("#btn-logout").click(function() {
            storage.remove("login")
                .then(function(res) {
                    if(res) load("login.html");
                });
        });
        resolve(true);
    });
};

// Verify form inputs
export function validate(type, input) {
    switch (type) {
        case "username":
        case "password":
            if(input.length < 4) return false;
            break;

        case "date":
        case "time":
            if(input.length < 1) return false;
            break;

        case "clients":
            if(input < 1) return false;
            break;

        case "email":
            var emailReg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(!emailReg.test(input)) return false;
            break;
    }
    return true;
}

export function validatePassword(password1, password2) {
    if(password1 === password2) return true;
    return false;
}

export function checkChatMedia() {
    // Store input and file
    var input = $(this);
    var media = input[0].files[0];

    console.log(media);

    // Check filesize
    if(media && media.size > 20971520) {
        input.val(null);
        navigator.notification.alert(
            "Filesize cannot exceed 20MB.",
            null,
            "File too large",
            "Okay"
        );
        input.val(null);
        console.log(input.val());
    }

    // If media removed exit
    if(!media) {
        $("textarea.type_msg").val("");
        $("textarea.type_msg").prop("disabled", false);
        return;
    }
    // Disable text input
    $("textarea.type_msg").val("Send media?");
    $("textarea.type_msg").prop("disabled", true);
}

// Read Base64 String to Blob
export function readBase64(string){
    return (
        fetch(string)
        .then(function(res){
            return res.blob();
        })
    );
}

// Create device media directory
export function createMediaDir() {
    var storageLocation;

    // Set file save location
    switch (device.platform) {
        case "Android":
            storageLocation = `${cordova.file.externalRootDirectory}GlamSquad/media`;
            console.log(cordova.file.externalRootDirectory);
            console.log(storageLocation);
            return createDir(cordova.file.externalRootDirectory, "GlamSquad/media");

        case "browser":
            storageLocation = "cdvfile://localhost/persistent/GlamSquad";
            console.log(storageLocation);
            return createDir("cdvfile://localhost/persistent", "GlamSquad");

        case "iOS":
            storageLocation = cordova.file.documentsDirectory;
            console.log(storageLocation);
            return storageLocation;
    }
}

// Create directory on device
function createDir(rootDir, newDir) {
    // Split dir path into seperate dirs
    var dirs = newDir.split("/");

    // Recurse through dirs
    var dirMaking = dirs.reduce(function(path, currentDir) {
        // After each 
        return path.then(function(dirEntry) {
            // If first dir is empty (proceeding slash) move to next dir
            if(!currentDir) return dirEntry;
    
            // Make dir under last parent dir
            return new Promise(function(resolve, reject) {
                dirEntry.getDirectory(
                    currentDir, 
                    {
                        create: true, 
                        exclusive: false
                    }, function success(e) {
                        console.log(e);
                        resolve(e);
                    }, function error(e) {
                        console.warn(e);
                        reject(e);
                    }
                );
            });
        });

    // rootDir should already exist e.g. file:/// or cdvfile://localhost/
    }, new Promise(function(resolve, reject) {
        window.resolveLocalFileSystemURL(
            rootDir,  
            function (fs) {
                console.log(fs);
                resolve(fs.filesystem.root);
            },
            function(err) {
                console.warn(err);
                reject(err);
            }
        );
    }));

    // Return result
    return dirMaking;
}

// Create file on device
function createFile(dirEntry, fileName) {
    return new Promise(function(resolve, reject) {
        dirEntry.getFile(
            fileName, 
            {
                create: true, 
                exclusive: false
            }, function(fileEntry) {
                console.log(fileEntry);
                resolve(fileEntry);
            }, function(err) {
                console.warn(err);
                reject(err);
            }
        );
    });
}

// Write to file on device
function writeFile(fileEntry, data) {
    console.log(fileEntry);
    console.log(data);

    return new Promise(function(resolve, reject) {
        // Create a FileWriter object for FileEntry
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function(e) {
                console.log("Successful file write");
                resolve(e);
            };
    
            fileWriter.onerror = function (e) {
                console.log("Failed file write");
                console.log(e);
                reject(e);
            };
    
            fileWriter.write(data);
        });
    })
}

// Download file from URI
export function downloadFile(uri, filename) {
    var storageLocation;
    
    // Set file save location
    switch (device.platform) {
        case "Android":
            storageLocation = `${cordova.file.externalRootDirectory}GlamSquad/media`;
            console.log(storageLocation);
            break;

        case "browser":
            storageLocation = "cdvfile://localhost/persistent/GlamSquad/media";
            console.log(storageLocation);
            break;

        case "iOS":
            storageLocation = cordova.file.documentsDirectory;
            console.log(storageLocation);
            break;
    }

    // Check if base64 or URI
    switch(uri.indexOf("data") === 0) {
        // For base64 read base64 to file
        case true:
            var data;
            return readBase64(uri)
            .then(function(blob) {
                data = blob;
            })
            .then(createMediaDir)
            .then(function(dir) {
                return createFile(dir, filename, data);
            })
            .then(function(fileEntry) {
                return writeFile(fileEntry, data);
            });
        
        // For non-base64 download file URI to file
        case false:
            console.log("File transfer initiated");
            return fileTransferDownload(uri, filename);
    }
}

// FileTransfer URI download for external files
function fileTransferDownload(uri, filename) {
    var fileTransfer = new FileTransfer();

    // Do file write
    return createMediaDir()
    .then(function(dir) {
        return createFile(dir, filename);
    })
    .then(function(fileEntry) {
        return fileTransfer.download(
            uri,
            fileEntry.toURL(),
            function(entry) {
                console.log(entry);
            },
            function(error) {
                console.warn(error);
            },
            false,
            {}
        );
    });
}

export function readFileURL(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = 'blob';
        xhr.onreadystatechange = function() {
            if(this.readyState == 4 && this.status == 200) {
                var res = this.response;
                var reader = new FileReader();
                reader.readAsDataURL(res); 
                reader.onloadend = function(e) {
                    resolve(e.target.result);
                }
                reader.onerror = function(e) {
                    reader.abort();
                    reject(Error(reader.error));
                }
            }
        }
        // Timeout after 1 minute
        xhr.timeout = (60 * 1000);
        xhr.send(null);
    });
}

export function readFile(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
            resolve(e.target.result);
        }

        reader.onerror = function(e) {
            reader.abort();
            reject(Error(reader.error));
        }
                
        reader.readAsDataURL(file);
    });
}

export function monitorNetwork() {
    return new Promise(function(resolve) {
        setInterval(
            onNoNetwork,
            (5 * 1000)
        );
        if(onNoNetwork()) resolve(true);
        else reject(new Error("No network connection."));
    });
}
function onNoNetwork() {
    if(navigator.connection.type == Connection.NONE) {
        navigator.notification.alert(
            "No network connection detected. Please connect to internet to continue using app.",
            onNoNetwork,
            "No Network Connection",
            "Okay"
        );
        return false;
    }
    return true;
}