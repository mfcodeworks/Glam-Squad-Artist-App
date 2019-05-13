/* eslint-disable no-shadow */
// imports
import * as CryptoJS from 'crypto-js';
import masonryInit from '../../masonry';
import * as storage from '../storage';
import * as cache from '../cache';
import * as tools from '../tools';
import * as push from '../push';
import * as ui from '../ui';
import * as settings from '../settings';

// NR Server Endpoint
const endpoint = 'https://glam-squad-db.nygmarosebeauty.com/api/v1';
const apiSecret = '1GSqDjCYAXeBLuLLVBx3bXlpC5NKUPqC';

// Create HMAC for message
function getHMAC(message) {
    return CryptoJS.HmacSHA512(message, apiSecret);
}

// Create Auth header for message
function getAuthHeader() {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        // If user and key exist return key
        return (u && u.key) ? u.key : null;
    });
}

function apiSend(method = 'GET', url, form = null) {
    let message;

    // Make JSON message if it exists
    (form) ? message = JSON.stringify(form) : message = null;

    // Get HMAC header
    const hmac = getHMAC(message);

    return getAuthHeader()
    .then((auth) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                method,
                url,
                headers: {
                    'NR-HASH': hmac,
                    'NR-AUTH': auth,
                },
                data: message,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                // timeout 300 seconds in milliseconds
                timeout: (300 * 1000),
                success: (res) => {
                    resolve(res);
                },
                error: (xhr, status, err) => {
                    reject(err);
                },
            });
        });
    });
}

export function registerUser() {
    // Verify inputs
    $('#reg-username').removeClass('is-invalid');
    $('#reg-password').removeClass('is-invalid');
    $('#reg-password2').removeClass('is-invalid');
    $('#reg-email').removeClass('is-invalid');

    if (!tools.validate('username', $('#reg-username').val())) {
        $('#reg-username').addClass('is-invalid');
        return;
    }
    if (!tools.validate('email', $('#reg-email').val())) {
        $('#reg-email').addClass('is-invalid');
        return;
    }
    if (!tools.validate('password', $('#reg-password').val())) {
        $('#reg-password').addClass('is-invalid');
        return;
    }
    if (!tools.validatePassword($('#reg-password').val(), $('#reg-password2').val())) {
        $('#reg-password').addClass('is-invalid');
        $('#reg-password2').addClass('is-invalid');
        return;
    }

    // Validation succeeded, begin loading for user
    ui.startLoader();

    // Create a registration form
    const form = {
        country: $('#reg-country').children('option:selected').val(),
        username: $('#reg-username').val(),
        email: $('#reg-email').val(),
        password: $('#reg-password').val(),
        bio: $('#reg-bio').val(),
        facebook: $('#reg-facebook').val(),
        twitter: $('#reg-twitter').val(),
        instagram: $('#reg-instagram').val(),
        role: $('#reg-role').find(':selected').data('role-id'),
        portfolio: [],
    };

    const portfolioInput = $('#reg-portfolio')[0];
    const files = [];

    for (let i = 0; i < portfolioInput.files.length; i++) {
        files.push(tools.readFile(portfolioInput.files[i]));
    }

    Promise.all(files)
    .then((blobs) => {
        form.portfolio = blobs;
        console.log(form);
    })
    .then(() => {
        return apiSend('POST', `${endpoint}/artists`, form);
    })
    .then((r) => {
        switch (r.response) {
            // If successful alert
            case true:
                navigator.notification.alert(
                    'Registration received. You will receive an email shortly notifying you of your next step.',
                    null,
                    'Registration Success',
                    'Okay'
                );
                $('#btn-cancel-register').click();
                break;

            // If SQL unsuccessful alert
            case false:
                navigator.notification.alert(
                    `${r.error_code}: ${r.error}`,
                    null,
                    'Error',
                    'Okay'
                );
                break;

            default:
            // If malformed/null response alert error
                navigator.notification.alert(
                    `An unknown error occured. Please try agian later.\n${JSON.stringify(r)}`,
                    null,
                    'Error',
                    'Okay'
                );
                break;
        }
    })
    .catch((err) => {
        navigator.notification.alert(
            `An error occured, please try again later.\n${err}`,
            null,
            'Error',
            'Okay'
        );
    })
    .finally(ui.endLoader);
}

