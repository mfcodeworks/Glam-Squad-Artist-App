// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as push from './push';
import * as tools from './tools';
import * as map from './map-functions';
import * as api from './api';
import * as lightbox from './lightbox';

// app var
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        // Handle back button
        document.addEventListener("backbutton", this.onBackButton.bind(this), false);

        // Check network connection (!important for API)
        tools.monitorNetwork()
            .then(function() {
                // Notification handler
                push.handle();

                // UI handlers
                tools.handleLogout();
                api.getNewEvents();
                lightbox.start();

                // Auth check
                map.authenticatedCheck();

                // Begin map load
                navigator.geolocation.getCurrentPosition(
                    map.onMapSuccess, 
                    map.onMapError, 
                    { 
                        enableHighAccuracy: false,
                        // 5 seconds timeout
                        timeout: (5 * 1000),
                        // max age for cache use 5 seconds 
                        maximumAge: (5 * 1000), 
                    }
                );
                
                // Network connection error alert
            }, function(e) {
                navigator.notification.alert(
                    "Please conect to the internet before opening NR Glam Squad.",
                    function() {
                        navigator.app.exitApp();
                    },
                    e,
                    "Okay"
                );
            });
    },

    // Back button handler
    onBackButton: function() {
        if( ($("#create-card-modal").data("bs.modal") || {})._isShown ) {
            $("#btn-close-create-card").click();
        }
        else if( ($("#event-dialog-modal").data("bs.modal") || {})._isShown ) {
            $("#btn-close-event").click();
        }
        else {
            navigator.notification.confirm(
                "Close NR Glam Squad?",
                function(index) {
                    if(index == 1) navigator.app.exitApp();
                },
                "Exit",
                ["Exit", "Cancel"]
            );
        }
    }
};

// start app
app.initialize();