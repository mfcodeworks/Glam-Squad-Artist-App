// imports
import * as storage from './storage';
import * as cache from './cache';
import * as tools from './tools';
import * as CryptoJS from 'crypto-js';
import * as push from './push';
import * as ui from './ui-tools';
import * as payment from './payment';

// NR Server Endpoint
const endpoint = 'https://glam-squad-db.nygmarosebeauty.com/';
const apiSecret = '1GSqDjCYAXeBLuLLVBx3bXlpC5NKUPqC';

export function registerUser() {
    // Verify inputs
    $("#reg-username").removeClass("is-invalid");
    $("#reg-password").removeClass("is-invalid");
    $("#reg-password2").removeClass("is-invalid");
    $("#reg-email").removeClass("is-invalid");
    if(!tools.validate("username", $("#reg-username").val())) {
        $("#reg-username").addClass("is-invalid");
        return;
    }
    if(!tools.validate("email", $("#reg-email").val())) {
        $("#reg-email").addClass("is-invalid");
        return;
    }
    if(!tools.validate("password", $("#reg-password").val())) {
        $("#reg-password").addClass("is-invalid");
        return;
    }
    if(!tools.validatePassword($("#reg-password").val(), $("#reg-password2").val())) {
        $("#reg-password").addClass("is-invalid");
        $("#reg-password2").addClass("is-invalid");
        return;
    }

    // Validation succeeded, begin loading for user
    ui.startLoader();

    // Create a registration form
    var form = {
        formContext: "artist-registration",
        country: $("#reg-country").children("option:selected").val(),
        username: $("#reg-username").val(),
        email: $("#reg-email").val(),
        password: $("#reg-password").val(),
        bio: $("#reg-bio").val(),
        facebook: $("#reg-facebook").val(),
        twitter: $("#reg-twitter").val(),
        instagram: $("#reg-instagram").val(),
        role: $("#reg-role").find(":selected").data("role-id"),
        portfolio: []
    };

    var portfolioInput = $("#reg-portfolio")[0];
    var files = [];
    
    for(var i = 0; i < portfolioInput.files.length; i++) {
        files.push( tools.readFile(portfolioInput.files[i]) );
    }

    Promise.all(files)
        .then(function(blobs) {
            blobs.forEach(function(blob) {
                form.portfolio.push(blob);
            });

            console.log(form);
            return form;
        })
        .then(postData)
        .then(function(r) {
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
                        `${r.error_code}: ${r.error}`,
                        null,
                        "Error",
                        "Okay"
                    );
                    break;

                default:
                // If malformed/null response alert error
                    navigator.notification.alert(
                        `An unknown error occured. Please try agian later.\n${JSON.stringify(r)}`,
                        null,
                        "Error",
                        "Okay"
                    );
                    break;
            }
        })
        .then(ui.endLoader)
        .catch(function(err) {
            navigator.notification.alert(
                `An error occured, please try again later.\n${err}`,
                null,
                "Error",
                "Okay"
            );
        });
}

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

                    var data = user;
                    data.userId = user.id
                    delete data.id;

                    console.log("Making session: "+JSON.stringify(data,null,"\t"));

                    storage.save("login",JSON.stringify(data))
                        .then(function(res) {
                            if(res) tools.load("map.html");
                        }, function(err) {
                            console.warn(err);
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
                            `${r.error_code}: ${r.error}`,
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
                        "An unknown error occured. Please try agian later.\n"+JSON.stringify(r,null,"\ts"),
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

export function getNewEvents() {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var form = {
                formContext: "artist-fetch-new-events",
                userId: u.userId
            }

            return postData(form);
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    var storageProgress = [];
                    var events = r.data;
                    
                    if(events.length > 0) {
                        $(".notification-menu-display").empty();

                        for(var i = 0; i < events.length; i++) {
                            ui.notificationEvent(events[i]);
                            storageProgress.push(storage.save("event-" + events[i].id, JSON.stringify(events[i])));
                        }

                        var number;
                        if(events.length > 99) number = "99+";
                        else number = events.length;
                        var count = '<span id="notification-count">' + number + '</span>';
                        $('.notification-menu-toggler').prepend(count);

                        return Promise.all(storageProgress);
                    }
                    break;
                
                case false:
                    console.warn(`Error fetching events. ${r.error}`);
                    break;

                default:
                    console.warn(`Warning. Server error fetching events. ${r}`);
                    break;
            }
        })
        .then(ui.handleEventNotificationClick)
        .then(acceptEventBooking);
}