export function authenticateUser() {
    // Verify inputs
    $('[data-input="username"]').removeClass('is-invalid');
    $('[data-input="password"]').removeClass('is-invalid');
    if (!tools.validate('username', $('[data-input="username"]').val())) {
        $('[data-input="username"]').addClass('is-invalid');
        return;
    }
    if (!tools.validate('password', $('[data-input="password"]').val())) {
        $('[data-input="password"]').addClass('is-invalid');
        return;
    }

    // Create authentication form
    ui.startLoader();
    const form = {
        username: $('[data-input="username"]').val(),
        password: $('[data-input="password"]').val(),
    };

    // POST to API server
    return apiSend('POST', `${endpoint}/artists/authenticate`, form)
    .then((r) => {
        switch (r.response) {
            case true:
                console.log(`Making session: ${JSON.stringify(r.data[0], null, '\t')}`);

                storage.save('login', JSON.stringify(r.data[0]))
                .then((res) => {
                    if (res) tools.load('map.html');
                })
                .catch((err) => {
                    console.warn(err);
                });
                break;

            case false:
                // If SQL error login incorrect
                if (r.error === 'Incorrect login details.') {
                    navigator.notification.alert(
                        'Incorrect login details.',
                        null,
                        'Incorrect Login',
                        'Okay'
                    );
                } else {
                    // Else if SQL error then API incorrect, alert error
                    navigator.notification.alert(
                        `${r.error_code}: ${r.error}`,
                        null,
                        'Error',
                        'Okay'
                    );
                    break;
                }
                break;

            default:
                // If response malformed/null alert error
                navigator.notification.alert(
                    `An unknown error occured. Please try agian later.\n${JSON.stringify(r, null, '\t')}`,
                    null,
                    'Error',
                    'Okay'
                );
                break;
        }
    })
    .catch((e) => {
        navigator.notification.alert(
            `Error occured, please try again later.\n${e}`,
            null,
            'Error',
            'Okay'
        );
    })
    .finally(ui.endLoader);
}

export function getEvent(id) {
    return apiSend('GET', `${endpoint}/events/${id}`);
}

export function acceptEventBooking() {
    $('#btn-accept-event').click(() => {
        ui.startLoader();
        const event = $('#btn-accept-event').data('event-id');
        let topic;
        console.log(`Accepting event: ${event}`);

        storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            return apiSend('POST', `${endpoint}/events/${event}/apply`, { userId: u.id });
        })
        .then((r) => {
            console.log(r);

            switch (r.response) {
                case true:
                    // Alert success
                    navigator.notification.alert(
                        'Event accepted! You\'ll be notified when the event is near.',
                        null,
                        'Success',
                        'Okay'
                    );

                    // Subscribe to event topic
                    topic = `event-${event}-artist`;
                    push.subscribe(topic)
                    .then(() => {
                        return cache.getEvent(event);
                    })
                    .then((e) => {
                        push.notification(
                            e.id,
                            topic,
                            'Event Accepted',
                            `Successfully accepted event at ${e.address}`
                        );
                    });

                    // Add event to calendar
                    getEvent(event)
                    .then(settings.addCalendarEvent);

                    // Add event to login cache
                    isAuthenticated();
                    break;

                case false:
                    navigator.notification.alert(
                        r.error,
                        null,
                        'Error',
                        'Okay'
                    );
                    break;

                default:
                    navigator.notification.alert(
                        `${r.error_code}: ${r.error}`,
                        null,
                        'Unknown Server Error',
                        'Okay'
                    );
                    break;
            }
        })
        .then(() => {
            // Remove notification
            $(`a[data-event-id="${event}"]`).parent().remove();
            // Set new count
            let count = parseInt($('[data-src="notification-count"]').text());
            count--;
            $('[data-src="notification-count"]').text(count.toString());
            if (count === 0) {
                $('[data-role="notification-menu-display"]').append(
                    `<li>
                        <a href="#" class="peers fxw-nw td-n p-20 bdB c-grey-800 cH-blue bgcH-grey-100">
                            <div class="peer peer-greed">
                                <span class="c-grey-600">No notifications.</span>
                            </div>
                        </a>
                    </li>`);
            }
        })
        .finally(() => {
            $('#btn-close-event').click();
            ui.endLoader();
        });
    });
}

