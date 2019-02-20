// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as lightbox from './lightbox';
import * as chat from './chat-functions';
import * as push from './push';
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

        // Check network connection (!important for API)
        tools.monitorNetwork()
            .then(function() {
                // Start loading
                ui.startLoader()

                // Auth check
                chat.authenticatedCheck();

                // Chat setup
                chat.init()
                // Token Expiry Handler
                .then(chat.expiryHandler)
                // Notification handler
                .then(push.handle)
                // Handle chat functions
                .then(ui.chatHandler)
                // List all channels
                .then(chat.listChannels)
                // Handle channel functions
                .then(ui.channelListHandler)
                // Check list every 30 seconds
                .then(function(){setInterval(chat.listChannels, 30000);})
                // End loading
                .finally(ui.endLoader);

                // Media lightbox handling
                lightbox.start();

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
        var channelsView = $("div#channels");
        var chatView = $("div#chat");

        // Check which view is shown
        if(channelsView.hasClass("d-none")) {
            chatView.addClass("d-none");
            channelsView.removeClass("d-none");
        } else {
            tools.load("map.html");
        }
    }
}

// start app
app.initialize();