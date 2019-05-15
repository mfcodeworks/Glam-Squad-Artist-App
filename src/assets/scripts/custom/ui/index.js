/* eslint-disable no-use-before-define */

// imports
import masonryInit from '../../masonry';
import * as api from '../api';
import * as storage from '../storage';
import * as cache from '../cache';
import * as tools from '../tools';
import * as chat from '../chat';
import * as settings from '../settings';

// Listener tracker
const listeners = [];

export function startLoader(color = 'black') {
    $('body').prepend(`<div class='loader-${color}'></div>`);
}

export function endLoader() {
    $("[class^='loader-']").remove();
}

export function endPageLoading() {
    setTimeout(() => {
        $('#loader').addClass('fadeOut');
    }, 300);
}

// Login screen forms
export function registerUserHandler() {
    $('[data-role="register"]').click(() => {
        api.registerUser();
    });
}

export function loginUserHandler() {
    $('[data-role="login"]').click(() => {
        api.authenticateUser();
    });
}

export function forgotPasswordHandler() {
    $('#btn-confirm-forgot-password').click(() => {
        api.forgotPassword();
    });
}

export function notificationEvent(event) {
    api.client(event.clientId)
    .then((client) => {
        // Cache client
        storage.save(`client-${client.id}`, JSON.stringify(client));

        // Set datetime object
        const date = new Date(event.datetime);

        // Set notification HTML
        const html = `
        <li>
            <a data-role="event-notification-item" data-event-id="${event.id}" href="#" class="peers fxw-nw td-n p-20 bdB c-grey-800 cH-blue bgcH-grey-100">
                <div class="peer mR-15">
                    <img class="w-3r h-3r bdrs-50p user-photo bd bdc-grey-400" src="${client.profile_photo}" alt="">
                </div>
                <div class="peer peer-greed">
                    <span>
                        <span class="fw-500">${client.username}</span>
                        <span class="c-grey-600">has an event at <span class="text-dark">${event.address}</span></span>
                    </span>
                    <p class="m-0">
                        <small class="fsz-xs">${date.toLocaleString(tools.getLanguage())}</small>
                    </p>
                </div>
            </a>
        </li>`;

        // Append notification
        $('[data-role="notification-menu-display"]:first').append(html);
    });
}

export function handleEventNotificationClick() {
    $(document).on('click', '[data-role="event-notification-item"]', (e) => {
        e.stopPropagation();
        let event,
            client;

        // Empty any previous event info
        $('#event-information').empty();

        // Get event ID
        const eventId = $(e.currentTarget).data('event-id');

        // Get event data from cache
        cache.getEvent(eventId)
        .then((ev) => {
            event = ev;
            return event.clientId;
        })
        .then(api.client)
        .then((cl) => {
            client = cl;
        })
        .then(() => {
            // Create datetime object
            const date = new Date(event.datetime),
                price = `$${event.price.toFixed(2)}`;
            let rating = '';

            // Set rating HTML
            if (client.rating) {
                rating = '<span class="fl-r pt-1">';
                for (let i = 0; i < Math.round(client.rating); i++) {
                    rating += '<i class="fas fa-star fsz-xs"></i>';
                }
                rating += '</span>';
            }

            // Set modal HTML
            const html =
            `<div data-event="${event.id}">
                <h5 class="mb-1">${event.address}</h5>
                <small>${date.toLocaleString(tools.getLanguage())}</small>
                <small class="ml-3">${price}</small>
                <ul class="list-group list-group-flush mb-3 mt-4 ta-l">
                    <li class='list-group-item' data-role="booking-client" data-client-id="${client.id}">
                        <img class="w-2r h-2r bdrs-50p user-photo mR-5  bd bdc-grey-400" src="${client.profile_photo}">
                        <span class="fsz-sm mR-5 fw-500 c-grey-700">${client.username}</span>
                        ${rating}
                    </li>
                </ul>
                <p class="mb-2 ta-l">Packages:</p>
                <ul class="list-group list-group-flush mb-3 ta-l">
                    ${event.packages.map((p) => {
                        return (p.id === 3) ?
                            `<li class='list-group-item'>
                                ${p.name}
                                <span class='float-right'>${event.extraHours} hours</span>
                            </li>`
                        : `<li class='list-group-item'>${p.name}</li>`;
                    }).join('')}
                </ul>
                ${event.note ? `<p class='ta-l mb-4'>Note: </br> ${event.note}</p>` : ''}
                <div class="grid">
                    <div class='grid-col grid-col--1'></div>
                    <div class='grid-col grid-col--2'></div>
                    <div class='grid-col grid-col--3'></div>
                    <div class='grid-col grid-col--4'></div>
                    ${event.references ? event.references.map((img) => {
                        return `<div class='grid-item'><img class="lightbox-img" src="${img.photo}"/></div>`;
                    }).join('') : ''}
                </div>
            </div>`.trim();

            $('#event-information').append(html);
            masonryInit();

            $('#btn-accept-event').data('event-id', event.id);

            $('#event-info-modal').modal('show');
        });
    });
}

