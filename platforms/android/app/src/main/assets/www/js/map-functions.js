// imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as ui from './ui-tools';
import * as api from './api';
import * as tools from './tools';
import * as push from './push';
import * as session from './session';

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
    
    loadMap();
};

function mapDefault() {
    lat = 34.072;
    long = -118.358;
    loadMap();
}

function loadMap() {
    $(document).ready(function() {
        // Add map to app
        makeMap();

        // Add geocoder to map
        addGeocoder();
        
        // Observe map for clicks and reverse geocode
        addMapClickMarker();

        // Add artist locations
        getLocations();
    });
}

function saveUserLocale() {
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

            session.save("locale", JSON.stringify(locale))
                .then(function() {
                    push.subscribe(locale.country);
                });
        }
    );
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
            <h4>' + loc.loc_name + '</h4> \
            <form id="artist-saved-location"> \
                <div class="form-group mb-0"> \
                    <button type="button" class="btn-location-close btn clr-cancel">Cancel</button>&nbsp; \
                    <button type="submit" class="btn-location-delete btn clr-primary" data-location-id="' + loc.id + '">Delete</button> \
                </div>\
            </form> \
        ');

    // Make marker with popup on map
    var marker = new mapboxgl.Marker(point)
        .setLngLat([loc.loc_lng, loc.loc_lat])
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

            if(l) {
                for(var i = 0; i < l.length; i++) {
                    makeLocationMarker(l[i]);
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
        });
}