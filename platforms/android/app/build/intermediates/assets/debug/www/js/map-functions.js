// imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as ui from './ui-tools';
import * as api from './api';
import * as tools from './tools';
import * as push from './push';
import * as storage from './storage';
import * as payment from './payment';

// map var
var map;
// user lat/lng
var lat;
var lng;
// markers
var markers = [];
var locations = [];
// mapbox access token
var accessToken = 'pk.eyJ1IjoibWZzb2Z0d29ya3MiLCJhIjoiY2pudmZ5N3cwMDUwcTNwbm44ZzNnM201cCJ9.EsNcDPIULJ5_mhJYwOZEgA';

// Handle location data
export function onMapSuccess(position) {
    console.log(
        'Latitude: '          + position.coords.latitude.toFixed(3)        + ' degrees\n' +
        'Longitude: '         + position.coords.longitude.toFixed(3)       + ' degrees\n' +
        'Altitude: '          + position.coords.altitude                   + ' meters above current position\n' +
        'Position Accuracy: ' + position.coords.accuracy                   + ' meters\n' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy           + ' meters\n' +
        'Heading: '           + position.coords.heading                    + ' degrees\n' +
        'Speed: '             + position.coords.speed                      + ' meters/s\n' +
        'Timestamp: '         + new Date(position.timestamp)               + ' \n'
    );

    lat = parseFloat(position.coords.latitude.toFixed(3));
    lng = parseFloat(position.coords.longitude.toFixed(3));

    saveUserLocale();
    
    return loadMap();
}

function mapDefault() {
    lat = 34.072;
    lng = -118.358;
    return loadMap();
}

function loadMap() {
    return new Promise(function(resolve) {
        $(document).ready(function() {
            var promises = [];

            // Add map to app
            promises.push(makeMap());
    
            // Add geocoder to map
            promises.push(addGeocoder());
            
            // Observe map for clicks and reverse geocode
            addMapClickMarker();
    
            // Add artist locations
            getLocations();

            Promise.all(promises)
                .then(resolve);
        })
    });
}

// Handle location errors TODO: handle errors on device
export function onMapError(error) {
    if(error.hasOwnProperty("code")) {
        console.log(`code: ${error.code} \nmessage: ${error.message}\n`);
    
        return new Promise(function(resolve) {
            switch(error.code) {
                case 1:
                    navigator.notification.alert(
                        "It's recommended to enable location to make booking events easier.",
                        function() {
                            resolve(mapDefault());
                        },
                        "Location Access Denied",
                        "Continue"
                    );
                    break;
        
                case 2:
                    navigator.notification.alert(
                        "Unable to access location. Ensure device is connected to a network and GPS is enabled.",
                        function() {
                            resolve(mapDefault());
                        },
                        "Location Access Error",
                        "Continue"
                    );
                    break;
        
                case 3:
                    navigator.notification.alert(
                        "Unable to access location. Please enable location access to make booking events easier.",
                        function() {
                            resolve(mapDefault());
                        },
                        "Location Access Error",
                        "Continue"
                    );
                    break;
            }
        });
    } else {
        return mapDefault();
    }
}

/** 
 * API: Mapbox GL JS API 
 */

function saveUserLocale() {
    return new Promise(function(resolve) {
        $.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
            {
                access_token: accessToken,
                types: "country"
            },
            function(data) {
                var locale = {
                    country: data.features[0].text,
                    code: data.features[0].properties.short_code.toUpperCase()
                };

                storage.save("locale", JSON.stringify(locale))
                    .then(function() {
                        return push.subscribe(locale.country)
                    })
                    .then(resolve);
            }
        );
    })
}

// Make map from location
function makeMap() {
    return new Promise(function(resolve) {
        // Set user position array
        var position = [lng, lat];
    
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
    
        // On map loaded, remove splash screen
        map.on('load', function() {
            ui.removeSplash();
            resolve(true);
        });
    });
}

// Create geocoder for map
function addGeocoder() {
    return new Promise(function(resolve) {
        var geocoder = new MapboxGeocoder(
            {
                accessToken: accessToken,
                proximity: 
                {
                    longitude: lng,
                    latitude: lat
                },
                trackProximity: true,
            }
        );
    
        // Add geocoder to screen
        $("#geocoder").append(geocoder.onAdd(map));
    
        // On geocoder result click, log the result and add a marker
        geocoder.on('result', function(e) {
            makeMapMarker(e.result.center, e.result.place_name);
        });
    
        resolve(true);
    });
}

