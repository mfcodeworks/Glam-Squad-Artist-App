// imports
import * as api from './api';
import * as storage from './storage';
import * as cache from './cache';
import * as tools from './tools';

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
            $("#"+id).slideToggle();
        });
        resolve(true);
    });
}

export function notificationEvent(event) {
    storage.get("locale")
        .then(function(d) {
            return JSON.parse(d);
        })
        .then(function(l) {
            var date = new Date(event.datetime);
            var html = '\
            <li class="list-group-item clr-primary event-notification-item p-0">\
                <a class="text-white p" href="#" data-event-id=' + event.id + '>\
                    ' + event.address + '\
                    <br><br>\
                    ' + date.toLocaleString(`en-${l.code}`) + '\
                </a>\
            </li>';
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
                    .then(function(d) {
                        return JSON.parse(d);
                    })
                    .then(function(l) {
                        // Structure and append event info
                        var date = new Date(event.datetime);

                        var html = 
                        `<div class="d-flex w-100 justify-content-between">
                            <h4 class="mb-3">${event.address}</h4>
                        </div>
                        <p class="event-datetime">${date.toLocaleString(`en-${l.code}`)}</p>`;

                        if(event.note !== null && event.note !== "") {
                            html += `<p class="text-left">Note: </br> ${event.note}</p>`;
                        }

                        html += `<ul class="form-group clr-dark p-0" id="reg-portfolio-preview">`;
                        if(event.references !== null) {
                            event.references.forEach(function(image) {
                                html += `<li class='reg-portfolio-preview-image' ><img class="lightbox-img" src='${image.photo}' /></li>`
                            });
                        }
                        html += `</ul>`;
                        
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
    return cache.getEvent(event.id)
        .then(function(event) {
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

export function updatePortfolioImages() {
    return new Promise(function(resolve) {
        $("#reg-portfolio").change(function() {
            $("#reg-portfolio").empty();
    
            var photos = $("#reg-portfolio")[0].files;
        
            for(var i = 0; i < photos.length; i++) {
                tools.readFile(photos[i])
                    .then(function(e) {
                        $("#reg-portfolio-preview").append(
                            "<li class='reg-portfolio-preview-image' ><img src='" + e +"' /></li>"
                        );
                    });
            }
        });
        resolve(true);
    });
}

export function startLoader(color = "black") {
    $("body").prepend("<div class='loader-" + color + "'></div>");
}
export function endLoader() {
    $("[class^='loader-']").remove();
}