export function bookingClientHandler() {
    $(document).on('click', '[data-role="booking-client"]', (e) => {
        // Set client ID
        const id = $(e.currentTarget).data('client-id');
        // Get client data
        api.client(id)
        .then((client) => {
            // Log client
            console.log(client);

            // Set rating html
            let rating = '';
            if (client.rating > 0) {
                for (let i = 0; i < Math.round(client.rating); i++) {
                    rating += '<i class="fas fa-star"></i>';
                }
            } else {
                rating = '<span class="fs-i">client has no rating yet</span>';
            }

            $('[data-src="booking-client-rating"]').html(rating);
            $('[data-src="booking-client-username"]').html(`${client.username}`);
            $('[data-src="booking-client-photo"]').attr('src', client.profile_photo);
            $('#btn-report-client').data('client-id', client.id);

            // Show client profile
            $('#client-modal').modal('show');
            masonryInit();
        });
    });
}

export function fillArtistRoles() {
    return api.getArtistRoles()
    .then((r) => {
        if (r.hasOwnProperty('data')) {
            r.data.forEach((role) => {
                $('#reg-role').append(`<option data-role-id="${role.id}">${role.name}</option>`);
            });
        } else {
            navigator.notification.alert(
                'Error occured connecting to database, please ensure network is connected.',
                navigator.app.exitApp,
                'Error',
                'Okay'
            );
        }
    });
}

export function addSettingsEvent(event) {
    const price = `$${event.price.toFixed(2)}`,
          eventDate = new Date(event.datetime),
          now = new Date();
    let ratingsRequired;

    api.client(event.clientId)
    .then((client) => {
        // If event in past and no rating present
        ratingsRequired = (now.getTime() > eventDate.getTime() && !event.ratings.clients.hasOwnProperty(client.id));

        // Cache client
        storage.save(`client-${client.id}`, JSON.stringify(client));

        const html =
        `<div data-event="${event.id}" class="ta-c">
            <h5 class="mb-0">${event.address}</h5>
            <small>${eventDate.toLocaleString(tools.getLanguage())}</small>
            <small class="ml-3">${price}</small>
            <ul class="list-group list-group-flush mb-3 mt-4 ta-l">
                <li class='list-group-item' data-role="booking-client" data-client-id="${client.id}">
                    <img class="w-2r h-2r bdrs-50p user-photo mR-5  bd bdc-grey-400" src="${client.profile_photo}">
                    <span class="fsz-sm mR-5 fw-500 c-grey-700">${client.username}</span>
                    ${(ratingsRequired) ?
                        `<button type="button" class="fl-r btn-rate-client btn btn-md mt-1 p-0 c-grey-700" data-event-id="${event.id}">
                            Rate Client&nbsp;<i class="fas fa-star"></i>
                        </button>` :
                        `<button type="button" class="fl-r btn btn-md mt-1 p-0 c-grey-700" data-event-id="${event.id}" disabled>
                            Client Rated&nbsp;<i class="fas fa-star"></i>
                        </button>`
                    }
                </li>
            </ul>
            <p class="mb-2 ta-l">Packages:</p>
            <ul class="list-group list-group-flush mb-4 ta-l">
                ${event.packages.map((p) => {
                    return (p.id === 3) ?
                        `<li class='list-group-item'>
                            ${p.name}
                            <span class='fl-r'>${event.extraHours} hours</span>
                        </li>`
                    : `<li class='list-group-item'>${p.name}</li>`;
                }).join('')}
            </ul>
            <div class="grid">
                <div class='grid-col grid-col--1'></div>
                <div class='grid-col grid-col--2'></div>
                <div class='grid-col grid-col--3'></div>
                <div class='grid-col grid-col--4'></div>
                ${event.references ? event.references.map((img) => {
                    return `<div class='grid-item'><img class="lightbox-img" src="${img.photo}"/></div>`;
                }).join('') : ''}
            </div>
        </div>`.trim();

        $('[data-src="booking-event-body"]').html(html);
        masonryInit();
    });
}

