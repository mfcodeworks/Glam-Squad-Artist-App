// imports
import * as api from './api';
import * as storage from './storage';

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
            <li class="list-group-item clr-primary event-notification-item pt-1">\
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
        storage.get(`event-${eventId}`)
            .then(function(d) {
                return JSON.parse(d);
            })
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
                        '<div class="d-flex w-100 justify-content-between">\
                            <h4 class="mb-3 display-4">' + event.address + '</h4>\
                        </div>\
                        <p class="event-datetime mt-2">' + date.toLocaleString(`en-${l.code}`) + '</p>';
                        
                        $("#event-information").append(html);

                        $("#btn-accept-event").data("event-id", event.id);
                        
                        $("#event-info-modal").modal("show");
                    });
            })
    });
}

export function startLoader(color = "black") {
    $("body").prepend("<div class='loader-" + color + "'></div>");
}
export function endLoader() {
    $("[class^='loader-']").remove();
}