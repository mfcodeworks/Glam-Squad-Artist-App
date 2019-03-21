// imports
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'bootstrap';
import '@fortawesome/fontawesome-free';
import * as lightbox from '../lightbox';
import * as chat from '../chat';
import * as push from '../push';
import * as tools from '../tools';
import * as ui from '../ui';


// app const
const app = {
    // Application Constructor
    initialize: () => {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: () => {
        // Handle back button
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);

        // Check network connection (!important for API)
        tools.monitorNetwork()
            .then(() => {
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
                // Handle file downloading
                .then(ui.fileDownloadHandler)
                // Check list every 30 seconds
                .then((){setInterval(chat.listChannels, 30000);}) =>
                // End loading
                .finally(ui.endLoader);

                // Media lightbox handling
                lightbox.start();

                // Create media directory
                tools.createMediaDir();

                // Network connection error alert
            }, (e) => {
                navigator.notification.alert(
                    "Please conect to the internet before opening NR Glam Squad.",
                    () => {
                        navigator.app.exitApp();
                    },
                    e,
                    'Okay'
                );
            });
    },

    // Back button handler
    onBackButton: () => {
        const channelsView = $('div#channels');
        const chatView = $('div#chat');

        // Check which view is shown
        if (channelsView.hasClass('d-none')) {
            chatView.addClass('d-none');
            channelsView.removeClass('d-none');
            // Pause all videos on chat close
            $('video').each((index, e) => { e.currentTarget.pause(); });
        } else {
            tools.load('map.html');
        }
    }
}

// start app
app.initialize();