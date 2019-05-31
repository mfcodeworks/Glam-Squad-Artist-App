import * as storage from '../storage';
import * as ui from '../ui';
import * as api from '../api';

// Track highest notification for file downloads
let downloadId = 0,
    progressEv,
    progressInterval;
// Email Regex
const emailReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Change Cordova URL
export function load(url) {
    window.location.assign(url);
}

// Get user locale language
export function getLanguage() {
    if (navigator.languages !== undefined) {
        return navigator.languages[0];
    } else {
        return navigator.language;
    }
}

// Verify form inputs
export function validate(type, input) {
    switch (type) {
        case 'username':
        case 'password':
            if (input.length < 5) return false;
            break;

        case 'date':
        case 'time':
            if (input.length < 1) return false;
            break;

        case 'clients':
            if (input < 1) return false;
            break;

        case 'email':
            return emailReg.test(input);

        default:
            return true;
    }
    return true;
}

export function validatePassword(password1, password2) {
    return (password1 === password2);
}

export function authenticatedCheck() {
    // Logout handler
    $('[data-role="logout"]').click(() => {
        storage.remove('login')
        .then(() => {
            load('signin.html');
        });
    });

    return api.isAuthenticated()
    .then((r) => {
        if (r) ui.endPageLoading();
        else load('signin.html');
    });
}

export function makeAnalytics(receipts) {
    /**
     * Analytics code
     */

    // Log receipts
    console.log(receipts);

    // Set data variables
    const today = new Date(),
        todayMonth = today.getMonth(),
        todayYear = today.getFullYear(),
        previousYear = today.getFullYear() - 1,
        scatterX = {},
        scatterY = {},
        scatterArray = {},
        barArray = {};
    let pieJobs = 0,
        pieEarnings = 0;

    // If no previous bookings return empty object
    if (receipts.length === 0) {
        const empty = {
            scatterArray: {},
            barArray: {},
            pieJobs: 0,
            pieEarnings: 0,
        };
        empty.scatterArray[todayYear] = [[], [], [], [], [], [], [], [], [], [], [], []];
        empty.barArray[todayYear] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        empty.barArray[previousYear] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        return empty;
    }

    // Loop through available receipts
    receipts.forEach((receipt) => {
        // Create receipt datetime object
        receipt.payment_datetime = new Date(receipt.payment_datetime);

        // Set receipt date constants
        const paymentMonth = receipt.payment_datetime.getMonth(),
            paymentYear = receipt.payment_datetime.getFullYear();

        // Instantiate analytic array values
        scatterX.hasOwnProperty(paymentYear) === false ?
            scatterX[paymentYear] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : null;
        scatterY.hasOwnProperty(paymentYear) === false ?
            scatterY[paymentYear] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : null;
        scatterArray.hasOwnProperty(paymentYear) === false ?
            scatterArray[paymentYear] = [
                [], [], [], [], [], [], [], [], [], [], [], [],
            ] : null;
        barArray.hasOwnProperty(paymentYear) === false ?
            barArray[paymentYear] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : null;

        /**
         * Analytics calculations
         */

        // For bar array at year/month index <[2019][01]> add a booking
        barArray[paymentYear][paymentMonth]++;

        // For scatter chart add 1 job to X, add earnings to Y
        scatterX[paymentYear][paymentMonth]++;
        scatterY[paymentYear][paymentMonth] += receipt.payment_amount;

        // Push object { x: total jobs so far, y: total earnings so far} to scatter data
        scatterArray[paymentYear][paymentMonth].push({
            x: scatterX[paymentYear][paymentMonth],
            y: scatterY[paymentYear][paymentMonth],
        });
    });

    /**
     * Simple pie chart data
     */

    // Divide this months jobs by last months for a percentage, unless last month is 0
    pieJobs = (!scatterArray[todayYear][todayMonth - 1].last()) ?
        100 : (scatterArray[todayYear][todayMonth].last().x / scatterArray[todayYear][todayMonth - 1].last().x) * 100;

    // Divide this months earnings by last months for a total earnings percentage, unless last month is 0
    pieEarnings = (!scatterArray[todayYear][todayMonth - 1].last()) ?
        100 : (scatterArray[todayYear][todayMonth].last().y / scatterArray[todayYear][todayMonth - 1].last().y) * 100;

    // If not existing, create previous yeara data for bar chart
    barArray.hasOwnProperty(todayYear - 1) === false ?
        barArray[todayYear - 1] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : null;

    // Output data in object
    return {
        scatterArray,
        barArray,
        pieJobs,
        pieEarnings,
    };
}