// Get location from map click
function addMapClickMarker() {
    map.on('dblclick', function (e) {
        $.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json`,
            {
                access_token: accessToken,
                types: "poi,address",
            },
            function(data) {
                var place = data.features[0]

                // Add marker to map at lat/lng
                // OLD: e.lngLat
                makeMapMarker(place.geometry.coordinates, place.place_name);
            }
        );
    });
}

// Make map marker
function makeMapMarker(lnglat, address) {
    // Remove old marker handlers
    if(markers.length) removeMarker();
    $(document).off('submit', '#artist-location');
    $(document).off('click', 'button.btn-delete-marker');

    // Create marker point div
    var point = document.createElement('div');
    point.className = 'location-marker';

    // Create popup with address, TODO: handle create event button
    var popup = new mapboxgl.Popup(
        {
            anchor: 'bottom',
            offset: 25,
            closeOnClick: true,
            closeButton: false,
            className: "marker-popup"
        })
        .setHTML(`
            <h6>${address}</h6>
            <form id="artist-location">
                <div class="form-group">
                    <input type="text" class="form-control" name="location-shortname" id="location-shortname" placeholder="Home" data-lat="${lnglat[1]}" data-lng="${lnglat[0]}">
                </div>
                <div class="form-group mb-0">
                    <button type="button" class="btn-delete-marker btn clr-cancel">Cancel</button>&nbsp;
                    <button type="submit" class="btn clr-primary" >Save</button>
                </div>\
            </form>
        `);

    // Make marker with popup on map
    var marker = new mapboxgl.Marker(point)
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(map)

    markers.push(marker);

    // Watch for delete marker
    $(document).on('click', 'button.btn-delete-marker', removeMarker);

    // Watch for booking dialog button
    $(document).on('submit', '#artist-location', function(e) {
        e.preventDefault();

        api.saveLocation().then(getLocations);
    });
}

function makeLocationMarker(loc) {
    // Create marker point div
    var point = document.createElement('div');
    point.className = 'saved-location-marker';

    // Create popup with address, TODO: handle create event button
    var popup = new mapboxgl.Popup(
        {
            anchor: 'bottom',
            offset: 25,
            closeOnClick: true,
            closeButton: false,
            className: "marker-popup"
        })
        .setHTML(`
            <h4>${loc.name}</h4> 
            <form id="artist-saved-location"> 
                <div class="form-group mb-0"> 
                    <button type="button" class="btn-location-close btn clr-cancel">Cancel</button>&nbsp; 
                    <button type="submit" class="btn-location-delete btn clr-primary" data-location-id="${loc.id}">Delete</button> 
                </div>
            </form> 
        `);

    // Make marker with popup on map
    var marker = new mapboxgl.Marker(point)
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map)

    locations.push(marker);
}

function removeMarker() {
    var marker = markers.pop();
    marker.remove();
}

export function getLocations() {
    return api.getLocations()
        .then(function(l) {
            $(document).off('submit', '#artist-saved-location');
            
            $(".saved-location-marker").remove();

            if(l.hasOwnProperty('data') && l.data !== null) {
                var locations = l.data;

                for(var i = 0; i < locations.length; i++) {
                    makeLocationMarker(locations[i]);
                }

                $(document).on('click', 'button.btn-location-close', function() { 
                    $(".mapboxgl-popup").remove();    
                });

                // Watch for delete marker button
                $(document).on("submit", "#artist-saved-location", deleteLocation);
            }
        });
}

function deleteLocation(e) {
    e.preventDefault();

    var id = $(".btn-location-delete").data("location-id");

    api.deleteLocation(id)
        .then(function() {
            $(".mapboxgl-popup").remove()
        })
        .then(getLocations);
}

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(r) {
            if(!r) tools.load("login.html");
            return true;
        });
}

export function stripeAccountCheck() {
    storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            // If account has stripe token, end
            if(u.stripe_account_token) return;

            // If no token, get stripe token with OAuth
            var account = null;
            var stripeAuth = cordova.InAppBrowser.open("https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_Dtemp3RTqA3RHzlGbSxwdAKTTn4n6fGl&scope=read_write", "_blank", "location=no,hidden=yes");
        
            navigator.notification.alert(
                `NR uses the Stripe platform to handle all your payments safely, after you click connect we'll help you create a Stripe account for NR and get your payments ready.`,
                function() {
                    // Listen for exit and check status
                    stripeAuth.addEventListener('exit', function(event) {
                        if(account === null) {
                            stripeAccountCheck();
                        } else {
                            payment.getStripeId(account)
                                .then(api.saveStripeToken)
                                .then(stripeInfoMessage)
                                .catch(function() {
                                    navigator.notification.alert(
                                        "Failed to save Stripe account info. Please try again later.",
                                        navigator.app.exitApp,
                                        "Error",
                                        "Okay"
                                    );
                                });
                        }
                    });
                    // Listen for OAuth return code
                    stripeAuth.addEventListener('loadstart', function(event) {
                        if(event.url.indexOf("glam-squad-stripeoauth.nygmarosebeauty.com") > -1) {
                            //Loaded the redirect url
                            var link = new URL(event.url);
                            account = link.searchParams.get("code");
                            stripeAuth.close();
                        }
                    });
                    // Show browser
                    stripeAuth.show();
                },
                "Welcome to NR Glam Squad!",
                "Connect"
            );
        });
}

