// imports
import * as api from './api';
import * as storage from './storage';
import * as cache from './cache';
import * as tools from './tools';
import * as chat from './chat-functions';

// Listener tracker
var listeners = [];

// Login screen forms
export function registerUserHandler() {
    return new Promise(function(resolve) {
        $("#btn-confirm-register").click(function() {
            api.registerUser();
        });
        resolve(true);
    });
}

export function loginUserHandler() {
    return new Promise(function(resolve) {
        $("#login-form-container").submit(function(e) {
            e.preventDefault();
            
            api.authenticateUser();
        });
        resolve(true);
    });
}

export function forgotPasswordHandler() {
    return new Promise(function(resolve) {
        $("#btn-confirm-forgot-password").click(function() {
            api.forgotPassword();
        });
        resolve(true);
    });
}

// Splash screen functions
export function showSplash() {
    $("#splash-screen").show();
}
export function removeSplash() {
    $("#splash-screen").hide();
}

export function formToggle() {
    return new Promise(function(resolve) {
        $('[data-role="toggleFormInput"]').click(function() {
            var id = $(this).data("target");
            $(`#${id}`).slideToggle();
        });
        resolve(true);
    });
}

export function notificationEvent(event) {
    storage.get("locale")
        .then(JSON.parse)
        .then(function(l) {
            var date = new Date(event.datetime);
            var html = `
            <li class="list-group-item clr-primary event-notification-item p-0">
                <a class="text-white p" href="#" data-event-id='${event.id}'>
                    ${event.address}
                    <br><br>
                    ${date.toLocaleString(`en-${l.code}`)}
                </a>
            </li>`;
            $(".notification-menu-display").append(html);
        })
}

export function handleEventNotificationClick() {
    console.log("Adding notification click event");
    $(".event-notification-item").click(function() {
        // Empty any previous event info
        $("#event-information").empty();

        // Get event ID
        var eventId = $(this).children().data("event-id");
        console.log(`Event ID ${eventId}`);

        // Get event data from cache
        cache.getEvent(eventId)
            .then(function(event) {
                // Get user locale for formatting
                storage.get("locale")
                    .then(JSON.parse)
                    .then(function(l) {

                        // Structure and append event info
                        var date = new Date(event.datetime);

                        var html = 
                        `<div class="d-flex w-100 justify-content-between">
                            <h4 class="mb-3">${event.address}</h4>
                        </div>
                        <p class="event-datetime">${date.toLocaleString(`en-${l.code}`)}</p>`;

                        (event.note) ? html += `<p class="text-left">Note: </br> ${event.note}</p>` : null;

                        if(event.references !== null) {
                            html += `<ul class="form-group clr-dark p-0" id="reg-portfolio-preview">`;
                            event.references.forEach(function(image) {
                                html += `<li class='reg-portfolio-preview-image' ><img class="lightbox-img" src='${image.photo}' /></li>`
                            });
                            html += `</ul>`;
                        }
                        
                        $("#event-information").append(html);

                        $("#btn-accept-event").data("event-id", event.id);
                        
                        $("#event-info-modal").modal("show");
                    });
            })
    });
}

export function fillArtistRoles() {
    return api.getArtistRoles()
        .then(function(r) {
            if(r.hasOwnProperty('data')) {
                r.data.forEach(function(role) {
                    $("#reg-role").append(`<option data-role-id="${role.id}">${role.name}</option>`);
                });
            }
            else {
                navigator.notification.alert(
                    "Error occured connecting to database, please ensure network is connected.",
                    navigator.app.exitApp,
                    "Error",
                    "Okay"
                );
            }
        });
}

