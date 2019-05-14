// imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as ui from '../ui';
import * as api from '../api';
import * as storage from '../storage';
import * as payment from '../payment';
import * as tools from '../tools';

// map let
let map;
// user lat/lng
let lat;
let lng;
// markers
const markers = [];
let locations = [];
// mapbox access token
const accessToken = 'pk.eyJ1IjoibWZzb2Z0d29ya3MiLCJhIjoiY2pudmZ5N3cwMDUwcTNwbm44ZzNnM201cCJ9.EsNcDPIULJ5_mhJYwOZEgA';

/**
 * API: Mapbox GL JS API
 */

function saveUserLocale() {
    const reverseGeocodeURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;

    $.get(
        reverseGeocodeURL,
        {
            access_token: accessToken,
            types: 'country',
        },
        (data) => {
            const locale = {
                country: data.features[0].text,
                code: data.features[0].properties.short_code.toUpperCase(),
            };

            storage.save('locale', JSON.stringify(locale));
        }
    );
}

// Make map from location
function makeMap() {
    return new Promise((resolve, reject) => {
        // Set user position array
        const position = [lng, lat];

        // Try to load map
        try {
            // Make Mapbox GL Map
            mapboxgl.accessToken = accessToken;
            map = new mapboxgl.Map(
                {
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v10?optimize=true',
                    center: position,
                    zoom: 16,
                    doubleClickZoom: false,
                    refreshExpiredTiles: false,
                    renderWorldCopies: false,
                }
            );
            resolve(map);
        } catch (e) {
            navigator.notification.alert(
                'Your device may not support this app, please reload the app and try again',
                null,
                'Error Loading Map',
                'Okay'
            );
            console.error(e);
            reject(e);
        }
    });
}

function removeMarker() {
    const marker = markers.pop();
    marker.remove();
}

export function getLocations() {
    return api.getLocations()
    .then((l) => {
        $(document).off('submit', '#artist-saved-location');

        $('.saved-location-marker').remove();

        if (l.hasOwnProperty('data') && l.data !== null) {
            l.data.forEach((location) => {
                makeLocationMarker(location);
            });

            $(document).on('click', 'button.btn-location-close', () => {
                $('.mapboxgl-popup').remove();
            });

            // Watch for delete marker button
            $(document).on('submit', '#artist-saved-location', deleteLocation);
        }
    });
}

// Make map marker
function makeMapMarker(lnglat, address) {
    // Remove old marker handlers
    if (markers.length) removeMarker();
    $(document).off('submit', '#artist-location');
    $(document).off('click', 'button.btn-delete-marker');

    // Create marker point div
    const point = document.createElement('div');
    point.className = 'location-marker';

    // Create popup with address, TODO: handle create event button
    const popup = new mapboxgl.Popup(
        {
            anchor: 'bottom',
            offset: 25,
            closeOnClick: true,
            closeButton: false,
            className: 'marker-popup',
        })
        .setHTML(`
            <h6>${address}</h6>
            <form id='artist-location'>
                <div class='form-group'>
                    <input type='text' class='form-control' name='location-shortname' id='location-shortname' placeholder='Home' data-lat="${lnglat[1]}" data-lng="${lnglat[0]}">
                </div>
                <div class="form-group mb-0">
                    <button type='button' class="btn-delete-marker btn clr-cancel">Cancel</button>&nbsp;
                    <button type='submit' class="btn clr-primary" >Save</button>
                </div>\
            </form>
        `);

    // Make marker with popup on map
    const marker = new mapboxgl.Marker(point)
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(map);

    markers.push(marker);

    // Watch for delete marker
    $(document).on('click', 'button.btn-delete-marker', removeMarker);

    // Watch for booking dialog button
    $(document).on('submit', '#artist-location', (e) => {
        e.preventDefault();

        api.saveLocation().then(getLocations);
    });
}