export function fillUserData() {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        $('[data-src="user-photo"]').attr('src', u.profile_photo);
        $('[data-src="user-name"]').html(u.username);
    });
}

export function checkChatMedia() {
    // Store input and file
    const input = $(this);
    const media = input[0].files[0];

    console.log(media);

    // Check filesize
    if (media && media.size > 20971520) {
        navigator.notification.alert(
            'Filesize cannot exceed 20MB.',
            null,
            'File too large',
            'Okay'
        );
    }

    // If media removed exit
    if (!media) {
        $('textarea.type_msg').val('');
        $('textarea.type_msg').prop('disabled', false);
        return;
    }
    // Disable text input
    $('textarea.type_msg').attr('placeholder', 'Send media?');
    $('textarea.type_msg').prop('disabled', true);
}

// Read Base64 String to Blob
export function readBase64(string) {
    return fetch(string)
    .then((res) => {
        return res.blob();
    });
}

// Create directory on device
function createDir(rootDir, newDir) {
    // Split dir path into seperate dirs
    const dirs = newDir.split('/');

    // Recurse through dirs
    const dirMaking = dirs.reduce((path, currentDir) => {
        // After each
        return path.then((dirEntry) => {
            // If first dir is empty (proceeding slash) move to next dir
            if (!currentDir) return dirEntry;

            // Make dir under last parent dir
            return new Promise((resolve, reject) => {
                dirEntry.getDirectory(
                    currentDir,
                    {
                        create: true,
                        exclusive: false,
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
    }, new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(
            rootDir,
            function (fs) {
                console.log(fs);
                resolve(fs.filesystem.root);
            },
            function (err) {
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
    return new Promise((resolve, reject) => {
        dirEntry.getFile(
            fileName,
            {
                create: true,
                exclusive: false,
            }, (fileEntry) => {
                console.log(fileEntry);
                resolve(fileEntry);
            }, (err) => {
                console.warn(err);
                reject(err);
            }
        );
    });
}

// Write to file on device
function writeFile(fileEntry, data, id = 0) {
    return new Promise((resolve, reject) => {
        // Create a FileWriter object for FileEntry
        fileEntry.createWriter((fileWriter) => {
            fileWriter.onwriteend = (e) => {
                console.log('Successful file write');
                resolve(e);
            };

            fileWriter.onerror = function (e) {
                console.log('Failed file write');
                console.log(e);
                reject(e);
            };

            cordova.plugins.notification.local.on(
                'cancel', (notification) => {
                    console.log(notification);
                    fileWriter.abort();
                    cordova.plugins.notification.local.clear({ id });
                }
            );

            fileWriter.write(data);

            cordova.plugins.notification.local.update({
                id,
                progressBar: { indeterminate: true },
                clock: false,
                vibrate: false,
                sound: false,
            });
        });
    });
}

// Create device media directory
export function createMediaDir() {
    let storageLocation;

    // Set file save location
    switch (device.platform) {
        case 'Android':
            storageLocation = `${cordova.file.externalRootDirectory}Glam Squad/Glam Squad Media`;
            console.log(cordova.file.externalRootDirectory);
            console.log(storageLocation);
            return createDir(cordova.file.externalRootDirectory, 'Glam Squad/Glam Squad Media');

        case 'browser':
            console.log('Browser detected, downloads will be done through browser.');
            return null;

        case 'iOS':
            storageLocation = cordova.file.documentsDirectory;
            console.log(storageLocation);
            return storageLocation;

        default:
            return null;
    }
}

// FileTransfer URI download for external files
function fileTransferDownload(uri, filename, id) {
    const fileTransfer = new FileTransfer();

    // Do file write
    return createMediaDir()
    .then((dir) => {
        return createFile(dir, filename);
    })
    .then((fileEntry) => {
        return new Promise((resolve, reject) => {
            // Begin file download
            fileTransfer.download(
                uri,
                fileEntry.toURL(),
                (entry) => {
                    console.log(entry);
                    clearInterval(progressInterval);
                    resolve(entry);
                },
                (error) => {
                    console.warn(error);
                    clearInterval(progressInterval);
                    reject(error);
                },
                false,
                {}
            );
            // Update download progress notification
            fileTransfer.onprogress = (progressEvent) => {
                // Set progress event const
                progressEv = progressEvent;

                if (!progressInterval) {
                    // Update progress
                    progressInterval = setInterval(() => {
                        let loaded;
                        // Update with download progress
                        (progressEv.lengthComputable) ? loaded = Math.floor(progressEv.loaded / (progressEv.total * 100)) : loaded = 20;
                        console.log(loaded);
                        cordova.plugins.notification.local.update({
                            id,
                            progressBar: { value: loaded },
                            clock: false,
                            vibrate: false,
                            sound: false,
                        });
                        if (loaded > 99) clearInterval(progressInterval);
                    // Run every 1 second
                    }, 1 * 1000);
                }
            };
            // On cancel abort download
            cordova.plugins.notification.local.on(
                'cancel',
                (notification) => {
                    console.log(notification);
                    fileTransfer.abort();
                    cordova.plugins.notification.local.clear({ id });
                }
            );
        });
    });
}

// Download file from URI
export function downloadFile(uri, filename) {
    const id = downloadId++;
    let data;

    // Create download notification
    cordova.plugins.notification.local.schedule({
        id,
        smallIcon: 'res://img/logo.png',
        text: filename,
        title: 'Downloading',
        progressBar: { value: 0 },
        actions: [{
            id: 'cancel',
            title: 'Cancel',
        }],
        clock: false,
        foreground: true,
        color: 'black',
        vibrate: false,
        sound: false,
        sticky: true,
    });

    // Check if base64 or URI
    switch (uri.indexOf('data') === 0) {
        // For base64 read base64 to file
        case true:
            return readBase64(uri)
            .then((blob) => {
                data = blob;
            })
            .then(createMediaDir)
            .then((dir) => {
                return createFile(dir, filename, data);
            })
            .then((fileEntry) => {
                return writeFile(fileEntry, data, id);
            })
            .then(() => {
                cordova.plugins.notification.local.schedule({
                    id,
                    smallIcon: 'res://img/logo.png',
                    text: filename,
                    title: 'Complete',
                    progressBar: { enabled: false },
                    actions: [],
                    clock: false,
                    foreground: true,
                    color: 'black',
                    vibrate: false,
                    autoClear: true,
                });
            })
            .catch((err) => {
                console.warn(err);
                cordova.plugins.notification.local.schedule({
                    id,
                    smallIcon: 'res://img/logo.png',
                    text: JSON.stringify(err),
                    title: 'Error',
                    progressBar: { enabled: false },
                    actions: [],
                    clock: false,
                    foreground: true,
                    color: 'black',
                    vibrate: false,
                    autoClear: true,
                });
            });

        // For non-base64 download file URI to file
        case false:
            console.log('File transfer initiated');
            return fileTransferDownload(uri, filename, id)
            .then(() => {
                cordova.plugins.notification.local.schedule({
                    id,
                    smallIcon: 'res://img/logo.png',
                    text: filename,
                    title: 'Complete',
                    progressBar: { enabled: false },
                    actions: [],
                    clock: false,
                    foreground: true,
                    color: 'black',
                    vibrate: false,
                    autoClear: true,
                });
            })
            .catch((err) => {
                console.warn(err);
                cordova.plugins.notification.local.schedule({
                    id,
                    smallIcon: 'res://img/logo.png',
                    text: JSON.stringify(err),
                    title: 'Error',
                    progressBar: { enabled: false },
                    actions: [],
                    clock: false,
                    foreground: true,
                    color: 'black',
                    vibrate: false,
                    autoClear: true,
                });
            });

        default:
            navigator.notification.alert(
                `Error occured downloading file.\nFile: ${filename} <${uri}>`,
                null,
                'Download Error',
                'Okay'
            );
            break;
    }
}

export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => { resolve(reader.result); };
        reader.readAsDataURL(file);
    });
}

export function readFileURL(url) {
    return fetch(url,
    {
        method: 'GET',
        // mode: 'no-cors',
        cache: 'no-cache',
        redirect: 'follow',
    })
    .then((r) => { return r.blob(); })
    .then((blob) => { return readFile(blob); });
}

export function fileDownloadHandler() {
    $(document).on('click', 'a[download]', (e) => {
        e.preventDefault();
        const file = $(e.currentTarget);
        const uri = file.attr('href');
        const filename = file.attr('download');
        downloadFile(uri, filename);
    });
}

export function monitorNetwork() {
    const netMon = setInterval(
        () => {
            if (navigator.connection.type === Connection.NONE) {
                clearInterval(netMon);
                navigator.notification.alert(
                    'No network connection detected. Please connect to internet to continue using app.',
                    monitorNetwork,
                    'No Network Connection',
                    'Okay'
                );
            }
        },
        // Run every 5 seconds
        (5 * 1000)
    );
}
