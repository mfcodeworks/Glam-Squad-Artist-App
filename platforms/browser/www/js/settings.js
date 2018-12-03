// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as settings from './settings-functions';
import * as tools from './tools';
import * as ui from './ui-tools';

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

        // Check network connection
        tools.monitorNetwork()
            .then(function() {

                // Register UI handlers
                tools.handleLogout();
                ui.formToggle();
                settings.fillUserInfo();
                settings.handlePayment();
                settings.updateUserHandler();
                settings.getCards();
                settings.getUserEvents();

                // Auth check
                settings.authenticatedCheck();

                // Network error alert
            }, function(e) {
                navigator.notification.alert(
                    "Please conect to the internet before opening NR Glam Squad.",
                    function() {
                        navigator.app.exitApp();
                    },
                    e,
                    "Okay"
                );
            })
            // Remove splash after all loaded
            .then(function() {
                ui.removeSplash();
            });
    },
    
    // Back button handler
    onBackButton: function() {
        if( ($("#register-dialog-modal").data("bs.modal") || {})._isShown ) {
            $("#btn-cancel-register").click();
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