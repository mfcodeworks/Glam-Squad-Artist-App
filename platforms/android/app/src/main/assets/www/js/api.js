// imports
import * as session from './session';
import * as tools from './tools';
import * as CryptoJS from 'crypto-js';
import * as push from './push';
import * as ui from './ui-tools';

// NR Server Endpoint
const endpoint = 'https://glam-squad-db.nygmarosebeauty.com/';
const apiSecret = '1GSqDjCYAXeBLuLLVBx3bXlpC5NKUPqC';

export function registerUser() {
    // Verify inputs
    $("#reg-username").removeClass("is-invalid");
    $("#reg-password").removeClass("is-invalid");
    $("#reg-email").removeClass("is-invalid");
    if(!tools.validate("username",$("#reg-username").val())) {
        $("#reg-username").addClass("is-invalid");
        return;
    }
    if(!tools.validate("email",$("#reg-email").val())) {
        $("#reg-email").addClass("is-invalid");
        return;
    }
    if(!tools.validate("password",$("#reg-password").val())) {
        $("#reg-password").addClass("is-invalid");
        return;
    }
    if(!tools.validatePassword($("#reg-password").val(),$("#reg-password2").val())) {
        $("#reg-password").addClass("is-invalid");
        return;
    }

    // Validation succeeded, begin loading for user
    ui.startLoader();

    // Create a registration form
    var form = {
        formContext: "artist-registration",
        username: $("#reg-username").val(),
        email: $("#reg-email").val(),
        password: $("#reg-password").val()
    };

    // POST to API server
    postData(form)
        .then( function(r) {
            ui.endLoader();

            switch (r.response) {
                // If successful alert
                case true:
                    navigator.notification.alert(
                        "Registration received. You will receive an email shortly notifying you of your next step.",
                        null,
                        "Registration Success",
                        "Okay"
                    );
                    $("#btn-cancel-register").click();
                    break;

                // If SQL unsuccessful alert
                case false:
                    navigator.notification.alert(
                        "An error occured, please try again later.\n"+JSON.stringify(r.error),
                        null,
                        "Error",
                        "Okay"
                    );
                    break;

                default:
                // If malformed/null response alert error
                    navigator.notification.alert(
                        "An unknown error occured. Please try agian later.\n"+JSON.stringify(r),
                        null,
                        "Error",
                        "Okay"
                    );
                    break;
            }
        }, function(err) {
            ui.endLoader();
            navigator.notification.alert(
                "An error occured, please try again later.\n" + err,
                null,
                "Error",
                "Okay"
            );
        });
};

export function authenticateUser() {
    // Verify inputs
    $("#login-username").removeClass("is-invalid");
    $("#login-password").removeClass("is-invalid");
    if(!tools.validate("username",$("#login-username").val())) {
        $("#login-username").addClass("is-invalid");
        return;
    }
    if(!tools.validate("password",$("#login-password").val())) {
        $("#login-password").addClass("is-invalid");
        return;
    }

    // Create authentication form
    ui.startLoader();
    var form = {
        formContext: "artist-login",
        username: $("#login-username").val(),
        password: $("#login-password").val()
    };

    // POST to API server
    return postData(form)
        .then( function(r) {
            ui.endLoader();

            switch (r.response) {
                case true:
                    var user = r.data[0];
                    var data = {
                        userId: user.id,
                        username: user.username,
                        usernameHash: user.usernameHash,
                        email: user.email,
                        profilePhoto: user.profile_photo,
                        stripeId: user.stripe_customer_id,
                    };

                    console.log("Making session: "+JSON.stringify(data,null,4));

                    session.save("login",JSON.stringify(data))
                        .then(function(res) {
                            console.log("Session save response: "+res);
                            if(res) tools.load("map.html");
                        }, function(err) {
                            console.log(err);
                        });
                    break;

                case false:
                    // If SQL error login incorrect
                    if(r.error == "Incorrect login details.") {
                        navigator.notification.alert(
                            "Incorrect login details.",
                            null,
                            "Incorrect Login",
                            "Okay"
                        );
                    }
                    else {
                        // Else if SQL error then API incorrect, alert error
                        navigator.notification.alert(
                            "Error occured, please try again later.\n"+JSON.stringify(r.error,null,2),
                            null,
                            "Error",
                            "Okay"
                        );
                        break;
                    }
                    break;

                default:
                    // If response malformed/null alert error
                    navigator.notification.alert(
                        "An unknown error occured. Please try agian later.\n"+JSON.stringify(r,null,2),
                        null,
                        "Error",
                        "Okay"
                    );
                    break;
            }
        }, function(e) {
            ui.endLoader();
            navigator.notification.alert(
                "Error occured, please try again later.\n"+e,
                null,
                "Error",
                "Okay"
            );
        });
};

export function isAuthenticated() {
    // Get login session
    return new Promise(function(resolve) {
        session.get("login")
            .then(function(res) {
                return JSON.parse(res);
            })
            .then(function(res) {
                if(res == null) {
                    resolve(false);
                    return;
                }
    
                // Build validation form
                var form = {
                    formContext: "artist-session-check",
                    userId: parseInt(res.userId),
                    usernameHash: res.usernameHash
                };
            
                // Return validation response
                postData(form)
                    .then(function(res) {
                        console.log("User authenticated: " + JSON.stringify(res));
                        resolve(res);
                    });
            });
    })
}

