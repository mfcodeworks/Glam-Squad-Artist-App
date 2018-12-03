// imports
import * as session from './session';
import * as tools from './tools';
import * as CryptoJS from 'crypto-js';
import * as push from './push';
import * as ui from './ui-tools';

// NR Server Endpoint
const endpoint = 'https://glam-squad-db.nygmarosebeauty.com/';
const apiSecret = '1GSqDjCYAXeBLuLLVBx3bXlpC5NKUPqC';

// Fill event form with default data
export function autofillEventForm(data) {
    // Get address from booking button click and set for booking dialog
    var address = data.val();
    $("#event-address").val(address);

    // Get local datetime now
    var datetime = new Date();

    /** 
     * Set time (time now + 2 hours) for booking dialog
     * Format 01:00 - 23:59
     */
    var hours = ("0" + (datetime.getHours() + 2)).slice(-2);
    var minutes = ("0" + datetime.getMinutes()).slice(-2);
    var time = hours+":"+minutes;
    $("#event-time").val(time);

    /** 
     * Set date (today) for booking dialog
     * Format 2018-01-01
     */
    var day = ("0" + datetime.getDate()).slice(-2);
    var month = ("0" + (datetime.getMonth() + 1)).slice(-2);
    var date = datetime.getFullYear()+"-"+(month)+"-"+(day) ;
    $("#event-date").val(date);
};

// Watch and process event form
export function processEventBooking() {
    // On form event submit
    $("#btn-confirm-event").click(function() {
        // Disable click to prevent double-booking
        $("#btn-confirm-event").prop("disabled", true);
        $(".event-package-selection").removeClass("input-warning");

        // Payment choice
        console.log($("#event-card-selection :selected").data("card"));
        if(!$("#event-card-selection :selected").data("card")) {
            $("#btn-confirm-event").prop("disabled", false);
            $("#btn-add-card").click();
            return;
        }
        else {
            var card = $("#event-card-selection :selected").data("card");
        }

        // Event Package
        var packages = [];
        var price = 0.0;
        $(".event-package-selection").each(function(e) {
            if($(this).hasClass("active")) {
                packages.push($(this).data("package"));
                price += parseFloat($(this).data("price"));
            }
        });
        if(packages.length < 1) {
            $(".event-package-selection").addClass("input-warning");
            $("#btn-confirm-event").prop("disabled", false);
            return;
        }

        // If all valid begin building form
        ui.startLoader();

        // Create datetime
        var year = $("#event-date").val().split("-")[0];
        var month = parseInt($("#event-date").val().split("-")[1])-1;
        var day = $("#event-date").val().split("-")[2];
        var hour = $("#event-time").val().split(":")[0];
        var minute = $("#event-time").val().split(":")[1];
        var datetime = new Date(year,month,day,hour,minute);

        session.get("login")
            .then(function(res) {
                var form = {
                    formContext: "event-form",
                    address: $("#event-address").val(),
                    datetime: datetime.toISOString(),
                    packages: packages,
                    note: $("#event-note").val(),
                    price: parseFloat(price),
                    userId: parseInt(JSON.parse(res).userId),
                    card: card,
                    photos: []
                };

                // Read files
                var photoInput = $("#event-photos")[0];
                var files = [];

                for(var i = 0; i < photoInput.files.length; i++) {
                    files.push( tools.readFile(photoInput.files[i]) );
                }
            
                Promise.all(files)
                    .then(function(blobs) {
                        blobs.forEach(function(blob) {
                            form.photos.push(blob);
                        });

                        sendEventBooking(form);

                    }, function(err) {
                        console.log("Read file loop error.\n" + err);
                        ui.endLoader();
                        navigator.notification.alert(
                            "Error occured reading photos attached. Please try again.",
                            null,
                            "Photo Error",
                            "Okay"
                        );
                        $("#btn-confirm-event").prop("disabled", false);
                    });
            });
    });
}

