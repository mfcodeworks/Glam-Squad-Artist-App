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
var long;
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
    long = parseFloat(position.coords.longitude.toFixed(3));

    saveUserLocale();
    
    return loadMap();
}

function mapDefault() {
    lat = 34.072;
    long = -118.358;
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
}

/** 
 * API: Mapbox GL JS API 
 */

function saveUserLocale() {
    return new Promise(function(resolve) {
        var reverseGeocodeURL = "https://api.mapbox.com/geocoding/v5/mapbox.places/"+long+","+lat+".json";

        $.get(
            reverseGeocodeURL,
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
                        push.subscribe(locale.country)
                            .then(resolve);
                    });
            }
        );
    })
}

// Make map from location
function makeMap() {
    return new Promise(function(resolve) {
        // Set user position array
        var position = [long, lat];
    
        // Make Mapbox GL Map
        mapboxgl.accessToken = 'pk.eyJ1IjoibWZzb2Z0d29ya3MiLCJhIjoiY2pudmZ5N3cwMDUwcTNwbm44ZzNnM201cCJ9.EsNcDPIULJ5_mhJYwOZEgA';
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
                    longitude: long,
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
        var reverseGeocodeURL = "https://api.mapbox.com/geocoding/v5/mapbox.places/"+e.lngLat.lng+","+e.lngLat.lat+".json";

        $.get(
            reverseGeocodeURL,
            {
                access_token: accessToken,
                types: "poi,address",
            },
            function(data) {
                for(var i = 0; i < data.features.length; i++) {
                    var geoResult = data.features[i];
                }
                
                var place = data.features[0]

                // Add marker to map at lat/lng
                // OLD: e.lngLat
                makeMapMarker(place.geometry.coordinates, place.place_name);
            }
        );
    });
};

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
        .setHTML('\
            <h6>' + address + '</h6> \
            <form id="artist-location"> \
                <div class="form-group"> \
                    <input type="text" class="form-control" name="location-shortname" id="location-shortname" placeholder="Home" data-lat="' + lnglat[1] + '" data-lng="' + lnglat[0] + '"> \
                </div> \
                <div class="form-group mb-0"> \
                    <button type="button" class="btn-delete-marker btn clr-cancel">Cancel</button>&nbsp; \
                    <button type="submit" class="btn clr-primary" >Save</button> \
                </div>\
            </form> \
        ');

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
};

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
        .setHTML('\
            <h4>' + loc.name + '</h4> \
            <form id="artist-saved-location"> \
                <div class="form-group mb-0"> \
                    <button type="button" class="btn-location-close btn clr-cancel">Cancel</button>&nbsp; \
                    <button type="submit" class="btn-location-delete btn clr-primary" data-location-id="' + loc.id + '">Delete</button> \
                </div>\
            </form> \
        ');

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

    var locId = $(".btn-location-delete").data("location-id");

    api.deleteLocation(locId)
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

            var events = d.data;

            if(!events) return;

            events.forEach(function(event) {
                console.log(event);

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
                                <p>
                                    Booking complete? Make sure to confirm with us your client attended and we'll proceed with payment. If you don't confirm within 3 days we'll go ahead and process the payment for the booking.
                                </p>
                                <p>
                                    ${event.address}
                                    <br>
                                    <span class="small">${new Date(event.datetime).toLocaleString()}</span>
                                </p>
                                <p>
                                    Did the client attend the event? (We don't like clients who book and never show up)
                                    <br>
                                    <div class="btn-group btn-group-toggle" data-toggle="buttons" data-client="${event.clientId}">
                                        <label class="btn btn-secondary active">
                                            <input type="radio" name="true" value="true" autocomplete="off" checked> Yes
                                        </label>
                                        <label class="btn btn-secondary">
                                            <input type="radio" name="false" value="false" autocomplete="off"> No
                                        </label>
                                    </div>
                                </p>
                            </div>
                        
                            <!-- Modal footer -->
                            <div class="modal-footer clr-dark">
                                <button type="button" class="btn clr-cancel" data-dismiss="modal">Not Finished Yet</button>
                                <button type="button" class="btn clr-primary btn-confirm-event" data-client="${event.clientId}" data-event="${event.id}">Confirm</button>
                            </div>
                
                        </div>
                    </div>
                </div>`;

                $("body").append(dialog);
            });

            $(".event-confirmation-modal").modal("show");

            $(".btn-confirm-event").click(function() {
                ui.startLoader();
                var client = $(this).data("client");
                var event = $(this).data("event");
                var response;

                $(`div[data-client="${client}"]`).children("label").each(function() {
                    if($(this).hasClass("active")) {
                        response = $(this).children("input").first().val();
                    }
                });

                api.saveClientAttendance(event, client, response)
                    .then(ui.endLoader)
                    .then(function() {
                        $(this).siblings('btn[data-dismiss="modal"]').click();
                    });
            });
        });
}