export function getFcmTopics(type = "artist") {
    return session.get("login")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(u) {
            // Save form
            var form = {
                formContext: "fcm-topic-fetch",
                type: type,
                userId: u.userId
            };
        
            postData(form)
                .then(function(r) {
                    console.log("FCM Topics' Retreived.");
                    console.log(r);

                    // Subscribe all topics
                    if(r.data) {
                        var topics = r.data;
                        for(var i = 0; i < topics.length; i++) {
                            push.subscribe(topics[i].fcm_topic);
                        }
                    }
                }, function(err) {
                    console.log("Error retreiving FCM Topics':\n" + err.error_code + ": " + err.error);
                });
        });
}

export function saveFcmToken(token) {
    return session.get("login")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(u) {

            // Save ID to JSON
            var form = {
                token: token,
                userId: parseInt(u.userId),
                formContext: "fcm-token-registration",
            };

            // Send to API Server
            postData(form)
                .then(function(r) {
                    switch(r.response) {
                        case true:
                            console.log("Saved FCM Token '" + token + "'");
                            break;
                        case false:
                            console.log("Failed to save FCM Token '" + token + "'");
                            console.log(r.error_code + ": " + r.error);
                            break;
                        default:
                            console.log("Unknown error occured communicating with API server.");
                            break;
                    }
                });
        });
}

export function saveFcmTopic(topic, type = "artist") {
    return session.get("login")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(u) {

            // Save ID to JSON
            var form = {
                topic: topic,
                type: type,
                userId: parseInt(u.userId),
                formContext: "fcm-topic-registration",
            };

            // Send to API Server
            postData(form)
                .then(function(r) {
                    switch(r.response) {
                        case true:
                            console.log("Saved FCM Topic '" + topic + "'");
                            break;
                        case false:
                            console.log("Failed to save FCM ID '" + topic + "'");
                            console.log(r.error_code + ": " + r.error);
                            break;
                        default:
                            console.log("Unknown error occured communicating with API server.");
                            break;
                    }
                });
        });
}

export function fillUserInfo() {
    $("#new-username").val("");
    $("#new-email").val("");
    $("#new-password").val("");
    $("#new-password2").val("");

    // Update user info
    session.get("login")
        .then(function(res) {
            var data = JSON.parse(res);
            console.log(data);
            $("#new-username").val(data.username);
            $("#new-email").val(data.email);
        });
}

export function updateUser() {
    $(".alert").remove();

    // Verify inputs
    $("#new-username").removeClass("is-invalid");
    $("#new-email").removeClass("is-invalid");
    $("#new-password").removeClass("is-invalid");
    if(!tools.validate("username",$("#new-username").val())) {
        $("#new-username").addClass("is-invalid");
        return;
    }
    if(!tools.validate("email",$("#new-email").val())) {
        $("#new-email").addClass("is-invalid");
        return;
    }
    if(!tools.validatePassword($("#new-password").val(), $("#new-password2").val())){
        $("#new-password").addClass("is-invalid");
        return;
    }
    
    ui.startLoader();
    
    // Update user info
    session.get("login")
        .then(function(res) {
            var data = JSON.parse(res);
            
            var form = {
                formContext: "artist-info-update",
                userId: parseInt(data.userId),
                username: $("#new-username").val(),
                email: $("#new-email").val(),
                password: $("#new-password").val()
            }
        
            postData(form)
                .then(function(r) {
                    ui.endLoader();

                    console.log("User update response:\n" + JSON.stringify(r,null,2));
                    
                    if(r.response == true) {
                        session.remove("login")
                            .then(function() {
                                var u = r.data[0];
                                var data = {
                                    userId: u.id,
                                    username: u.username,
                                    usernameHash: u.usernameHash,
                                    email: u.email,
                                    profilePhoto: u.profile_photo,
                                    stripeId: u.stripe_customer_id
                                };

                                console.log(data);

                                session.save("login",JSON.stringify(data));

                                fillUserInfo();
                            });
                        $("#alert-container").append("\
                            <div class='alert alert-light alert-custom' role='alert'>\
                                Successfully updated user info. \
                            </div> \
                        ");
                    }
                    else {
                        navigator.notification.alert(
                            "An error occured, please try again later.\n"+JSON.stringify(res.error),
                            null,
                            "Error",
                            "Okay"
                        );
                    }
                }, function(err) {
                    console.log(err);
                    ui.endLoader();
                    $("#alert-container").append("\
                        <div class='alert alert-danger alert-custom' role='alert'>\
                            Failed to update user info. \
                        </div> \
                    ");
                }).then(function() {
                    // Remove aler tafter 5 seconds
                    setTimeout(function() {
                        $(".alert").fadeOut();
                    }, (1000 * 7));
                });
        });
}

function postData(form) {
    var message = JSON.stringify(form);

    var hmac = getHMAC(message);

    return new Promise(function(resolve, reject) {
        $.ajax({
            method: "POST",
            url: endpoint,
            headers: {
                'NR-HASH': hmac
            },
            data: message,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            // timeout 300 seconds in milliseconds
            timeout: (300 * 1000),
            success: function(res) {
                resolve(res);
            },
            error: function(xhr,status,err) {
                reject(err);
            }
        });
    });
}

// Create HMAC for message
function getHMAC(message) {
    return CryptoJS.HmacSHA512(message, apiSecret);
}