export function rateClientHandler() {
    $(document).on('click', '.btn-rate-client', (e) => {
        e.stopPropagation();

        // Handle Rate Client Button Click
        $('#rate-client-form').empty();

        cache.getEvent($(e.currentTarget).data('event-id'))
        .then((event) => {
            // if client has rating display, if no rating prompt for rating
            return api.client(event.clientId)
            .then((client) => {
                // If no ratings exist then require a rating
                const html = `
                <div class="ta-c client-rating" data-event="${event.id}" data-client="${client.id}">
                    <span class="mb-2 fsz-md fw-500 c-grey-700">${client.username}</span>
                    <div class='star-rating'>
                        <i class="far fa-star" data-star='1'></i>
                        <i class="far fa-star" data-star='2'></i>
                        <i class="far fa-star" data-star='3'></i>
                        <i class="far fa-star" data-star='4'></i>
                        <i class="far fa-star" data-star='5'></i>
                    </div>
                </div>`;

                $('#rate-client-form').append(html);
                $('#rate-client-modal').modal('show');
            });
        })
        .then(starRatingHandler)
        .then(clientRatingFormHandler);
    });
    return true;
}

export function clientRatingFormHandler() {
    $('#btn-submit-rate-client').click(() => {
        const e = $('.client-rating:first'),
            clientId = e.data('client'),
            eventId = e.data('event');

        // Get artist rating
        let rating = 0;
        $('.star-rating').children('.fa-star').each((ind, el) => {
            if ($(el).hasClass('fas')) rating++;
        });

        // Submit rating
        api.clientRating(eventId, clientId, rating)
        .then(() => {
            // Remove unrated event
            settings.removeCalendarEvent(eventId);
            // Get updated event and replace booking
            return api.getEvent(eventId);
        })
        .then((event) => {
            console.log('Updated event');
            console.log(event);
            // Add updated event
            settings.addCalendarEvent(event);
            // Cache event
            storage.save(`event-${event.id}`, JSON.stringify(event));
        })
        .finally(() => {
            // Close dialog
            $('#btn-close-rate-client').click();
        });

        // Disable rating button
        $(`.btn-rate-client[data-event-id="${eventId}"]`).attr('disabled', true);
        $(`.btn-rate-client[data-event-id="${eventId}"]`).html('Client Rated&nbsp;<i class="fas fa-star"></i>');
    });
}

export function starRatingHandler() {
    $(document).on('click', '.fa-star', (e) => {
        const ratingHandler = $(e.currentTarget);

        // Save star level
        const starWeight = ratingHandler.data('star');

        // Fill in star
        ratingHandler.removeClass('far');
        ratingHandler.addClass('fas');

        // Loop sibling stars
        ratingHandler.siblings('.fa-star').each((ind, ev) => {
            const star = $(ev);
            if (star.data('star') < starWeight) {
                // If lower star make it filled as well
                star.removeClass('far');
                star.addClass('fas');
            } else {
                // If higher star
                star.removeClass('fas');
                star.addClass('far');
            }
        });
    });
}