export function addSettingsEvent(event) {
    return cache.getEvent(event.id, true)
        .then(function(event) {
            console.log(event);
            var addressArray = event.address.split(",");
            var address = addressArray[0];
            if(addressArray[1]) address += "," + addressArray[1];
        
            var nowDate = new Date();
            var eventDate = new Date(event.datetime);

            return storage.get("locale")
                .then(JSON.parse)
                .then(function(l) {
                    var buttons = "";
                    
                    if(nowDate.getTime() < eventDate.getTime()) {
                        buttons += 
                        `<div class="text-right clr-dark mb-1">
                            <button type="button" class="btn-delete-event btn input-dark btn-md" data-event-address="${event.address}" data-event-id="${event.id}">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>`;
                    } else {
                        // If no ratings exist then require a rating
                        var ratingsRequired;
                        (event.ratings.clients.hasOwnProperty(`${event.clientId}`) == true) ? ratingsRequired = false : ratingsRequired = true;
        
                        if(ratingsRequired === true) {
                            buttons += 
                            `<div class="text-right clr-dark mb-1">
                                <button type="button" class="btn-rate-client btn input-dark btn-md" data-event-id="${event.id}">
                                    <i class="fas fa-star"></i> Rate Client
                                </button>
                            </div>`;
                        } else {
                            buttons += 
                            `<div class="text-right clr-dark mb-1">
                                <button type="button" class="btn input-dark btn-md" disabled>
                                    <i class="fas fa-star"></i> Rated
                                </button>
                            </div>`;
                        }
                    }
                
                    var html = 
                    `<a href="#" class="list-group-item list-group-item-action flex-column align-items-start clr-dark event-package-selection" data-event="${event.id}">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-3">${address}</h5>
                        </div>
                        <small>${eventDate.toLocaleString(`en-${l.code}`)}</small>
                        ${buttons}
                    </a>`;
                
                    $("#events-form-inputs").append(html);
                });
        });
}

export function rateClientHandler() {
    $(document).on("click", ".btn-rate-client", function() {
        // Handle Rate Client Button Click
        $("#rate-client-form").empty();
        cache.getEvent($(this).data('event-id'))
            .then(function(event) {
                // if client has rating display, if no rating prompt for rating
                return api.client(event.clientId)
                    .then(function(client) {
                        if(event.ratings.clients.hasOwnProperty(`${client.id}`) != true) {
                            // If no ratings exist then require a rating
                            var html = `
                            <div class="text-center client-rating" data-event="${event.id}" data-client="${client.id}">
                                <p>${client.username}</p>
                                <div class="star-rating">
                                    <i class="far fa-star" data-star="1"></i>
                                    <i class="far fa-star" data-star="2"></i>
                                    <i class="far fa-star" data-star="3"></i>
                                    <i class="far fa-star" data-star="4"></i>
                                    <i class="far fa-star" data-star="5"></i>
                                </div>
                            </div>`;

                            $("#rate-client-form").append(html);
                            $("#rate-client-modal").modal("show");
                        }
                });
            })
            .then(starRatingHandler)
            .then(clientRatingFormHandler);
    });
    return true;
}

export function clientRatingFormHandler() {
    $("#btn-submit-rate-client").click(function() {
        // Declare event variable
        var eventId;

        $(".client-rating").each(function() {
            // Get id info
            var clientId = $(this).data("client");
            eventId = $(this).data("event");

            // Get artist rating
            var rating = 0;
            $(this).find(".star-rating").children(".fa-star").each(function() {
                if($(this).hasClass("fas")) rating++;
            });

            // Submit rating
            api.clientRating(eventId, clientId, rating)
                .then(function() {
                    // Close dialog
                    $("#btn-close-rate-client").click();
                });
        });

        // Disable rating button
        $(`.btn-rate-client[data-event-id="${eventId}"]`).attr("disabled", true);
        $(`.btn-rate-client[data-event-id="${eventId}"]`).text("Rated");
    });
}

export function starRatingHandler() {
    $(".fa-star").click(function() {
        // Save star level
        var starWeight = $(this).data("star");

        // Fill in star
        $(this).removeClass("far");
        $(this).addClass("fas");

        // Loop sibling stars
        $(this).siblings(".fa-star").each(function() {
            if($(this).data("star") < starWeight) {
                // If lower star make it filled as well
                $(this).removeClass("far");
                $(this).addClass("fas");

            } else {
                // If higher star 
                $(this).removeClass("fas");
                $(this).addClass("far");
            }
        });
    });
}

