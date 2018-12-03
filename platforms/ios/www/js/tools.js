import * as session from './session';

// Change Cordova URL
export function load(url) {
    window.location.assign(url);
};

// Logout user
export function handleLogout() {
    return new Promise(function(resolve) {
        $("#btn-logout").click(function() {
            session.remove("login")
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