export function reportClient(id) {
    storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        return apiSend('POST',
            `${endpoint}/clients/${id}/report`,
            { artistId: u.id, key: u.key }
        );
    })
    .finally((r) => {
        switch (r.response) {
            case true:
                navigator.notification.alert(
                    'Artist has been successfully reported. This will be followed up by staff.',
                    null,
                    'Reported',
                    'Okay'
                );
                break;

            case false:
                navigator.notification.alert(
                    r.error,
                    null,
                    'Error',
                    'Okay'
                );
                break;

            default:
                navigator.notification.alert(
                    `Unknown error occured, please try again.\n${JSON.stringify(r)}`,
                    null,
                    'Error',
                    'Okay'
                );
        }
    })
    .catch(() => {
        navigator.notification.alert(
            'Unknown error occured, please try again.',
            null,
            'Error',
            'Okay'
        );
    });
}

export function getNewEvents() {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        return apiSend('GET', `${endpoint}/events/new/artist/${u.id}`);
    })
    .then((r) => {
        switch (r.response) {
            case true:
                if (r.data.length > 0) {
                    $('[data-role="notification-menu-display"]').empty();

                    r.data.forEach((event) => {
                        // Create notification item
                        ui.notificationEvent(event);
                        // Cache event
                        storage.save(`event-${event.id}`, JSON.stringify(event));
                    });

                    // Set notification count
                    $('[data-src="notification-count"]').text((r.data.length > 99) ? '99+' : r.data.length);
                }
                break;

            case false:
                console.warn(`Error fetching events. ${r.error}`);
                break;

            default:
                console.error(`Warning. Server error fetching events. ${r}`);
                break;
        }
    })
    .then(acceptEventBooking);
}

export function clientRating(event, client, rating) {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            const form = {
                clientId: client,
                artistId: u.id,
                rating,
            };

            return apiSend('PUT', `${endpoint}/events/${event}/ratings/client`, form);
        });
}

export function getArtistRoles() {
    return apiSend('GET', `${endpoint}/artists/roles`);
}

export function getFinishedEvents() {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            return apiSend('GET', `${endpoint}/artists/${u.id}/events/recent/unpaid`);
        });
}

export function saveArtistAttendance(event, artist, response) {
    const form = {
        artistId: artist,
        attendance: response,
    };

    return apiSend('PUT', `${endpoint}/events/${event}/attendance/artist`, form);
}

export function forgotPassword() {
    ui.startLoader();

    // POST to API server
    apiSend('POST', `${endpoint}/artists/forgot-password`, { username: $('#forgot-username').val() })
    .then((r) => {
        switch (r.response) {
            // If successful alert
            case true:
                navigator.notification.alert(
                    'Submitted successfully, you\'ll be sent an email to reset your password.',
                    null,
                    'Forgot Password',
                    'Okay'
                );
                $('#btn-cancel-register').click();
                break;

            // If SQL unsuccessful alert
            case false:
                navigator.notification.alert(
                    `An error occured, please try again later.\n${JSON.stringify(r.error)}`,
                    null,
                    'Error',
                    'Okay'
                );
                break;

            default:
            // If malformed/null response alert error
                navigator.notification.alert(
                    `An unknown error occured. Please try agian later.\n${JSON.stringify(r)}`,
                    null,
                    'Error',
                    'Okay'
                );
                break;
        }
    })
    .catch((err) => {
        navigator.notification.alert(
            `An error occured, please try again later.\n${err}`,
            null,
            'Error',
            'Okay'
        );
    })
    .finally(ui.endLoader);
}

export function deleteEvent(event) {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        return apiSend('POST', `${endpoint}/events/${event}/artist/${u.id}/cancel`);
    });
}

export function client(id) {
    return apiSend('GET', `${endpoint}/clients/${id}`)
    .then((c) => {
        const client = c.data[0];
        storage.save(`client-${id}`, JSON.stringify(client));
        return client;
    });
}