// Create geocoder for map
function addGeocoder() {
    const geocoder = new MapboxGeocoder(
        {
            accessToken,
            proximity:
            {
                longitude: lng,
                latitude: lat,
            },
            trackProximity: true,
        }
    );

    // Add geocoder to screen
    $('#geocoder').append(geocoder.onAdd(map));

    // On geocoder result click, log the result and add a marker
    geocoder.on('result', (e) => {
        makeMapMarker(e.result.center, e.result.place_name);
    });
}

// Get location from map click
function addMapClickMarker() {
    map.on('dblclick', (e) => {
        $.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json`,
            {
                access_token: accessToken,
                types: 'poi,address',
            },
            (data) => {
                const place = data.features[0];

                // Add marker to map at lat/lng
                // OLD: e.lngLat
                makeMapMarker(place.geometry.coordinates, place.place_name);
            }
        );
    });
}

function makeLocationMarker(loc) {
    // Create marker point div
    const point = document.createElement('div');
    point.className = 'saved-location-marker';

    // Create popup with address, TODO: handle create event button
    const popup = new mapboxgl.Popup(
        {
            anchor: 'bottom',
            offset: 25,
            closeOnClick: true,
            closeButton: false,
            className: 'marker-popup',
        })
        .setHTML(`
            <h4>${loc.name}</h4>
            <form id='artist-saved-location'>
                <div class="form-group mb-0">
                    <button type='button' class="btn-location-close btn clr-cancel">Cancel</button>&nbsp;
                    <button type='submit' class="btn-location-delete btn clr-primary" data-location-id="${loc.id}">Delete</button>
                </div>
            </form>
        `);

    // Make marker with popup on map
    new mapboxgl.Marker(point)
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);
}

function deleteLocation(e) {
    e.preventDefault();

    const id = $('.btn-location-delete').data('location-id');

    api.deleteLocation(id)
    .then(() => {
        $('.mapboxgl-popup').remove();
    })
    .then(getLocations);
}

function stripeInfoMessage() {
    navigator.notification.alert(
        'Welcome lovelie! Thank you for connecting with Stripe, you\'ll be able to manage where you want your money to go and withdraw your earnings by logging in to Stripe at https://dashboard.stripe.com/.',
        null,
        'Thank you!',
        'Okay'
    );
}

export function stripeAccountCheck() {
    storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        // If account has stripe token, end
        if (u.stripe_account_token && u.stripe_account_token !== null) return;

        // If no token, get stripe token with OAuth
        let account = null;
        const stripeAuth = cordova.InAppBrowser.open('https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_Dtemp3RTqA3RHzlGbSxwdAKTTn4n6fGl&scope=read_write', '_blank', 'location=no,hidden=yes');

        navigator.notification.alert(
            'NR uses the Stripe platform to handle all your payments safely, after you click connect we\'ll help you create a Stripe account for NR and get your payments ready.',
            () => {
                // Listen for exit and check status
                stripeAuth.addEventListener('exit', () => {
                    if (account === null) {
                        stripeAccountCheck();
                    } else {
                        payment.getStripeId(account)
                        .then(api.saveStripeToken)
                        .then(stripeInfoMessage)
                        .catch(() => {
                            navigator.notification.alert(
                                'Failed to save Stripe account info. Please try again later.',
                                navigator.app.exitApp,
                                'Error',
                                'Okay'
                            );
                        });
                    }
                });
                // Listen for OAuth return code
                stripeAuth.addEventListener('loadstart', (event) => {
                    if (event.url.indexOf('glam-squad-stripeoauth.nygmarosebeauty.com') > -1) {
                        // Loaded the redirect url
                        const link = new URL(event.url);
                        account = link.searchParams.get('code');
                        stripeAuth.close();
                    }
                });
                // Show browser
                stripeAuth.show();
            },
            'Welcome to NR Glam Squad!',
            'Connect'
        );
    });
}

export function confirmRecentEvents() {
    return api.getFinishedEvents()
    .then((d) => {
        if (!d.data) return;

        d.data.forEach((event) => {
            console.log(event);
            $('body').append(
            `<div class="modal fade event-confirmation-modal" tabindex="-1" role="dialog" aria-labelledby="eventConfirmationModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header">
                            <h5 class="modal-title">Confirm Booking</h5>
                        </div>
                        <!-- Modal body -->
                        <div class="modal-body ta-c">
                            ${event.address}
                            <br>
                            <span class='small'>
                                ${new Date(event.datetime).toLocaleString(tools.getLanguage())}
                            </span>
                            <hr>
                            Booking complete? Please confirm that you attended and we'll proceed with payment.<br><br>
                            If you don't confirm within 3 days we'll go ahead and process the payment for the booking.<br><br>
                            There's also a button incase you didn't make it to the event.
                        </div>
                        <!-- Modal footer -->
                        <div class="modal-footer">
                            <div class='text-center'>
                                <button type='button' class="btn m-1 clr-cancel btn-close-confirm" data-dismiss='modal'>Not Finished Yet</button>
                                <button type='button' class="btn m-1 btn-danger btn-confirm-event" data-attended='false' data-event="${event.id}">Didn't Attend</button>
                                <button type='button' class="btn m-1 clr-primary btn-confirm-event" data-attended='true' data-event="${event.id}">Event Finished</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>`);
        });

        $('.event-confirmation-modal').modal('show');

        $('.btn-confirm-event').click((e) => {
            // Start loader and save event
            ui.startLoader();
            const eventInfo = $(e.currentTarget),
                event = eventInfo.data('event');

            storage.get('login')
            .then(JSON.parse)
            .then((u) => {
                return api.saveArtistAttendance(event, u.id, eventInfo.data('attended'));
            })
            .catch(console.warn)
            .finally(ui.endLoader);

            // Close dialog
            eventInfo.siblings('.btn-close-confirm:first').click();
        });
    });
}

function loadMap() {
    $(document).ready(() => {
        // Add map to app
        makeMap()
        .then(getLocations);

        // Observe map for clicks and reverse geocode
        addMapClickMarker();

        // Add geocoder to app
        addGeocoder();
    });
}

function mapDefault() {
    // The Grove, LA
    lat = 34.052;
    lng = -118.243;

    return loadMap();
}

// Handle location data
export function onMapSuccess(position) {
    console.log(
        `Latitude:      ${position.coords.latitude.toFixed(3)}   degrees\nLongitude:     ${position.coords.longitude.toFixed(3)}  degrees\nAltitude:      ${position.coords.altitude}        meters above current position\nPosition Accuracy: ${position.coords.accuracy}        meters\nAltitude Accuracy: ${position.coords.altitudeAccuracy}    meters\nHeading:      ${position.coords.heading}         degrees\nSpeed:       ${position.coords.speed}          meters/s\nTimestamp:     ${new Date(position.timestamp)}      \n`
    );

    lat = parseFloat(position.coords.latitude.toFixed(3));
    lng = parseFloat(position.coords.longitude.toFixed(3));

    saveUserLocale();

    loadMap();
}

// Handle location errors TODO: handle errors on device
export function onMapError(error) {
    if (error.hasOwnProperty('code')) {
        console.log(`${error.code}: ${error.message}`);
        switch (error.code) {
        case 1:
            navigator.notification.alert(
                'It\'s recommended to enable location to make booking events easier.',
                mapDefault,
                'Location Access Denied',
                'Continue'
            );
            break;

        case 2:
            navigator.notification.alert(
                'Unable to access location. Ensure device is connected to a network and GPS is enabled.',
                mapDefault,
                'Location Access Error',
                'Continue'
            );
            break;

        case 3:
            navigator.notification.alert(
                'Unable to access location. Please enable location access to make booking events easier.',
                mapDefault,
                'Location Access Error',
                'Continue'
            );
            break;

        default:
            break;
        }
    } else {
        mapDefault();
    }
}