function sendEventBooking(form) {
    console.log(JSON.stringify(form));

    // Create post request
    postData(form)
        .then( function(res) {
            console.log(JSON.stringify(res,null,'\t'));
            $("#btn-confirm-event").prop("disabled", false);
            $("#btn-close-event").click();
            $(".btn-delete-marker").click();
            ui.endLoader();

            var topic = "event-"+res.id+"-client";
            push.subscribe(topic);
            push.notification(
                res.id, 
                topic, 
                "Event Booked", 
                "Event successfully booked at "+form.address
            )
                .then(function(d) {
                    console.log(d);
                });

            navigator.notification.alert(
                "Booking Completed!",
                null,
                "Success",
                "Okay"
            );

        }, function(err) {
            console.log(err);
            $("#btn-confirm-event").prop("disabled", false);
            ui.endLoader();
            navigator.notification.alert(
                "Booking Failed. Please try again later.",
                "Server Error",
                null,
                "Okay"
            );
        });
}

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
        formContext: "client-registration",
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
                        "Registration successful. You can now login.",
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
                        "Registration Error",
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
        formContext: "client-login",
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
                            "Incorrect login details.\n",
                            null,
                            "Incorrect Login",
                            "Okay"
                        );
                    }
                    else {
                        // Else if SQL error then API incorrect, alert error
                        navigator.notification.alert("Error occured, please try again later.\n"+r.error);
                        break;
                    }
                    break;

                default:
                    // If response malformed/null alert error
                    navigator.notification.alert("An unknown error occured. Please try agian later.\n"+JSON.stringify(r));
                    break;
            }
        }, function(e) {
            ui.endLoader();
            navigator.notification.alert(
                "Error occured, please try again later.",
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
                    formContext: "client-session-check",
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

export function getFcmTopics(type = "client") {
    return session.get("login")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(u) {
            // Save form
            var form = {
                formContext: "fcm-client-topic-fetch",
                type: type,
                userId: u.userId
            };
        
            postData(form)
                .then(function(r) {
                    console.log("FCM Topics' Retreived.");
                    console.log(r);

                    // Subscribe all topics
                    var topics = r.data;
                    for(var i = 0; i < topics.length; i++) {
                        push.subscribe(topics[i].fcm_topic);
                    }
                }, function(err) {
                    console.log("Error retreiving FCM Topics':\n" + err.error_code + ": " + err.error);
                });
        });
}

export function saveFcmTopic(topic) {
    return session.get("login")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(u) {

            // Save ID to JSON
            var form = {
                topic: topic,
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
                formContext: "client-info-update",
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

export function saveClientPaymentInfo(form) {
    return postData(form)
        .then(function(r) {
            console.log(r);

            session.get("login")
                .then(function(u) {
                    return JSON.parse(u);
                })
                .then(function(u) {
                    if(!u.stripeId) {
                        u.stripeId = form.stripeId;

                        session.remove("login")
                            .then(function() {
                                session.save("login", JSON.stringify(u));
                            });
                    }
                    else {
                        return;
                    }
                });
        });
}

export function deleteCard(card) {
    return new Promise(function(resolve) {
        session.get("login")
            .then(function(r) {
                return JSON.parse(r);
            })
            .then(function(r) {
                var form = {
                    formContext: "delete-card",
                    cardID: card,
                    userID: parseInt(r.userID)
                }
            
                resolve(postData(form));
            });
    });
}

export function getEvents() {
    return session.get("login")
        .then(function(r) {
            return JSON.parse(r);
        })
        .then(function(u) {
            var form = {
                formContext: "event-get",
                userId: u.userId
            }
            return postData(form);
        });
}

export function deleteEvent(job) {
    return session.get("login")
        .then(function(r) {
            return JSON.parse(r);
        })
        .then(function(u) {
            var form = {
                formContext: "event-delete",
                userId: u.userId,
                jobId: job
            }
            return postData(form);
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