export function isAuthenticated() {
    // Get login session
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        if (u == null) return false;

        // Return validation response
        return apiSend('POST', `${endpoint}/artists/${u.id}/validate`, { key: u.key });
    })
    .then((r) => {
        if (r === false)  return r;

        console.log(`User authenticated: ${JSON.stringify(r.valid)}`);

        // If user is valid update storage
        if (r.valid) {
            storage.remove('login');
            storage.save('login', JSON.stringify(r.data[0]));
            return r.valid;
        }
    });
}

export function getFcmTopics(type = 'artist') {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            return apiSend('GET', `${endpoint}/${type}s/${u.id}/fcm/topic`);
        })
        .then((r) => {
            console.log("FCM Topics' Retreived.");

            // Subscribe all topics
            if (r.hasOwnProperty('data') && r.data != null) {
                r.data.forEach((topic) => {
                    push.subscribe(topic.fcm_topic);
                });
            }
        })
        .catch((e) => {
            console.warn(`Error retreiving FCM Topics\n${e.error}`);
        });
}

export function saveFcmToken(token) {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            // Send to API Server
            return apiSend('PUT', `${endpoint}/artists/${u.id}/fcm/token`, token);
        })
        .then((r) => {
            switch (r.response) {
                case true:
                    console.log(`Saved FCM Token: ${token}`);
                    break;

                case false:
                    console.warn(`Failed to save FCM Token: ${token}`);
                    console.warn(`${r.error}`);
                    break;

                default:
                    console.error('Unknown error occured communicating with API server.');
                    break;
            }
        });
}

