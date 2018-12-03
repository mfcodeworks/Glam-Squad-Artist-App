// imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as ui from './ui-tools';
import * as session from './session';
import * as api from './api';
import * as tools from './tools';
import * as payment from './payment';

// map var
var map;
// user lat/lng
var lat;
var long;
// current marker
var marker = null;
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
    loadMap();
};

function loadMap() {
    $(document).ready(function() {
        // Add map to app
        makeMap();

        // Add geocoder to map
        addGeocoder();
        
        // Observe map for clicks and reverse geocode
        addMapClickMarker();
    });
}

// Handle location errors TODO: handle errors on device
export function onMapError(error) {
    console.log('code: ' + error.code + '\n' +'message: ' + error.message + '\n');
    switch(error.code) {
        case 1:
            navigator.notification.alert(
                "It's recommended to enable location to make booking events easier.", 
                mapDefault,
                "Location Access Denied",
                "Continue"
            );
            break;

        case 2:
            navigator.notification.alert(
                "Unable to access location. Ensure device is connected to a network and GPS is enabled.", 
                mapDefault,
                "Location Access Error",
                "Continue"
            );
            break;

        case 3:
            navigator.notification.alert(
                "Unable to access location. Please enable location access to make booking events easier.",
                mapDefault,
                "Location Access Error",
                "Continue"
            );
            break;
    }
};

function mapDefault() {
    lat = 34.052;
    long = -118.243;
    loadMap();
}

/** 
 * API: Mapbox GL JS API 
 */

// Make map from location
function makeMap() {
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
    });
};

// Create geocoder for map
function addGeocoder() {
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
};

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
    // CHANGED: Only one marker allowed as of v0.1.7
    // Set marker ID as the length of markers array
    //var markerID = markers.length;
    if(marker != null) {
        marker.remove();
    }

    // Create marker point div
    var point = document.createElement('div');
    point.className = 'event-marker';

    // Create popup with address, TODO: handle create event button
    var popup = new mapboxgl.Popup(
        {
            anchor: 'bottom',
            offset: 25,
            closeOnClick: true,
        })
        .setHTML('\
            <div class=\'marker-popup\'> \
                <h6>' + address + '</h6> \
                <button type="button" class="btn-delete-marker btn clr-cancel">Cancel</button>&nbsp; \
                <button type="button" class="btn-open-booking-dialog btn clr-primary" data-toggle="modal" data-target="#event-dialog-modal" value="' + address + '">Book Glam Squad</button> \
            </div> \
        ');

    // Make marker with popup on map
    marker = new mapboxgl.Marker(point)
        .setLngLat(lnglat)
        .setPopup(popup)
        .addTo(map);

    // Watch for delete marker
    $(document).on('click', 'button.btn-delete-marker', function() {
        // Remove marker
        marker.remove();
    });

    // Watch for booking dialog button
    $(document).on('click', 'button.btn-open-booking-dialog', function() {
        api.autofillEventForm($(this));
    });
};

export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(r) {
            if(!r) tools.load("login.html");
        });
}

export function handlePayment() {
    return new Promise(function(resolve) {
        var stripe = Stripe('pk_test_q4I6d4V8onnBC31PJOdKjY8i');
        var elements = stripe.elements();
    
        $(document).ready(function() {
            // Custom styling can be passed to options when creating an Element.
            var style = {
                base: {
                    // Add your base input styles here. For example:
                    fontSize: '16px',
                    color: '#fff',
                    iconColor: '#fff',
                    
                }
            };
    
            // Create an instance of the card Element.
            var card = elements.create('card', {style: style});
    
            // Add an instance of the card Element into the `card-element` <div>.
            card.mount('#card-element');
    
            // Handle card errors
            card.addEventListener('change', function(e) {
                var displayError = document.getElementById('card-errors');
                if (e.error) {
                    displayError.textContent = e.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
    
            $("#btn-save-card").click(function() {
                ui.startLoader();

                stripe.createToken(card)
                    .then(function(r) {
                        if (r.error) {
                            // Inform the customer that there was an error.
                            var errorElement = document.getElementById('card-errors');
                            errorElement.textContent = r.error.message;

                            ui.endLoader();
                        } else {
                            var token = r.token;
                            console.log(token);
    
                            var save = $("#save-card").prop('checked');
    
                            if(save) { 
                                // Get user data
                                session.get("login")
                                    .then(function(r) {
                                        // Create customer info object
                                        var customerData = {
                                            formContext: "save-client-payment-info",
                                            type: token.card.brand,
                                            lastFour: parseInt(token.card.last4),
                                            token: token.card.id,
                                            userID: parseInt(JSON.parse(r).userId),
                                        }
                    
                                        payment.getCustomerId(token.id)
                                            .then(function(r) {
                                                customerData.stripeId = r;
                    
                                                console.log(customerData);
        
                                                api.saveClientPaymentInfo(customerData)
                                                    .then(function() {
                                                        var html = "<option data-card=\'" + token.card.id + "\' selected='selected'>" + token.card.brand + " - " + token.card.last4 +"</option>";
                                                        $("#event-card-selection").append(html);
                                                        $("#event-card-selection").show();

                                                        ui.endLoader();
                                                    });
                                            });
                                    });
                            }
                            else {
                                // Get user data
                                session.get("login")
                                    .then(function(r) {
                                        // Create card info object
                                        var cardData = {
                                            formContext: "save-client-payment-info",
                                            type: token.card.brand,
                                            lastFour: parseInt(token.card.last4),
                                            token: token.id,
                                            userID: parseInt(JSON.parse(r).userId),
                                        }
                    
                                        api.saveClientPaymentInfo(cardData)
                                            .then(function() {
                                                var html = "<option data-card=\'" + token.id + "\' selected='selected'>" + token.card.brand + " - " + token.card.last4 +"</option>";
                                                $("#event-card-selection").append(html);
                                                $("#event-card-selection").show();

                                                ui.endLoader();
                                            });
                                    });
                            }
                            $("#btn-close-create-card").click();
                        }
                    });
            });
        });
        resolve(true);
    });
}