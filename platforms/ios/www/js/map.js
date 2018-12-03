// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as ui from './ui-tools';
import * as api from './api';
import * as push from './push';
import * as tools from './tools';
import * as map from './map-functions';

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

                // Notification handler
                push.handle();

                // UI handlers
                api.processEventBooking();
                map.handlePayment();
                tools.handleLogout();
                ui.eventPackageSelector();
                ui.fillPaymentOptions();
                ui.updateBookingImages();

                // Auth check
                map.authenticatedCheck();

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