export function saveFcmTopic(topic, type = 'artist') {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            // Send to API Server
            return apiSend('PUT', `${endpoint}/${type}s/${u.id}/fcm/topic`, { topic });
        })
        .then((r) => {
            switch (r.response) {
                case true:
                    console.log(`Saved FCM Topic ${topic}`);
                    break;

                case false:
                    console.warn(`Failed to save FCM topic: ${topic}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.error('Unknown error occured communicating with API server.');
                    break;
            }
        });
}

export function getChatToken() {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            return apiSend('GET', `${endpoint}/chat/artist/${u.username}/token`);
        });
}

export function saveStripeToken(token) {
    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            // Send to API Server
            return apiSend('PUT', `${endpoint}/artists/${u.id}/payment/id`, { token });
        })
        .then((r) => {
            switch (r.response) {
                case true:
                    console.log('Saved Stripe ID');
                    return true;

                case false:
                    console.warn('Failed to save Stripe ID');
                    console.warn(`${r.error_code}: ${r.error}`);
                    return false;

                default:
                    console.error('Unknown error occured communicating with API server.');
                    break;
            }
        });
}

export function getLocations() {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        // Send to API Server
        return apiSend('GET', `${endpoint}/artists/${u.id}/locations`);
    })
    .then((r) => {
        switch (r.response) {
            case true:
                console.log('Got locations.');
                ui.endLoader();
                return r;

            case false:
                console.warn('Failed to fetch locations.');
                console.warn(`${r.error_code}: ${r.error}`);
                ui.endLoader();
                return r;

            default:
                console.error('Unknown error occured communicating with API server.');
                ui.endLoader();
                return r;
        }
    });
}

export function deleteLocation(location) {
    ui.startLoader();

    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            // Send to API Server
            return apiSend('DELETE', `${endpoint}/artists/${u.id}/locations/${location}`);
        })
        .then((r) => {
            switch (r.response) {
                case true:
                    console.log(`Deleted location ${location}`);
                    break;

                case false:
                    console.warn(`Failed to delete location ${location}`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.error('Unknown error occured communicating with API server.');
                    break;
            }
        });
}

export function saveLocation() {
    ui.startLoader();

    return storage.get('login')
        .then(JSON.parse)
        .then((u) => {
            // Save ID to JSON
            const form = {
                name: $('#location-shortname').val(),
                lat: parseFloat($('#location-shortname').data('lat')),
                lng: parseFloat($('#location-shortname').data('lng')),
            };

            // Send to API Server
            return apiSend('PUT', `${endpoint}/artists/${u.id}/locations`, form);
        })
        .then((r) => {
            console.log(r);
            switch (r.response) {
                case true:
                    console.log(`Saved location`);
                    break;

                case false:
                    console.warn(`Failed to save location`);
                    console.warn(`${r.error_code}: ${r.error}`);
                    break;

                default:
                    console.error('Unknown error occured communicating with API server.');
                    break;
            }
        })
        .then(() => {
            $('.btn-delete-marker').click();
        });
}

export function updateProfilePic(picture) {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        const form = {
            picture,
        };
        console.log(form);

        return apiSend('PUT', `${endpoint}/artists/${u.id}/photo`, form);
    });
}

export function fillUserInfo() {
    $('#new-username').val('');
    $('#new-email').val('');
    $('#new-password').val('');
    $('#new-password2').val('');
    $('#new-bio').val('');
    $('#new-instagram').val('');
    $('#new-twitter').val('');
    $('#new-facebook').val('');

    // Update user info
    storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        $('#new-username').val(u.username);
        $('#new-email').val(u.email);
        $('#new-bio').val(u.bio);
        $('#new-instagram').val(u.social.instagram);
        $('#new-twitter').val(u.social.twitter);
        $('#new-facebook').val(u.social.facebook);
        $('[data-src="portfolio-preview"]').html(`
            <div class='grid-col grid-col--1'></div>
            <div class='grid-col grid-col--2'></div>
            <div class='grid-col grid-col--3'></div>
            <div class='grid-col grid-col--4'></div>
            ${u.portfolio !== null ? u.portfolio.map((img) => {
                return `<div class='grid-item bd bdrs-4 bdw-1 bdc-grey-400'><img class="lightbox-img" src="${img.photo}" /></div>`;
            }).join('') : ''}
        `);
        masonryInit();
    });
}

export function updateUser() {
    $('.alert').remove();

    // Verify inputs
    $('#new-username').removeClass('is-invalid');
    $('#new-email').removeClass('is-invalid');
    $('#new-password').removeClass('is-invalid');
    if (!tools.validate('username', $('#new-username').val())) {
        $('#new-username').addClass('is-invalid');
        return;
    }
    if (!tools.validate('email', $('#new-email').val())) {
        $('#new-email').addClass('is-invalid');
        return;
    }
    if (!tools.validatePassword($('#new-password').val(), $('#new-password2').val())) {
        $('#new-password').addClass('is-invalid');
        return;
    }

    ui.startLoader();

    // Update user info
    storage.get('login')
    .then(JSON.parse)
    .then(async (u) => {
        const form = {
            username: $('#new-username').val(),
            email: $('#new-email').val(),
            password: $('#new-password').val(),
            bio: $('#new-bio').val(),
            instagram: $('#new-instagram').val(),
            twitter: $('#new-twitter').val(),
            facebook: $('#new-facebook').val(),
            portfolio: [],
        },
            portfolioInput = $('#new-portfolio')[0],
            files = [];

        for (let i = 0; i < portfolioInput.files.length; i++) {
            files.push(tools.readFile(portfolioInput.files[i]));
        }

        const blobs = await Promise.all(files);
        form.portfolio = blobs;
        console.log(form);
        return apiSend('PUT', `${endpoint}/artists/${u.id}`, form);
    })
    .then((r) => {
        console.log(`User update response:\n${JSON.stringify(r, null, '\t')}`);

        if (r.error) {
            navigator.notification.alert(
                `An error occured, please try again later.\n${JSON.stringify(r.error)}`,
                null,
                'Error',
                'Okay'
            );
        }

        storage.remove('login')
        .then(() => {
            console.log(r);
            storage.save('login', JSON.stringify(r));
            fillUserInfo();
        });

        $('#user-info-form').before(`
            <div class="alert alert-success" role="alert">
                Successfully updated user info.
            </div>
        `);
    }, (err) => {
        console.warn(err);
        $('#user-info-form').before(`
            <div class="alert alert-danger" role="alert">
                Failed to update profile.
            </div>
        `);
    })
    .then(() => {
        // Remove alert after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut();
        }, (1000 * 7));
    })
    .finally(ui.endLoader);
}