export function updatePortfolioImages() {
    $('#reg-portfolio').change(() => {
        $('#reg-portfolio').html(`
            <div class='grid-col grid-col--1'></div>
            <div class='grid-col grid-col--2'></div>
            <div class='grid-col grid-col--3'></div>
            <div class='grid-col grid-col--4'></div>`.trim()
        );

        const photos = $('#reg-portfolio')[0].files;

        Array.from(photos).forEach((photo) => {
            tools.readFile(photo)
            .then((e) => {
                $('#reg-portfolio-preview').append(`<div class='grid-item bd bdrs-4 bdw-1 bdc-grey-400'><img src="${e}" /></div>`);
            });
        });
        masonryInit();
    });
}

/**
 * Begin Chat Functions
 */
export function printChannel(channel) {
    storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        if ($(`div[data-role="channel"][data-sid="${channel.sid}"]`).length) return;

        // Set event object
        const event = channel.state.attributes;
        // Set image
        let img;
        (u.profile_photo === null) ? img = '../static/images/logo-white.png' : img = u.profile_photo;

        // Set event datetime
        const date = new Date(event.datetime);
        const datetime = `${date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute:'2-digit' })} ${date.toLocaleDateString(navigator.language)}`;

        // Create HTML item
        const item =
        `<div class="peers fxw-nw ai-c p-20 bdB bgc-white bgcH-grey-50 cur-p" data-role="channel" data-sid="${channel.sid}">
            <div class="peer">
                <img src="${img}" alt="" class="w-3r h-3r bdrs-50p user-photo  bd bdc-grey-400">
            </div>
            <div class="peer peer-greed pL-20">
                <h6 class="lh-1 mB-0">${event.address.split(',')[0]}</h6>
                <small>${datetime}</small>
            </div>
        </div>`;

        // Append item
        $('div[data-role="chat-channel-view"]').append(item);
    });
}

export function chatHandler() {
    // Handle attach media
    $('button[data-role="chat-attach"] input').change(tools.checkChatMedia);
    $('button[data-role="chat-attach"]').click((e) => {
        $(e.currentTarget).children('input:first').click();
    });
    $('button[data-role="chat-attach"] input').click((e) => {
        e.stopPropagation();
    });

    // Handle message send
    $('button[data-role="chat-send"]').click(() => {
        let media,
            message;
        const input = $('button[data-role="chat-attach"] > input');

        // Log click
        console.log('Send button was clicked');

        // Get message
        if (input[0].files.length) {
            media = input[0].files[0];
            message = new FormData();
            message.append('file', media);
        } else {
            message = $('textarea[data-role="chat-message"]').val();
            $('textarea[data-role="chat-message"]').val('');
        }

        // Log message
        console.log(message);

        // Reset inputs
        $('textarea[data-role="chat-message"]').val('');
        input.val('');

        // If message is empty cancel send
        if (message instanceof FormData !== true && !message.length) return;

        // Get channel sid
        const sid = $('[data-role="chat-message-view"]').data('sid');

        // Get channel object
        chat.getChannel(sid)
        // Send message
        .then((channel) => {
            return channel.sendMessage(message);
        })
        // Auto scroll down
        .finally(() => {
            $('[data-role="chat-message-view"]').parent().scrollTop($('[data-role="chat-message-view"]').height());
        });
    });
}

// Print basic info message for chat
function printInfoMessage(message) {
    const html =
    `<div class="layers ai-fc gapY-10">
        <div class="layer">
            <div>
                <span class="c-grey-600 fs-i fsz-def">${message}</span>
            </div>
        </div>
    </div>`;
    $('[data-role="chat-message-view"]').append(html);
}

function cacheFile(url, message, source) {
    const type = message.media.contentType;
    console.log('Caching file');

    // If not cached get and cache
    return tools.readFileURL(url)
    .then((file) => {
        console.log(file);
        (type.indexOf('image') > -1) ? source.attr('src', file) : source.attr('href', file);
        return storage.save(`media-${message.media.sid}`, file);
    })
    .catch(console.warn)
    .finally(() => {
        try {
            source.off('load');
        } catch (e) {
            console.log('No file listener for this source');
        }
    });
}