export function updatePortfolioImages() {
    return new Promise(function(resolve) {
        $("#reg-portfolio").change(function() {
            $("#reg-portfolio").empty();
    
            var photos = $("#reg-portfolio")[0].files;
        
            for(var i = 0; i < photos.length; i++) {
                tools.readFile(photos[i])
                    .then(function(e) {
                        $("#reg-portfolio-preview").append(
                            `<li class='reg-portfolio-preview-image'><img src="${e}" /></li>`
                        );
                    });
            }
        });
        resolve(true);
    });
}

export function printChannel(channel) {
    storage.get("login")
    .then(JSON.parse)
    .then(function(u) {
        if($(`li.channel[data-sid="${channel.sid}"]`).length) return;

        // Set event object
        var event = channel.state.attributes;

        // Set image
        var img;
        (u.profile_photo === null) ? img = "img/logo.png" : img = u.profile_photo;

        // Set event datetime
        var date = new Date(event.datetime);
        var datetime = `${date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'})} ${date.toLocaleDateString(navigator.language)}`;

        // Filter address
        var address = event.address.split(',')[0];

        // Create HTML item
        var item = `
            <li class="channel" data-sid="${channel.sid}">
                <div class="d-flex bd-highlight">
                    <div class="img_cont">
                        <img src="${img}" class="rounded-circle user_img">
                        <!-- No way of determining status 
                        <span class="online_icon"></span>
                        -->
                    </div>
                    <div class="user_info">
                        <span>${address}</span>
                        <p>${datetime}</p>
                    </div>
                </div>
            </li>`
        
        // Append item
        $("ui.contacts").append(item);
    });
}

export function chatHandler() {
    // Handle attach media
    $("span.attach_btn > input").change(tools.checkChatMedia);
    $("span.attach_btn").click(function() {
        var input = $(this).find("input")[0];
        input.click();
    });

    // Handle message send
    $("span.send_btn").click(function() {
        // Log click
        console.log("Send button was clicked");

        var media;
        var message;

        var input = $("span.attach_btn > input");

        if($("span.attach_btn > input")[0].files[0]) {
            // Get media for sending
            media = input[0].files[0];
            console.log(media);
            message = new FormData();
            message.append("file", media);
        } else {
            // Get user text input
            message = $("textarea.type_msg").val();
            $("textarea.type_msg").val("");
        }

        console.log(message);

        // If message is empty cancel send
        if(message instanceof FormData !== true && !message.length) return;

        // Get channel sid
        var sid = $("#chat").data("sid");

        // Get channel object
        chat.getChannel(sid)
        .then(function(channel) {
            // Return send message result (message index)
            return channel.sendMessage(message);
        })
        .then(console.log)
        .finally(function() {
            $("textarea.type_msg").val("");
            $("textarea.type_msg").prop("disabled", false);
        });
    });
}