function stripeInfoMessage() {
    navigator.notification.alert(
        "Welcome lovelie! Thank you for connecting with Stripe, you'll be able to manage where you want your money to go and withdraw your earnings by logging in to Stripe at https://dashboard.stripe.com/.",
        null, 
        "Thank you!", 
        "Okay"
    );
}

export function confirmRecentEvents() {
    return api.getFinishedEvents()
        .then(function(d) {
            if(d.hasOwnProperty('data') === false) return;

            var dialogs = [];
            var events = d.data;

            events.forEach(function(event) {
                console.log(event);

                dialogs.push(
                    storage.get("locale")
                        .then(JSON.parse)
                        .then(function(locale) {
                            var dialog =
                            `<div class="modal event-confirmation-modal">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content clr-dark">
                            
                                        <!-- Modal Header -->
                                        <div class="modal-header clr-dark">
                                            <p class="modal-title display-4 strong">Confirm Booking</p>
                                        </div>
                            
                                        <!-- Modal body -->
                                        <div class="modal-body clr-dark text-center">
                                            <hr class="clr-white mt-0">
                                            <p>
                                                ${event.address}
                                                <br>
                                                <span class="small">
                                                    ${new Date(event.datetime).toLocaleString(`en-${locale.code}`)}
                                                </span>
                                            </p>
                                            <hr class="clr-white">
                                            <p>
                                                Booking complete? Please confirm that you attended and we'll proceed with payment.<br><br>
                                                If you don't confirm within 3 days we'll go ahead and process the payment for the booking.<br><br>
                                                There's also a button incase you didn't make it to the event.
                                            </p>
                                            <hr class="clr-white mb-0">
                                        </div>
                                    
                                        <!-- Modal footer -->
                                        <div class="modal-footer clr-dark p-2">
                                            <div class="text-center">
                                                <button type="button" class="btn m-1 clr-cancel btn-close-confirm" data-dismiss="modal">Not Finished Yet</button>
                                                <button type="button" class="btn m-1 btn-danger btn-confirm-event" data-attended="false" data-event="${event.id}">Didn't Attend</button>
                                                <button type="button" class="btn m-1 clr-primary btn-confirm-event" data-attended="true" data-event="${event.id}">Event Finished</button>
                                            </div>
                                        </div>
                            
                                    </div>
                                </div>
                            </div>`;
            
                            $("body").append(dialog);
                        })
                );
            });

            Promise.all(dialogs)
                .then(function() {
                    $(".event-confirmation-modal").modal("show");
        
                    $(".btn-confirm-event").click(function() {
                        // Start loader and save event
                        ui.startLoader();
                        var event = $(this).data("event");
        
                        // Switch attendance
                        switch($(this).data("attended")) {
                            case false:
                                storage.get("login")
                                    .then(JSON.parse)
                                    .then(function(u) {
                                        return api.saveArtistAttendance(event, u.userId, false);
                                    })
                                    .then(ui.endLoader);
                                break;

                            case true:
                                storage.get("login")
                                    .then(JSON.parse)
                                    .then(function(u) {
                                        return api.saveArtistAttendance(event, u.userId, true);
                                    })
                                    .then(ui.endLoader);
                                break;

                            default:
                                console.warn($(this));
                                break;
                        }
        
                        // Close dialog
                        $(this).siblings('.btn-close-confirm').first().click();
                    });
                });
        });
}