export function videoCache() {
    $('video').on('ended', (e) => {
        const vid = $(e.currentTarget);
        // Get media SID
        const sid = vid.data('sid');

        // Set source for media
        const source = vid.find('source:first');
        const url = source.attr('src');
        console.log(url);

        // Check if video already cached
        storage.get(`media-${sid}`)
        .then((v) => {
            // If cached exit
            if (v) {
                source.attr('src', v);
                return;
            }

            // If not cached get and cache
            return tools.readFileURL(url)
            .then((file) => {
                console.log(file);
                // Replace URL links with cache file
                source.attr('src', file);
                $(`a[data-sid="${sid}"]`).attr('href', file);
                return storage.save(`media-${sid}`, file);
            })
            .catch(console.warn);
        });
    });
}

export function mediaCache(url, message) {
    let source;
    const type = message.media.contentType;
    if (type.indexOf('image') > -1) {
        console.log(`Caching ${type} ${url}`);
        source = $(`img[data-sid='${message.media.sid}']`);
        source.on('load', () => { cacheFile(url, message, source); });
    } else if (type.indexOf('video') === -1) {
        console.log(`Caching ${type} ${url}`);
        source = $(`a[data-sid='${message.media.sid}']`);
        cacheFile(url, message, source);
    }
}

function getMediaInfo(message) {
    let mediaPlaceholder;

    // Check cache for media
    return storage.get(`media-${message.media.sid}`)

    // If not available in cache get URL
    .then((url) => {
        if (url) return url;
        return message.media.getContentUrl();
    })

    // Use source to embed
    .then((url) => {
        // Create image placeholder
        if (message.media.contentType.indexOf('image') > -1) {
            mediaPlaceholder = `<img src="${url}" class="lightbox-img w-100p" data-sid="${message.media.sid}">`;
        // Create video placeholder
        } else if (message.media.contentType.indexOf('video') > -1) {
            mediaPlaceholder =
            `<video class="lightbox-vid w-100p" data-sid="${message.media.sid}" controls playsinline controlsList="nodownload" preload="metadata">
                <source src="${url}" type="${message.media.contentType}">
                Your device does not support in-app video.
            </video>
            <br>
            <a href="${url}" class="btn btn-secondary p-4" data-sid="${message.media.sid}" download="${message.media.filename}">
                <i class="fas fa-file-download mX-5"></i>${message.media.filename}
            </a>`;
        // Create file placeholder
        } else {
            mediaPlaceholder =
            `<a href="${url}" class="btn btn-secondary p-4" data-sid="${message.media.sid}" download="${message.media.filename}">
                <i class="fas fa-file-download mX-5"></i>${message.media.filename}
            </a>`;
        }

        return url;
    })
    .then((url) => {
        // Append body to message
        const chatBody = $(`div[data-sid="${message.sid}"]`).find('span[data-role="chat-message-body"]');
        chatBody.html(mediaPlaceholder);
        // Set video cache
        videoCache();
        // If not base64 set media cache
        if (url.indexOf('data') !== 0) mediaCache(url, message);
    });
}