export function channelListHandler() {
    // Make active on hover
    $("li.channel").hover(
        function() {
            $(this).addClass("active");
        }, function() {
            $(this).removeClass("active");
        }
    );

    // Open chat on click
    $("li.channel").click(function() {
        // Start loader
        startLoader();

        if($(this).data("sid") === $("#chat").data("sid")) {
            // Remove channel list from view
            $("#channels").addClass('d-none');

            // Display chat
            $("#chat").removeClass("d-none");

            // End loader
            endLoader();
            return;
        }

        // Clear previous messages
        $(".msg_card_body").empty();

        // Remove channel list from view
        $("#channels").addClass('d-none');

        // Get channel sid
        var sid = $(this).data("sid");

        // Set sid for chat
        $("#chat").data("sid", sid);

        // Set chat image
        var img = $(this).find(".img_cont").children().first().attr("src");

        // Get channel info
        storage.get(`channel-${sid}`)
        .then(JSON.parse)
        .then(function(data) {
            // Put chat image
            $("#chat").find(".img_cont").children().first().attr("src", img);

            // Set event datetime
            var date = new Date(data.attributes.datetime);
            var datetime = `${date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'})} ${date.toLocaleDateString(navigator.language)}`;
    
            // Filter address
            var address = data.friendlyName.split(',')[0];
    
            // Set chat title
            var title = 
            `<span>${address}</span>
            <p>
                ${data.friendlyName}<br>
                ${datetime}
            </p>`;
            $("#chat").find(".user_info").html(title);
        })
        .then(function() {
            // Get channel
            return chat.getChannel(sid)
            // Setup channel handlers
            .then(function(channel) {
                // Add new channel listeners
                if(!listeners.includes(channel.sid)) {
                    channel.on("messageAdded", printMessage);
                    channel.on("memberJoined", function(){printInfoMessage("New artist accepted booking.");});
                    channel.on("memberLeft", function(){printInfoMessage("Artist cancelled booking.");});
                    listeners.push(channel.sid);
                }
                // Return channel messages
                return channel.getMessages(30);
            });
        })
        .then(function(messages) {
            console.log(messages);

            // If channel has messages print each message
            if(messages.items.length) {
                return messages.items.reduce(function(p, message) {
                    return p.then(function(){return printMessage(message);});
                }, Promise.resolve());
            }
            
            // If no messages then print none found
            printInfoMessage("No tea found.");
        })
        // End loader and display chat
        .finally(function() {
            // End loader
            endLoader();

            // Display chat
            $("#chat").removeClass("d-none");
        });
    });
}

// Print basic info message for chat
function printInfoMessage(message) {
    var html = 
    `<div class="d-flex justify-content-end mb-4">
		<span class="msg_info">${message}</span>
    </div>`;
    $(".msg_card_body").append(html);
}

// Print channel message
function printMessage(message) {
    // If message already exists don't reprint
    if($(`[data-sid="${message.sid}"]`).length) {
        return;
    }

    var html;
    var me;
    
    return storage.get("login")
    .then(JSON.parse)
    .then(function(u) {
        me = `artist-${u.username}`;
    })
    .then(function() {
        return chat.getUser(message.state.author);
    })
    .then(function(author) {
        // Set image
        var img;
        (author.state.attributes.profile_photo === null) ? img = "img/logo.png" : img = author.state.attributes.profile_photo;

        // Set datetime
        var date = new Date(message.state.dateUpdated);
        var now = new Date();
        var datetime;

        // Formate datetime
        return storage.get("locale")
        .then(JSON.parse)
        .then(function(l) {
            (date.toDateString() === now.toDateString()) ? datetime = date.toLocaleTimeString(`en-${l.code}`, {hour: '2-digit', minute:'2-digit'}) : datetime = date.toLocaleDateString(`en-${l.code}`); 
        })
        // Check if media message
        .then(function(){
            if(message.state.type === "media") getMediaInfo(message);
        })
        .then(function() {
            var body;
            (message.state.type === "media") ? body = `<i class="fas fa-spinner fa-spin"></i>` : body = message.state.body;
            switch(message.state.author) {
                case me:
                    html =
                    `<div class="d-flex justify-content-end mb-4" data-sid="${message.state.sid}">
                        <div class="msg_cotainer_send">
                            ${body}
                            <span class="msg_time_send msg_time_send_self">${author.state.friendlyName} - ${datetime}</span>
                        </div>
                        <div class="img_cont_msg">
                            <img src="${img}" class="rounded-circle user_img_msg">
                        </div>
                    </div>`
                    break;
        
                default:
                    html =
                    `<div class="d-flex justify-content-start mb-4"  data-sid="${message.state.sid}">
                        <div class="img_cont_msg">
                            <img src="${img}" class="rounded-circle user_img_msg">
                        </div>
                        <div class="msg_cotainer">
                            ${body}
                            <span class="msg_time msg_time_send_other">${author.state.friendlyName} - ${datetime}</span>
                        </div>
                    </div>`;
                    break;
            }
        
            $(".msg_card_body").append(html);

            // Scroll to bottom when receiving message
            $(".msg_card_body").animate({
                scrollTop: $(".msg_card_body")[0].scrollHeight
            }, 300);
        });
    });
}