export function getArtistRoles() {
    var form = {
        formContext: "roles-get"
    }

    return postData(form);
}

export function getFinishedEvents() {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var form = {
                formContext: "event-recently-completed",
                type: "artist",
                userId: u.userId
            }

            return postData(form);
        });
}

export function getEvent(jobId) {
    var form = {
        formContext: "event-get",
        jobId: jobId
    }

    return postData(form);
}

export function saveClientAttendance(event, client, response) {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var form = {
                formContext: "event-client-attendance",
                clientId: client,
                userId: u.userId,
                eventId: event,
                attendance: response
            }

            return postData(form);
        });
}

export function acceptEventBooking() {
    $("#btn-accept-event").click(function() {
        ui.startLoader();
        var eventId = $("#btn-accept-event").data("event-id");
        console.log(eventId);

        storage.get("login")
            .then(JSON.parse)
            .then(function(u) {
                var form = {
                    formContext: "artist-apply-job",
                    userId: u.userId,
                    eventId: eventId
                }

                return postData(form);
            })
            .then(function(r) {
                console.log(r);

                switch(r.response) {
                    case true:
                        navigator.notification.alert(
                            "Event accepted! You'll be notified when the event is near.",
                            null,
                            "Success",
                            "Okay"
                        );

                        var topic = `event-${eventId}-artist`;
                        push.subscribe(topic)
                            .then(function() {
                                return cache.getEvent(eventId);
                            })
                            .then(function(e) {
                                push.notification(
                                    e.id,
                                    topic,
                                    `Event Accepted`,
                                    `Successfully accepted event at ${e.address}`
                                );
                            });
                        break;

                    case false:
                        navigator.notification.alert(
                            r.error,
                            null,
                            "Error",
                            "Okay"
                        );
                        break;

                    default:
                        navigator.notification.alert(
                            `${r.error_code}: ${r.error}`,
                            null,
                            "Unknown Server Error",
                            "Okay"
                        );
                        break;
                }
            })
            .then(function() {
                // Remove notification
                $('a[data-event-id="' + eventId + '"]').parent().remove();
                // Collapse notifications
                $("#notification-menu").collapse();
                // Set new count
                var count = parseInt($("#notification-count").text());
                count--;
                $("#notification-count").text(count.toString());
                if(count === 0) {
                    $(".notification-menu-display").append('<li class="nav-item active"><a class="text-white p" href="#">Empty</a></li>');
                }
            })
            .then(function() {
                $("#btn-close-event").click();
                ui.endLoader();
            });
    });
}

export function deleteEvent(id) {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var form = {
                formContext: "artist-cancel-job",
                userId: u.userId,
                jobId: id
            }

            return postData(form);
        });
}

export function isAuthenticated() {
    // Get login session
    return new Promise(function(resolve) {
        storage.get("login")
            .then(JSON.parse)
            .then(function(u) {
                if(u === null) {
                    resolve(false);
                    return;
                }
    
                // Build validation form
                var form = {
                    formContext: "artist-session-check",
                    userId: parseInt(u.userId),
                    usernameHash: u.usernameHash
                };
            
                // Return validation response
                postData(form)
                    .then(function(res) {
                        console.log("User authenticated: " + JSON.stringify(res.valid));

                        // If user is valid update storage
                        if(res.valid) {
                            storage.remove("login");
                            var data = res.data;
                            data.userId = data.id;
                            delete data.id;
                            storage.save("login", JSON.stringify(data));
                        }

                        resolve(res.valid);
                    });
            });
    })
}