// Print channel message
function printMessage(message) {
    let html;
    let me;

    storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        me = `artist-${u.username}`;
    })
    .then(() => {
        return chat.getUser(message.state.author);
    })
    .then((author) => {
        // Set datetime
        const date = new Date(message.state.dateUpdated);
        const now = new Date();
        let datetime;

        // Format datetime
        (date.toDateString() === now.toDateString()) ? datetime = date.toLocaleTimeString(tools.getLanguage(), { hour: '2-digit', minute:'2-digit' }) : datetime = date.toLocaleDateString(tools.getLanguage());

        // Check if media message
        if (message.state.type === 'media') {
            getMediaInfo(message);
        }

        let body;
        (message.state.type === 'media') ? body = '<i class="fas fa-spinner fa-spin"></i>' : body = message.state.body;
        switch (message.state.author) {
            case me:
                html =
                `<div class="layers ai-fe gapY-10" data-sid="${message.sid}">
                    <div class="layer mw-80p">
                        <div class="peers ta-r fxw-nw ai-c pY-3 pX-10 bgc-white bdrs-2 lh-3/2">
                            <div class="peer mL-15 ord-1"><small>${author.friendlyName}</small><br><small>${datetime}</small></div>
                            <div class="peer-greed ord-0"><span data-role="chat-message-body">${body}</span></div>
                        </div>
                    </div>
                </div>`;
                break;

            default:
                html =
                `<div class="layers ai-fs gapY-10" data-sid="${message.sid}">
                    <div class="layer mw-80p">
                        <div class="peers ta-r fxw-nw ai-c pY-3 pX-10 bgc-white bdrs-2 lh-3/2">
                            <div class="peer mL-15 ord-1"><small>${author.friendlyName}</small><br><small>${datetime}</small></div>
                            <div class="peer-greed ord-0"><span data-role="chat-message-body">${body}</span></div>
                        </div>
                    </div>
                </div>`;
                break;
        }

        $('[data-role="chat-message-view"]').append(html);

        // Auto scroll down
        $('[data-role="chat-message-view"]').parent().scrollTop($('[data-role="chat-message-view"]').height());
    });
}

export function channelListHandler() {
    // Open chat on click
    $(document).on('click', '[data-role="channel"]', (e) => {
        const channelList = $(e.currentTarget);

        // Start loader
        startLoader();

        if (channelList.data('sid') === $('[data-role="chat-message-view"]').data('sid')) {
            // End loader
            endLoader();
            return;
        }

        // Clear previous messages
        $('[data-role="chat-message-view"]').empty();

        // Get channel sid
        const sid = channelList.data('sid');

        // Set sid for chat
        $('[data-role="chat-message-view"]').data('sid', sid);

        // Set chat image
        const img = channelList.find('img:first').attr('src');

        // Get channel info
        storage.get(`channel-${sid}`)
        .then(JSON.parse)
        .then((data) => {
            // Put chat image
            $('#chat-box').find('img:first').attr('src', img);

            // Set event datetime
            const date = new Date(data.attributes.datetime);
            const datetime = `${date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute:'2-digit' })} ${date.toLocaleDateString(navigator.language)}`;

            const addressArray = data.friendlyName.split(',');

            // Set chat title
            const title =
            `<h6 class="lh-1 mB-0">${addressArray[0]}</h6>
            <small>${addressArray.slice(0, 2)}</small><br>
            <small>${datetime}</small>`.trim();
            $('[data-role="chat-title"]').html(title);
        })
        .then(() => {
            // Get channel
            return chat.getChannel(sid)
            // Setup channel handlers
            .then((channel) => {
                // Add new channel listeners
                if (!listeners.includes(channel.sid)) {
                    channel.on('messageAdded', printMessage);
                    channel.on('memberJoined', () => { printInfoMessage('New artist accepted booking.'); });
                    channel.on('memberLeft', () => { printInfoMessage('Artist cancelled booking.'); });
                    listeners.push(channel.sid);
                }
                // Return channel messages
                return channel.getMessages(30);
            });
        })
        .then((messages) => {
            console.log(messages);

            // If channel has messages print each message
            if (messages.items.length) {
                return messages.items.reduce((p, message) => {
                    return p.then(() => { return printMessage(message); });
                }, Promise.resolve());
            }

            // If no messages then print none found
            printInfoMessage('No tea found.');
        })
        // End loader
        .finally(endLoader);
    });
}

export function selectFirstChat() {
    // Get first chat channel
    const firstChat = $('[data-role="channel"]').first();

    // If there's a chat open it
    if (firstChat.length) {
        firstChat.click();
    // If no chat then print none found
    } else {
        printInfoMessage('No chats, no tea.');
    }
}