function getMediaInfo(message) {
    var mediaPlaceholder;
    
    // Check cache for media
    return storage.get(`media-${message.media.sid}`)

    // If not available in cache get URL
    .then(function(url) {
        if(url) return url;
        return message.media.getContentUrl()
    })

    // Use source to embed
    .then(function(url) {
        // Create image placeholder
        if(message.media.contentType.indexOf("image") > -1)
            mediaPlaceholder = `<img src="${url}" class="lightbox-img msg_container_send_img" data-sid="${message.media.sid}">`;
        
        // Create video placeholder
        else if(message.media.contentType.indexOf("video") > -1)
            mediaPlaceholder = 
            `<video class="msg_container_send_vid" data-sid="${message.media.sid}" preload="metadata" controls>
                <source src="${url}" type="${message.media.contentType}">
                Your device does not support in-app video.
            </video>`
        
        // Create file placeholder
        else mediaPlaceholder = `<a href="${url}" data-sid="${message.media.sid}" download="${message.media.filename}">${message.media.filename}</a>`;

        return url;
    })
    .then(function(url) {
        // Append body to message
        return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            return `artist-${u.username}`;
        })
        .then(function(me) {
            var chatBody;
            if(message.author === me) {
                chatBody = $(`div[data-sid="${message.sid}"] > .msg_cotainer_send`);
                chatBody.find("i")[0].remove();
                chatBody.prepend(mediaPlaceholder);
            } else {
                chatBody = $(`div[data-sid="${message.sid}"] > .msg_cotainer`);
                chatBody.find("i")[0].remove();
                chatBody.prepend(mediaPlaceholder);
            }
        })
        .then(videoCache)
        .finally(function() {
            // If not base64
            if(url.indexOf("data") !== 0) mediaCache(url, message);
        });
    });
}

export function mediaCache(url, message) {
    var source
    var type = message.media.contentType;
    if(type.indexOf("image") > -1) {
        source = $(`img[data-sid="${message.media.sid}"]`);
        source.on("load", function(){cacheFile(url, message, source);});
    } else { 
        source = $(`a[data-sid="${message.media.sid}"]`);
        cacheFile(url, message, source);
    }
}

function cacheFile(url, message, source) {
    var type = message.media.contentType;
    
    // If not cached get and cache
    return tools.readFileURL(url)
    .then(function(file) {
        console.log(file);
        (type.indexOf("image") > -1) ? source.attr("src", file) : source.attr("href", file);
        return storage.save(`media-${message.media.sid}`, file);
    })
    .catch(console.warn)
    .finally(function() {
        try {
            source.off("load");
        } catch(e) {
            console.log("No file listener for this source");
        }
    });
}

export function videoCache() {
    $("video").on("ended", function() {
        // Get media SID
        var sid = $(this).data("sid");

        // Set source for media
        var source = $(this).find("source:first");
        var url = source.attr("src");
        console.log(url);
    
        // Check if video already cached
        storage.get(`media-${sid}`)
        .then(function(v) {
            // If cached exit
            if(v) {
                source.attr("src", v);
                return;
            }
    
            // If not cached get and cache
            return tools.readFileURL(url)
            .then(function(file) {
                console.log(file);
                source.attr("src", file);
                return storage.save(`media-${sid}`, file);
            })
            .catch(console.warn);
        });
    });
}

export function startLoader(color = "black") {
    $("body").prepend(`<div class='loader-${color}'></div>`);
}
export function endLoader() {
    $("[class^='loader-']").remove();
}