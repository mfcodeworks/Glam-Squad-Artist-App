/* eslint-disable no-use-before-define */
// imports
import * as api from '../api';
import * as tools from '../tools';
import * as ui from '../ui';
import * as storage from '../storage';
import * as push from '../push';
import * as cache from '../cache';

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then((res) => {
            if (!res) tools.load('signin.html');
        });
}

export function updateUserHandler() {
    $('#btn-save-profile').click(() => {
        api.updateUser();
    });
}

export function fillUserInfo() {
    return api.fillUserInfo();
}

export function getBookings() {
    const eventslist = [];

    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        const progress = [];
        u.bookings.forEach((ev) => {
            progress.push(
                cache.getEvent(ev.id)
                .then((event) => {
                    // Set start/end datetime
                    const dateStart = new Date(event.datetime);
                    const dateEnd = new Date(event.datetime);
                    if (event.extraHours) {
                        dateEnd.setHours(dateEnd.getHours() + (event.extraHours + 1));
                    } else {
                        dateEnd.setHours(dateEnd.getHours() + 1);
                    }

                    // Set event object array
                    eventslist.push({
                        id: event.id,
                        title: event.address,
                        desc: event.address,
                        start: dateStart,
                        end: dateEnd,
                        allDay: false,
                        data: event,
                    });
                })
            );
        });
        return Promise.all(progress);
    })
    .then(() => {
        $('#full-calendar').fullCalendar({
            events: eventslist,
            defaultView: 'listWeek',
            header: {
                right: 'prev,next',
            },
            titleFormat: 'MMM D',
            height: 800,
            eventClick: (event) => {
                console.log('Event clicked');
                console.log(event);

                // Fill Modal
                $('[data-src="booking-address"]').text(event.title.split(',')[0]);
                $('[data-src="booking-datetime"]').text(event.start.toLocaleString(tools.getLanguage()));
                $('[data-role="delete-booking"]').data('event-id', event.id);
                $('[data-role="delete-booking"]').data('event-address', event.title);
                $('#event-booking-modal').modal('show');
                ui.addSettingsEvent(event.data);
            },
        });
    })
    .then(deleteBookingHandler)
    .then(ui.rateClientHandler);
}

export function profilePhotoHandler() {
    $('#new-profile-photo').change((e) => {
        const input = e.currentTarget;
        if (input.files[0]) {
            ui.startLoader();

            tools.readFile(input.files[0])
            .then((media) => {
                console.log(media);

                return api.updateProfilePic(media);
            })
            .then((r) => {
                console.log(r);
                storage.get('login')
                .then(JSON.parse)
                .then((u) => {
                    u.profile_photo = r.profile_photo;
                    storage.save('login', JSON.stringify(u));
                })
                .then(tools.fillUserData);
            })
            .finally(ui.endLoader);
        }
    });
}

export function deleteBookingHandler() {
    $('.btn-delete-event').click(() => {
        ui.startLoader();
        console.log('Deleting event');

        const eventId = $(this).data('event-id');
        let event;

        cache.getEvent(eventId)
        .then((ev) => {
            event = ev;
            return api.deleteEvent(event.id);
        })
        .then(console.log)
        .then(() => {
            return push.notification(
                event.id,
                `event-${event.id}-client`,
                'Artist Cancelled',
                `Artist cancelled booking for ${event.address}. Requesting new glam squad now.`
            );
        })
        .then(getBookings)
        .finally(ui.endLoader);
    });
}

export function reportClientHandler() {
    $('#btn-report-client').click((e) => {
        api.reportArtist($(e.currentTarget).data('client-id'));
    });
}

export function removeCalendarEvent(id) {
    return $('#full-calendar').fullCalendar('removeEvents', id);
}

export function addCalendarEvent(event) {
    console.log('Adding new event');
    console.log(event);

    // Set start/end datetime
    const dateStart = new Date(event.datetime);
    const dateEnd = new Date(event.datetime);
    if (event.extraHours) {
        dateEnd.setHours(dateEnd.getHours() + (event.extraHours + 1));
    } else {
        dateEnd.setHours(dateEnd.getHours() + 1);
    }

    // Set event object array
    return $('#full-calendar').fullCalendar('addEventSource', [{
        id: event.id,
        title: event.address,
        desc: event.address,
        start: dateStart,
        end: dateEnd,
        allDay: false,
        data: event,
    }]);
}