export function getFcmTopics(type = "artist") {
    return storage.get("login")
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

                    // Subscribe all topics
                    if(r.data) {
                        var topics = r.data;
                        for(var i = 0; i < topics.length; i++) {
                            push.subscribe(topics[i].fcm_topic);
                        }
                    }
                }, function(err) {
                    console.warn("Error retreiving FCM Topics':\n" + err.error_code + ": " + err.error);
                });
        });
}

export function saveFcmToken(token) {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {

            // Save ID to JSON
            var form = {
                token: token,
                userId: parseInt(u.userId),
                formContext: "fcm-token-registration",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log(`Saved FCM Token: ${token}`);
                    break;

                case false:
                    console.warn(`Failed to save FCM Token: ${token}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    break;
            }
        });
}

export function saveFcmTopic(topic, type = "artist") {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // Save ID to JSON
            var form = {
                topic: topic,
                type: type,
                userId: parseInt(u.userId),
                formContext: "fcm-topic-registration",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log(`Saved FCM Topic ${topic}`);
                    break;

                case false:
                    console.warn(`Failed to save FCM topic: ${topic}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    break;
            }
        });
}

export function saveStripeToken(token) {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // Save ID to JSON
            var form = {
                token: token,
                userId: parseInt(u.userId),
                formContext: "artist-stripe-id",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log(`Saved Stripe ID`);
                    return true;

                case false:
                    console.warn(`Failed to save Stripe ID`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    return false;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    break;
            }
        });
}

export function getLocations() {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // Save ID to JSON
            var form = {
                userId: parseInt(u.userId),
                formContext: "artist-location-fetch",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log("Got locations.");
                    ui.endLoader();
                    return r;

                case false:
                    console.warn("Failed to fetch locations.");
                    console.warn(`${r.error_code}: ${r.error}`);
                    ui.endLoader();
                    return r;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    ui.endLoader();
                    return r;
            }
        });
}

export function deleteLocation(locId) {
    ui.startLoader();

    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // Save ID to JSON
            var form = {
                locId: parseInt(locId),
                userId: parseInt(u.userId),
                formContext: "artist-location-delete",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log(`Deleted location ${name}`);
                    break;

                case false:
                    console.warn(`Failed to delete location ${name}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    break;
            }
        });
}

export function saveLocation() {
    ui.startLoader();

    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // Save ID to JSON
            var form = {
                name: $("#location-shortname").val(),
                lat: parseFloat($("#location-shortname").data("lat")),
                lng: parseFloat($("#location-shortname").data("lng")),
                userId: parseInt(u.userId),
                formContext: "artist-location",
            };

            // Send to API Server
            return postData(form)
        })
        .then(function(r) {
            switch(r.response) {
                case true:
                    console.log(`Saved location: ${name}`);
                    break;

                case false:
                    console.warn(`Failed to save location: ${name}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.warn("Unknown error occured communicating with API server.");
                    break;
            }
        })
        .then(function() {
            $(".btn-delete-marker").click();
        });
}

export function fillUserInfo() {
    $("#new-username").val("");
    $("#new-email").val("");
    $("#new-password").val("");
    $("#new-password2").val("");

    // Update user info
    storage.get("login")
        .then(JSON.parse)
        .then(function(data) {
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
    storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var form = {
                formContext: "artist-info-update",
                userId: parseInt(u.userId),
                username: $("#new-username").val(),
                email: $("#new-email").val(),
                password: $("#new-password").val()
            }
        
            return postData(form)
        })
        .then(function(r) {
            console.log("User update response:\n" + JSON.stringify(r,null,"\t"));
            
            if(r.response === true) {
                storage.remove("login")
                    .then(function() {
                        var u = r.data[0];
                        u.userId = u.id

                        console.log(data);

                        storage.save("login",JSON.stringify(data));

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
            console.warn(err);
            ui.endLoader();
            $("#alert-container").append("\
                <div class='alert alert-danger alert-custom' role='alert'>\
                    Failed to update user info. \
                </div> \
            ");
        })
        .then(ui.endLoader)
        .then(function() {
            // Remove aler tafter 5 seconds
            setTimeout(function() {
                $(".alert").fadeOut();
            }, (1000 * 7));
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
export function getHMAC(message) {
    return CryptoJS.HmacSHA512(message, apiSecret);
}