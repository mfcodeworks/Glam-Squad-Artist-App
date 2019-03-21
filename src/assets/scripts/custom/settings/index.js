// imports
import * as api from '../api';
import * as tools from '../tools';
import * as ui from '../ui';
import * as storage from '../storage';
import * as push from '../push';
import * as cache from '../cache';

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(res) {
            if(!res) tools.load('login.html');
        });
}

export function updateUserHandler() {
    return new Promise(function(resolve) {
        $('#user-info-form').submit(function(e) {
            e.preventDefault();
    
            api.updateUser();
        });
        resolve(true);
    });
}

export function fillUserInfo() {
    return api.fillUserInfo();
}

export function getBookings() {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            var events = u.bookings;
            var progress = [];

            console.log(events);

            if(events) {
                $('#events-form-inputs').empty();

                for(var i=0; i<events.length; i++) {
                    progress.push(ui.addSettingsEvent(events[i]));
                }
            }
            else {
                $('#events-form-inputs').empty();

                $('#events-form-inputs').append(`<a href="#" class="list-group-item list-group-item-action flex-column align-items-start clr-dark event-package-selection" data-event="${event.id}"><p>No events accepted.</p></a>`);
            }

            return Promise.all(progress);
        })
        .then(deleteBookingHandler)
        .then(ui.rateClientHandler);
}

export function deleteBookingHandler() {
    return new Promise(function(resolve) {
        $('.btn-delete-event').click(function() {
            ui.startLoader();
            console.log('Deleting event');
            
            var event = $(this).data("event-id");

            cache.getEvent(event)
                .then(function(event) {
                    return api.deleteEvent(event.id)
                })
                .then(console.log)
                .then(function() {
                    return push.notification(
                        event,
                        `event-${event.id}-client`,
                        "Artist Cancelled",
                        `Artist cancelled booking for ${event.address}. Requesting new glam squad now.`
                    );
                })
                .then(api.isAuthenticated)
                .then(getBookings)
                .then(ui.endLoader);
        });
        resolve(true);
    });
}