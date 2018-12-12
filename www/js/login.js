// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as ui from './ui-tools';
import * as login from './login-functions';
import * as tools from './tools';

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

        // Check for network connection
        tools.monitorNetwork()
            .then(function() {
                // Register form handlers
                ui.loginUserHandler();
                ui.registerUserHandler();
                ui.updatePortfolioImages();
                ui.fillArtistRoles();

                // Auth check
                login.authenticatedCheck();

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