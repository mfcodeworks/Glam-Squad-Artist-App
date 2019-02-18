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

// To download a file directly simply <a href="<base64string>" download="<filename.ext>"></a>
export function readBase64(string, filename, mimeType){
    return (
        fetch(string)
        .then(function(res){
            return res.arrayBuffer();
        })
        .then(function(buf){
            return new File([buf], filename, {type:mimeType});
        })
    );
}

// TODO: Implement file downloading for Chat
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